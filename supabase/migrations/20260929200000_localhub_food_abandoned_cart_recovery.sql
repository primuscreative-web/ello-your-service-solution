alter table public.localhub_abandoned_carts
  add column if not exists recovery_consent_at timestamptz,
  add column if not exists recovery_message_queued_at timestamptz;

create index if not exists localhub_abandoned_carts_phone_active_idx
  on public.localhub_abandoned_carts(business_id, phone_e164, created_at desc)
  where recovered_order_id is null;
create index if not exists localhub_abandoned_carts_recovery_queue_idx
  on public.localhub_abandoned_carts(business_id, abandoned_at)
  where recovery_consent_at is not null and recovered_order_id is null
    and recovery_message_queued_at is null;

create or replace function public.localhub_save_abandoned_food_cart(
  p_slug text,
  p_phone text,
  p_items jsonb,
  p_recovery_consent boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
  v_phone text;
  v_cart jsonb;
  v_estimate numeric(10,2);
  v_cart_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'O carrinho não pode ser salvo.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
     where item.id is null or item.quantity is null or item.quantity not between 1 and 30
  ) then
    raise exception 'Confira os produtos e as quantidades do carrinho.' using errcode = '22023';
  end if;
  v_phone := case
    when left(btrim(coalesce(p_phone, '')), 1) = '+' then '+' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    when length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) between 10 and 11
      then '+55' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    else '+' || regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  end;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Informe um WhatsApp válido para salvar o carrinho.' using errcode = '22023';
  end if;
  select b.id into v_business_id from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;

  if not coalesce(p_recovery_consent, false) then
    update public.localhub_message_outbox m
       set status = 'cancelled'
     where m.business_id = v_business_id and m.destination = v_phone
       and m.trigger_type = 'abandoned_cart' and m.status = 'queued'
       and m.payload ->> 'cart_id' in (
         select c.id::text from public.localhub_abandoned_carts c
          where c.business_id = v_business_id and c.phone_e164 = v_phone
       );
    update public.localhub_abandoned_carts c
       set recovery_consent_at = null, recovery_message_queued_at = null
     where c.business_id = v_business_id and c.phone_e164 = v_phone
       and c.recovered_order_id is null;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_business_id::text || ':' || v_phone, 0));
  select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'quantity', item.quantity)
                   order by entry.ordinality),
         sum(s.price * item.quantity)::numeric(10,2)
    into v_cart, v_estimate
    from jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    cross join lateral jsonb_to_record(entry.value) as item(id uuid, quantity integer)
    join public.localhub_services s on s.id = item.id
   where s.business_id = v_business_id and s.is_active;
  if jsonb_array_length(coalesce(v_cart, '[]'::jsonb)) <> jsonb_array_length(p_items) then
    raise exception 'Um ou mais itens não estão mais disponíveis.' using errcode = '22023';
  end if;

  select c.id into v_cart_id from public.localhub_abandoned_carts c
   where c.business_id = v_business_id and c.phone_e164 = v_phone
     and c.recovered_order_id is null
   order by c.created_at desc limit 1 for update;
  if v_cart_id is null then
    insert into public.localhub_abandoned_carts
      (business_id, customer_id, phone_e164, cart, total_estimate, recovery_consent_at)
    values (
      v_business_id,
      (select customer.id from public.localhub_customers customer
        where customer.business_id = v_business_id and customer.phone_e164 = v_phone),
      v_phone, v_cart, v_estimate, now()
    );
  else
    update public.localhub_abandoned_carts
       set customer_id = (select customer.id from public.localhub_customers customer
                           where customer.business_id = v_business_id and customer.phone_e164 = v_phone),
           cart = v_cart,
           total_estimate = v_estimate,
           abandoned_at = now(),
           recovery_consent_at = now(),
           recovery_message_queued_at = null
     where id = v_cart_id;
  end if;
