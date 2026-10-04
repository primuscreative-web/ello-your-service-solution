alter table public.localhub_orders
  add column if not exists discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  add column if not exists coupon_code text;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
      from pg_constraint
     where conrelid = 'public.localhub_orders'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%subtotal%delivery_fee%'
  loop
    execute format('alter table public.localhub_orders drop constraint %I', constraint_name);
  end loop;
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.localhub_orders'::regclass
       and conname = 'localhub_orders_total_after_discount_check'
  ) then
    alter table public.localhub_orders add constraint localhub_orders_total_after_discount_check
      check (total = subtotal + delivery_fee - discount_amount);
  end if;
end;
$$;

create or replace function public.localhub_calculate_food_coupon(
  p_business_id uuid,
  p_code text,
  p_phone text,
  p_subtotal numeric,
  p_ignore_order_id uuid default null
)
returns table (coupon_id uuid, normalized_code text, discount_amount numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  v_coupon public.localhub_coupons%rowtype;
  v_phone text;
  v_customer_id uuid;
  v_usage_count integer;
  v_customer_usage_count integer;
  v_discount numeric(10,2);
begin
  if p_business_id is null or length(btrim(coalesce(p_code, ''))) not between 3 and 40
    or p_subtotal is null or p_subtotal < 0 then
    raise exception 'Confira o cupom e o valor do pedido.' using errcode = '22023';
  end if;
  v_phone := case
    when left(btrim(coalesce(p_phone, '')), 1) = '+' then '+' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    when length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) between 10 and 11
      then '+55' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    else '+' || regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  end;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Informe um WhatsApp válido para conferir este cupom.' using errcode = '22023';
  end if;

  select * into v_coupon
    from public.localhub_coupons c
   where c.business_id = p_business_id
     and c.code = upper(btrim(p_code))
     and c.is_active
     and (c.starts_at is null or c.starts_at <= now())
     and (c.ends_at is null or c.ends_at > now())
   for update;
  if not found then
    raise exception 'Cupom inválido ou fora do período de validade.' using errcode = '22023';
  end if;
  if p_subtotal < v_coupon.minimum_order then
    raise exception 'O pedido mínimo para este cupom é R$ %.', to_char(v_coupon.minimum_order, 'FM999999990D00') using errcode = '22023';
  end if;

  select c.id into v_customer_id
    from public.localhub_customers c
   where c.business_id = p_business_id and c.phone_e164 = v_phone;
  if v_coupon.first_order_only and v_customer_id is not null and exists (
    select 1 from public.localhub_orders o
     where o.business_id = p_business_id and o.customer_id = v_customer_id
       and o.id is distinct from p_ignore_order_id and o.status <> 'cancelled'
  ) then
    raise exception 'Este cupom é válido apenas para a primeira compra.' using errcode = '22023';
  end if;

  select count(*)::integer into v_usage_count
    from public.localhub_coupon_redemptions r
   where r.business_id = p_business_id and r.coupon_id = v_coupon.id;
  if v_coupon.usage_limit is not null and v_usage_count >= v_coupon.usage_limit then
    raise exception 'Este cupom atingiu o limite de utilizações.' using errcode = '22023';
  end if;
  if v_coupon.per_customer_limit is not null and v_customer_id is not null then
    select count(*)::integer into v_customer_usage_count
      from public.localhub_coupon_redemptions r
     where r.business_id = p_business_id and r.coupon_id = v_coupon.id
       and r.customer_id = v_customer_id;
    if v_customer_usage_count >= v_coupon.per_customer_limit then
      raise exception 'Você já atingiu o limite de uso deste cupom.' using errcode = '22023';
    end if;
  end if;

  v_discount := least(
    p_subtotal,
    case when v_coupon.discount_type = 'percent'
      then round(p_subtotal * v_coupon.discount_value / 100, 2)
      else v_coupon.discount_value end
  );
  return query select v_coupon.id, v_coupon.code, v_discount;
end;
$$;
revoke all on function public.localhub_calculate_food_coupon(uuid, text, text, numeric, uuid) from public, anon, authenticated;

create or replace function public.localhub_preview_food_coupon(
  p_slug text,
  p_code text,
  p_phone text,
  p_subtotal numeric
)
returns table (code text, discount_amount numeric)
language plpgsql security definer set search_path = ''
as $$
declare v_business_id uuid;
begin
  select b.id into v_business_id from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;
  return query
    select c.normalized_code, c.discount_amount
      from public.localhub_calculate_food_coupon(v_business_id, p_code, p_phone, p_subtotal) c;
end;
$$;
revoke all on function public.localhub_preview_food_coupon(text, text, text, numeric) from public;
grant execute on function public.localhub_preview_food_coupon(text, text, text, numeric) to anon, authenticated;

create or replace function public.localhub_create_food_order_for_menu(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb,
  p_coupon_code text
)
returns table (id uuid, order_number bigint, total numeric, tracking_token uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_order record;
  v_coupon record;
  v_tracking_token uuid;
begin
  select * into v_order from public.localhub_create_food_order(
    p_slug, p_customer_name, p_customer_phone, p_fulfillment, p_delivery_address,
    p_notes, p_payment_method, p_items
  );
  if length(btrim(coalesce(p_coupon_code, ''))) > 0 then
    select c.coupon_id, c.normalized_code, c.discount_amount into v_coupon
      from public.localhub_calculate_food_coupon(
        (select o.business_id from public.localhub_orders o where o.id = v_order.id),
        p_coupon_code,
        p_customer_phone,
        (select o.subtotal from public.localhub_orders o where o.id = v_order.id),
        v_order.id
      ) c;
    update public.localhub_orders o
       set discount_amount = v_coupon.discount_amount,
           coupon_code = v_coupon.normalized_code,
           total = o.subtotal + o.delivery_fee - v_coupon.discount_amount
     where o.id = v_order.id;
    insert into public.localhub_coupon_redemptions
      (business_id, coupon_id, order_id, customer_id, discount_amount)
    select o.business_id, v_coupon.coupon_id, o.id, o.customer_id, v_coupon.discount_amount
      from public.localhub_orders o where o.id = v_order.id;
    v_order.total := v_order.total - v_coupon.discount_amount;
  end if;
  select o.public_tracking_token into v_tracking_token
    from public.localhub_orders o where o.id = v_order.id;
  return query select v_order.id, v_order.order_number, v_order.total, v_tracking_token;
end;
$$;
revoke all on function public.localhub_create_food_order_for_menu(text, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.localhub_create_food_order_for_menu(text, text, text, text, text, text, text, jsonb, text) to anon, authenticated;

create or replace function public.localhub_release_food_coupon_on_cancel()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    delete from public.localhub_coupon_redemptions r where r.order_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists localhub_orders_release_coupon_on_cancel on public.localhub_orders;
create trigger localhub_orders_release_coupon_on_cancel
  after update of status on public.localhub_orders
  for each row execute function public.localhub_release_food_coupon_on_cancel();
revoke all on function public.localhub_release_food_coupon_on_cancel() from public;