end;
$$;
revoke all on function public.localhub_save_abandoned_food_cart(text, text, jsonb, boolean) from public;
grant execute on function public.localhub_save_abandoned_food_cart(text, text, jsonb, boolean) to anon, authenticated;

create or replace function public.localhub_queue_abandoned_food_cart_recovery(p_cart_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_cart public.localhub_abandoned_carts%rowtype;
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Entre novamente para preparar o lembrete.' using errcode = '42501';
  end if;
  select c.* into v_cart from public.localhub_abandoned_carts c
   where c.id = p_cart_id for update;
  if not found then raise exception 'Carrinho não encontrado.' using errcode = 'P0002'; end if;
  select b.owner_id into v_owner_id from public.localhub_businesses b where b.id = v_cart.business_id;
  if v_owner_id is distinct from (select auth.uid()) then
    raise exception 'Você não tem permissão para este carrinho.' using errcode = '42501';
  end if;
  if v_cart.recovery_consent_at is null or v_cart.phone_e164 is null then
    raise exception 'Este cliente não autorizou o lembrete.' using errcode = '22023';
  end if;
  if v_cart.recovered_order_id is not null then
    raise exception 'Este pedido já foi concluído.' using errcode = '22023';
  end if;
  if v_cart.recovery_message_queued_at is not null then
    raise exception 'O lembrete deste carrinho já foi preparado.' using errcode = '22023';
  end if;
  if v_cart.abandoned_at > now() - interval '30 minutes'
     or v_cart.abandoned_at < now() - interval '7 days' then
    raise exception 'O carrinho ainda não está elegível para lembrete.' using errcode = '22023';
  end if;

  insert into public.localhub_message_outbox
    (business_id, customer_id, channel, trigger_type, destination, payload)
  values (
    v_cart.business_id, v_cart.customer_id, 'whatsapp', 'abandoned_cart', v_cart.phone_e164,
    jsonb_build_object('template', 'abandoned_cart_recovery', 'cart_id', v_cart.id, 'cart', v_cart.cart)
  );
  update public.localhub_abandoned_carts set recovery_message_queued_at = now() where id = v_cart.id;
end;
$$;
revoke all on function public.localhub_queue_abandoned_food_cart_recovery(uuid) from public, anon;
grant execute on function public.localhub_queue_abandoned_food_cart_recovery(uuid) to authenticated;

create or replace function public.localhub_mark_food_cart_recovered()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text;
begin
  v_phone := case
    when left(btrim(coalesce(new.customer_phone, '')), 1) = '+' then '+' || regexp_replace(new.customer_phone, '[^0-9]', '', 'g')
    when length(regexp_replace(coalesce(new.customer_phone, ''), '[^0-9]', '', 'g')) between 10 and 11
      then '+55' || regexp_replace(new.customer_phone, '[^0-9]', '', 'g')
    else '+' || regexp_replace(coalesce(new.customer_phone, ''), '[^0-9]', '', 'g')
  end;
  update public.localhub_message_outbox m
     set status = 'cancelled'
   where m.business_id = new.business_id and m.trigger_type = 'abandoned_cart'
     and m.status = 'queued'
     and m.payload ->> 'cart_id' in (
       select c.id::text from public.localhub_abandoned_carts c
        where c.business_id = new.business_id and c.phone_e164 = v_phone
     );
  update public.localhub_abandoned_carts c
     set recovered_order_id = new.id,
         customer_id = coalesce(c.customer_id, new.customer_id)
   where c.business_id = new.business_id and c.phone_e164 = v_phone
     and c.recovered_order_id is null;
  return new;
end;
$$;
drop trigger if exists localhub_orders_mark_food_cart_recovered on public.localhub_orders;
create trigger localhub_orders_mark_food_cart_recovered
  after insert on public.localhub_orders
  for each row execute function public.localhub_mark_food_cart_recovered();
revoke all on function public.localhub_mark_food_cart_recovered() from public;

notify pgrst, 'reload schema';
