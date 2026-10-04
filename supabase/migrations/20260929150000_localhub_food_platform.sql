alter table public.localhub_businesses
  add column if not exists accepts_dine_in boolean not null default false,
  add column if not exists online_payment_enabled boolean not null default false,
  add column if not exists pix_key text not null default '',
  add column if not exists loyalty_enabled boolean not null default false,
  add column if not exists loyalty_mode text not null default 'points' check (loyalty_mode in ('points', 'cashback')),
  add column if not exists loyalty_rate numeric(8, 4) not null default 0 check (loyalty_rate between 0 and 1);

alter table public.localhub_services
  add column if not exists product_kind text not null default 'simple' check (product_kind in ('simple', 'variable')),
  add column if not exists ncm text not null default '',
  add column if not exists cest text not null default '',
  add column if not exists cfop text not null default '',
  add column if not exists fiscal_origin text not null default '',
  add column if not exists tax_regime_code text not null default '';

alter table public.localhub_orders
  add column if not exists source text not null default 'menu_online' check (source in ('menu_online', 'pdv_manual', 'whatsapp_ai_bot')),
  add column if not exists fulfillment text,
  add column if not exists payment_method text,
  add column if not exists payment_timing text not null default 'on_delivery' check (payment_timing in ('online', 'on_delivery', 'at_counter')),
  add column if not exists cash_change_for numeric(10, 2) check (cash_change_for is null or cash_change_for >= 0),
  add column if not exists customer_id uuid,
  add column if not exists external_reference text,
  add column if not exists idempotency_key text,
  add column if not exists public_tracking_token uuid not null default gen_random_uuid(),
  add column if not exists cash_session_id uuid,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.localhub_orders drop constraint if exists localhub_orders_fulfillment_check;
alter table public.localhub_orders add constraint localhub_orders_fulfillment_check
  check (fulfillment in ('delivery', 'pickup', 'dine_in'));
alter table public.localhub_orders drop constraint if exists localhub_orders_payment_method_check;
alter table public.localhub_orders add constraint localhub_orders_payment_method_check
  check (payment_method in ('cash', 'pix', 'card', 'online_pix', 'online_card'));
create unique index if not exists localhub_orders_idempotency_key_idx
  on public.localhub_orders (business_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists localhub_orders_external_reference_idx
  on public.localhub_orders (business_id, source, external_reference) where external_reference is not null;
create unique index if not exists localhub_orders_tracking_token_idx on public.localhub_orders (public_tracking_token);

create table if not exists public.localhub_product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  service_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 80),
  price_delta numeric(10,2) not null default 0,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.localhub_services(id, business_id) on delete cascade,
  unique (id, business_id)
);

create table if not exists public.localhub_product_option_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  service_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 80),
  required boolean not null default false,
  min_selections integer not null default 0 check (min_selections >= 0),
  max_selections integer not null default 1 check (max_selections between 1 and 30),
  is_active boolean not null default true,
  position integer not null default 0,
  foreign key (service_id, business_id) references public.localhub_services(id, business_id) on delete cascade,
  check (min_selections <= max_selections),
  unique (id, business_id)
);

create table if not exists public.localhub_product_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  group_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 80),
  price_delta numeric(10,2) not null default 0 check (price_delta >= 0),
  is_active boolean not null default true,
  position integer not null default 0,
  foreign key (group_id, business_id) references public.localhub_product_option_groups(id, business_id) on delete cascade
);

create index if not exists localhub_product_variants_service_idx on public.localhub_product_variants(service_id, position);
create index if not exists localhub_product_groups_service_idx on public.localhub_product_option_groups(service_id, position);
create index if not exists localhub_product_options_group_idx on public.localhub_product_options(group_id, position);

create table if not exists public.localhub_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 2 and 120),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email text,
  marketing_consent boolean not null default false,
  first_order_at timestamptz,
  last_order_at timestamptz,
  orders_count integer not null default 0 check (orders_count >= 0),
  lifetime_value numeric(12,2) not null default 0 check (lifetime_value >= 0),
  loyalty_balance numeric(12,2) not null default 0 check (loyalty_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, phone_e164),
  unique (id, business_id)
);

alter table public.localhub_orders drop constraint if exists localhub_orders_customer_business_fk;
alter table public.localhub_orders add constraint localhub_orders_customer_business_fk
  foreign key (customer_id, business_id) references public.localhub_customers(id, business_id) on delete set null (customer_id);
alter table public.localhub_orders add constraint localhub_orders_id_business_key unique (id, business_id);
create index if not exists localhub_customers_activity_idx on public.localhub_customers(business_id, last_order_at desc);

create table if not exists public.localhub_coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  code text not null check (code = upper(btrim(code)) and length(code) between 3 and 40),
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
  first_order_only boolean not null default false,
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, code),
  unique (id, business_id),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.localhub_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  coupon_id uuid not null references public.localhub_coupons(id) on delete restrict,
  order_id uuid not null references public.localhub_orders(id) on delete cascade,
  customer_id uuid references public.localhub_customers(id) on delete set null,
  discount_amount numeric(10,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  unique (order_id)
);
alter table public.localhub_coupon_redemptions add constraint localhub_coupon_redemptions_coupon_business_fk
  foreign key (coupon_id, business_id) references public.localhub_coupons(id, business_id) on delete restrict;
alter table public.localhub_coupon_redemptions add constraint localhub_coupon_redemptions_order_business_fk
  foreign key (order_id, business_id) references public.localhub_orders(id, business_id) on delete cascade;
alter table public.localhub_coupon_redemptions add constraint localhub_coupon_redemptions_customer_business_fk
  foreign key (customer_id, business_id) references public.localhub_customers(id, business_id) on delete set null (customer_id);

create table if not exists public.localhub_loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  customer_id uuid not null references public.localhub_customers(id) on delete cascade,
  order_id uuid references public.localhub_orders(id) on delete set null,
  entry_type text not null check (entry_type in ('earned_points', 'earned_cashback', 'redeemed', 'adjustment', 'expired')),
  amount numeric(12,2) not null check (amount <> 0),
  created_at timestamptz not null default now()
);
alter table public.localhub_loyalty_ledger add constraint localhub_loyalty_customer_business_fk
  foreign key (customer_id, business_id) references public.localhub_customers(id, business_id) on delete cascade;
alter table public.localhub_loyalty_ledger add constraint localhub_loyalty_order_business_fk
  foreign key (order_id, business_id) references public.localhub_orders(id, business_id) on delete set null (order_id);

create table if not exists public.localhub_abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  customer_id uuid references public.localhub_customers(id) on delete set null,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  cart jsonb not null default '[]'::jsonb check (jsonb_typeof(cart) = 'array'),
  total_estimate numeric(10,2) not null default 0 check (total_estimate >= 0),
  recovered_order_id uuid references public.localhub_orders(id) on delete set null,
  abandoned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.localhub_abandoned_carts add constraint localhub_abandoned_customer_business_fk
  foreign key (customer_id, business_id) references public.localhub_customers(id, business_id) on delete set null (customer_id);
alter table public.localhub_abandoned_carts add constraint localhub_abandoned_recovered_order_business_fk
  foreign key (recovered_order_id, business_id) references public.localhub_orders(id, business_id) on delete set null (recovered_order_id);

create table if not exists public.localhub_campaign_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  coupon_id uuid references public.localhub_coupons(id) on delete set null,
  target_url text not null default '',
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);
alter table public.localhub_campaign_links add constraint localhub_campaign_coupon_business_fk
  foreign key (coupon_id, business_id) references public.localhub_coupons(id, business_id) on delete set null (coupon_id);

create table if not exists public.localhub_message_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  customer_id uuid references public.localhub_customers(id) on delete set null,
  channel text not null check (channel in ('sms', 'email', 'whatsapp')),
  trigger_type text not null check (trigger_type in ('abandoned_cart', 'inactive_customer', 'order_update', 'campaign')),
  destination text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.localhub_message_outbox add constraint localhub_message_customer_business_fk
  foreign key (customer_id, business_id) references public.localhub_customers(id, business_id) on delete set null (customer_id);

create table if not exists public.localhub_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  closed_at timestamptz,
  closing_amount numeric(12,2) check (closing_amount is null or closing_amount >= 0),
  expected_amount numeric(12,2),
  notes text not null default '',
  check ((closed_at is null) = (closing_amount is null)),
  unique (id, business_id)
);
create unique index if not exists localhub_one_open_cash_session_per_business
  on public.localhub_cash_sessions(business_id) where closed_at is null;

create table if not exists public.localhub_cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  session_id uuid not null,
  movement_type text not null check (movement_type in ('withdrawal', 'addition')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null check (length(btrim(description)) between 2 and 160),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (session_id, business_id) references public.localhub_cash_sessions(id, business_id) on delete cascade
);
alter table public.localhub_orders drop constraint if exists localhub_orders_cash_session_fk;
alter table public.localhub_orders add constraint localhub_orders_cash_session_fk
  foreign key (cash_session_id, business_id) references public.localhub_cash_sessions(id, business_id) on delete set null (cash_session_id);

create table if not exists public.localhub_fiscal_emissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  order_id uuid references public.localhub_orders(id) on delete set null,
  document_kind text not null check (document_kind in ('nfce', 'nfe')),
  provider text not null default '',
  provider_reference text,
  status text not null default 'pending' check (status in ('pending', 'authorized', 'rejected', 'cancelled')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'localhub_product_variants', 'localhub_product_option_groups', 'localhub_product_options',
    'localhub_customers', 'localhub_coupons', 'localhub_coupon_redemptions', 'localhub_loyalty_ledger',
    'localhub_abandoned_carts', 'localhub_campaign_links', 'localhub_message_outbox',
    'localhub_cash_sessions', 'localhub_cash_movements', 'localhub_fiscal_emissions'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "owners manage own %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "owners manage own %1$s" on public.%1$I for all to authenticated using (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())))',
      table_name
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('revoke all on public.%I from anon', table_name);
  end loop;
end;
$$;

create or replace function public.localhub_upsert_food_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
  v_customer_id uuid;
begin
  v_phone := case
    when left(btrim(new.customer_phone), 1) = '+' then '+' || regexp_replace(new.customer_phone, '[^0-9]', '', 'g')
    when length(regexp_replace(new.customer_phone, '[^0-9]', '', 'g')) between 10 and 11
      then '+55' || regexp_replace(new.customer_phone, '[^0-9]', '', 'g')
    else '+' || regexp_replace(new.customer_phone, '[^0-9]', '', 'g')
  end;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefone inválido para cadastro do cliente.' using errcode = '22023';
  end if;
  insert into public.localhub_customers (business_id, full_name, phone_e164)
  values (new.business_id, btrim(new.customer_name), v_phone)
  on conflict (business_id, phone_e164) do update set
    full_name = excluded.full_name,
    orders_count = public.localhub_customers.orders_count + 1,
    last_order_at = now(), updated_at = now()
  returning id into v_customer_id;
  if (select orders_count from public.localhub_customers where id = v_customer_id) = 0 then
    update public.localhub_customers set orders_count = 1, first_order_at = now(), last_order_at = now()
    where id = v_customer_id;
  end if;
  new.customer_id := v_customer_id;
  return new;
end;
$$;

drop trigger if exists localhub_orders_upsert_customer on public.localhub_orders;
create trigger localhub_orders_upsert_customer
  before insert on public.localhub_orders for each row execute function public.localhub_upsert_food_customer();
revoke all on function public.localhub_upsert_food_customer() from public;

create or replace function public.localhub_update_food_customer_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.customer_id is not null then
    update public.localhub_customers
       set lifetime_value = lifetime_value + new.total, last_order_at = coalesce(new.completed_at, now()), updated_at = now()
     where id = new.customer_id;
    if new.completed_at is null then new.completed_at := now(); end if;
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' and new.customer_id is not null then
    update public.localhub_customers set orders_count = greatest(orders_count - 1, 0), updated_at = now()
    where id = new.customer_id;
    if new.cancelled_at is null then new.cancelled_at := now(); end if;
  end if;
  return new;
end;
$$;
drop trigger if exists localhub_orders_update_customer_totals on public.localhub_orders;
create trigger localhub_orders_update_customer_totals before update of status on public.localhub_orders
  for each row execute function public.localhub_update_food_customer_totals();
revoke all on function public.localhub_update_food_customer_totals() from public;

grant select (id, name, slug, category, city, phone, description, address, is_published, created_at,
  banner_url, onboarding_details, opening_hours, blocked_dates, accepts_delivery, accepts_pickup,
  delivery_fee, accepts_dine_in, online_payment_enabled, pix_key, loyalty_enabled, loyalty_mode, loyalty_rate)
  on public.localhub_businesses to anon;
grant select (id, business_id, name, description, duration_minutes, price, is_active, menu_category,
  product_kind, ncm, cest, cfop, fiscal_origin, tax_regime_code) on public.localhub_services to anon, authenticated;
grant select on public.localhub_product_variants, public.localhub_product_option_groups, public.localhub_product_options
  to anon, authenticated;
grant insert, update, delete on public.localhub_product_variants, public.localhub_product_option_groups,
  public.localhub_product_options to authenticated;

create policy "public reads active product variants"
  on public.localhub_product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from public.localhub_businesses b where b.id = business_id and b.is_published));
create policy "public reads active product option groups"
  on public.localhub_product_option_groups for select to anon, authenticated
  using (is_active and exists (select 1 from public.localhub_businesses b where b.id = business_id and b.is_published));
create policy "public reads active product options"
  on public.localhub_product_options for select to anon, authenticated
  using (is_active and exists (select 1 from public.localhub_businesses b where b.id = business_id and b.is_published));

create or replace function public.localhub_food_customers(p_business_id uuid)
returns table (
  id uuid, full_name text, phone_e164 text, email text, marketing_consent boolean,
  first_order_at timestamptz, last_order_at timestamptz, orders_count integer,
  lifetime_value numeric, loyalty_balance numeric, segment text
)
language sql stable security invoker set search_path = ''
as $$
  select c.id, c.full_name, c.phone_e164, c.email, c.marketing_consent,
    c.first_order_at, c.last_order_at, c.orders_count, c.lifetime_value, c.loyalty_balance,
    case
      when c.orders_count >= 5 or c.lifetime_value >= 500 then 'vip'
      when c.last_order_at < now() - interval '30 days' then 'inactive'
      when c.orders_count > 1 then 'recurring'
      else 'new'
    end
  from public.localhub_customers c
  where c.business_id = p_business_id
  order by c.last_order_at desc nulls last;
$$;
revoke all on function public.localhub_food_customers(uuid) from public;
grant execute on function public.localhub_food_customers(uuid) to authenticated;

create or replace function public.localhub_create_food_order(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns table (id uuid, order_number bigint, total numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
  v_subtotal numeric(10,2);
  v_fee numeric(10,2);
  v_order_id uuid;
  v_order_number bigint;
begin
  if length(btrim(coalesce(p_customer_name, ''))) not between 2 and 100
    or length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception 'Confira nome e telefone.' using errcode = '22023';
  end if;
  if p_fulfillment not in ('delivery', 'pickup', 'dine_in')
    or p_payment_method not in ('cash', 'pix', 'card', 'online_pix', 'online_card') then
    raise exception 'Forma de entrega ou pagamento inválida.' using errcode = '22023';
  end if;
  if p_fulfillment = 'delivery' and length(btrim(coalesce(p_delivery_address, ''))) < 8 then
    raise exception 'Informe o endereço completo para entrega.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Adicione itens ao pedido.' using errcode = '22023';
  end if;
  select * into v_business from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;
  if p_fulfillment = 'delivery' and not v_business.accepts_delivery then
    raise exception 'Esta loja não está aceitando entregas.' using errcode = '22023';
  end if;
  if p_fulfillment = 'pickup' and not v_business.accepts_pickup then
    raise exception 'Esta loja não está aceitando retirada.' using errcode = '22023';
  end if;
  if p_fulfillment = 'dine_in' and not v_business.accepts_dine_in then
    raise exception 'Esta loja não está aceitando consumo no local.' using errcode = '22023';
  end if;
  if p_payment_method in ('online_pix', 'online_card') and not v_business.online_payment_enabled then
    raise exception 'Pagamento online ainda não está configurado para esta loja.' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    where i.id is null or i.quantity is null or i.quantity not between 1 and 30) then
    raise exception 'Confira as quantidades dos itens.' using errcode = '22023';
  end if;
  select coalesce(sum(s.price * i.quantity), 0)::numeric(10,2) into v_subtotal
    from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    join public.localhub_services s on s.id = i.id
   where s.business_id = v_business.id and s.is_active;
  if (select count(*) from jsonb_to_recordset(p_items)) <>
    (select count(*) from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
      join public.localhub_services s on s.id = i.id where s.business_id = v_business.id and s.is_active) then
    raise exception 'Um ou mais itens não estão mais disponíveis.' using errcode = '22023';
  end if;
  v_fee := case when p_fulfillment = 'delivery' then v_business.delivery_fee else 0 end;
  insert into public.localhub_orders (
    business_id, customer_name, customer_phone, fulfillment, delivery_address, notes,
    payment_method, payment_timing, subtotal, delivery_fee, total
  ) values (
    v_business.id, btrim(p_customer_name), case when left(btrim(p_customer_phone), 1) = '+'
      then '+' || regexp_replace(p_customer_phone, '[^0-9]', '', 'g')
      else regexp_replace(p_customer_phone, '[^0-9]', '', 'g') end,
    p_fulfillment, case when p_fulfillment = 'delivery' then btrim(p_delivery_address) else '' end,
    left(btrim(coalesce(p_notes, '')), 500), p_payment_method,
    case when p_payment_method like 'online_%' then 'online'
         when p_fulfillment = 'dine_in' then 'at_counter' else 'on_delivery' end,
    v_subtotal, v_fee, v_subtotal + v_fee
  ) returning localhub_orders.id, localhub_orders.order_number into v_order_id, v_order_number;
  insert into public.localhub_order_items (order_id, service_id, item_name, unit_price, quantity, line_total)
  select v_order_id, s.id, s.name, s.price, i.quantity, s.price * i.quantity
    from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    join public.localhub_services s on s.id = i.id
   where s.business_id = v_business.id and s.is_active;
  return query select v_order_id, v_order_number, v_subtotal + v_fee;
end;
$$;
revoke all on function public.localhub_create_food_order(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.localhub_create_food_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

create or replace function public.localhub_create_food_order_for_menu(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns table (id uuid, order_number bigint, total numeric, tracking_token uuid)
language plpgsql security definer set search_path = ''
as $$
declare v_order record; v_token uuid;
begin
  select * into v_order from public.localhub_create_food_order(
    p_slug, p_customer_name, p_customer_phone, p_fulfillment, p_delivery_address,
    p_notes, p_payment_method, p_items
  );
  select public.localhub_orders.public_tracking_token into v_token
    from public.localhub_orders where public.localhub_orders.id = v_order.id;
  return query select v_order.id, v_order.order_number, v_order.total, v_token;
end;
$$;
revoke all on function public.localhub_create_food_order_for_menu(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.localhub_create_food_order_for_menu(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

create or replace function public.localhub_public_order_tracking(p_tracking_token uuid)
returns table (order_number bigint, business_name text, status text, fulfillment text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select o.order_number, b.name, o.status, o.fulfillment, o.created_at
    from public.localhub_orders o
    join public.localhub_businesses b on b.id = o.business_id and b.is_published
   where o.public_tracking_token = p_tracking_token
   limit 1;
$$;
revoke all on function public.localhub_public_order_tracking(uuid) from public;
grant execute on function public.localhub_public_order_tracking(uuid) to anon, authenticated;

create or replace function public.localhub_apply_food_loyalty()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_rate numeric(8,4); v_mode text; v_amount numeric(12,2); v_entry text;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.customer_id is null then return new; end if;
  select loyalty_rate, loyalty_mode into v_rate, v_mode from public.localhub_businesses
   where id = new.business_id and loyalty_enabled;
  if not found or v_rate <= 0 then return new; end if;
  v_amount := case when v_mode = 'points' then floor(new.total * v_rate) else round(new.total * v_rate, 2) end;
  if v_amount <= 0 then return new; end if;
  v_entry := case when v_mode = 'points' then 'earned_points' else 'earned_cashback' end;
  insert into public.localhub_loyalty_ledger (business_id, customer_id, order_id, entry_type, amount)
   values (new.business_id, new.customer_id, new.id, v_entry, v_amount) on conflict do nothing;
  if found then update public.localhub_customers
    set loyalty_balance = loyalty_balance + v_amount, updated_at = now() where id = new.customer_id; end if;
  return new;
end;
$$;
drop trigger if exists localhub_orders_apply_food_loyalty on public.localhub_orders;
create trigger localhub_orders_apply_food_loyalty after update of status on public.localhub_orders
  for each row execute function public.localhub_apply_food_loyalty();
revoke all on function public.localhub_apply_food_loyalty() from public;

create or replace function public.localhub_create_pdv_food_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns table (id uuid, order_number bigint, total numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
  v_session uuid;
  v_order record;
begin
  select * into v_business from public.localhub_businesses
   where localhub_businesses.id = p_business_id and owner_id = (select auth.uid())
     and category = 'alimentacao';
  if not found then raise exception 'Negócio sem permissão para abrir o PDV.' using errcode = '42501'; end if;
  select id into v_session from public.localhub_cash_sessions
   where business_id = p_business_id and closed_at is null;
  if v_session is null then raise exception 'Abra o caixa antes de registrar uma venda.' using errcode = '22023'; end if;
  select * into v_order from public.localhub_create_food_order(
    v_business.slug, p_customer_name, p_customer_phone, p_fulfillment,
    p_delivery_address, p_notes, p_payment_method, p_items
  );
  update public.localhub_orders set source = 'pdv_manual', payment_timing = 'at_counter', cash_session_id = v_session,
    status = 'completed', completed_at = now()
   where localhub_orders.id = v_order.id and business_id = p_business_id;
  return query select v_order.id, v_order.order_number, v_order.total;
end;
$$;
revoke all on function public.localhub_create_pdv_food_order(uuid, text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.localhub_create_pdv_food_order(uuid, text, text, text, text, text, text, jsonb) to authenticated;

create or replace function public.localhub_ingest_external_food_order(
  p_slug text,
  p_external_reference text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns table (id uuid, order_number bigint, total numeric, was_duplicate boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
  v_existing public.localhub_orders%rowtype;
  v_created record;
begin
  if length(btrim(coalesce(p_external_reference, ''))) not between 1 and 160 then
    raise exception 'Identificador externo inválido.' using errcode = '22023';
  end if;
  select * into v_business from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;
  select * into v_existing from public.localhub_orders o
   where o.business_id = v_business.id and o.source = 'whatsapp_ai_bot'
     and o.external_reference = p_external_reference;
  if found then
    return query select v_existing.id, v_existing.order_number, v_existing.total, true;
    return;
  end if;
  select * into v_created from public.localhub_create_food_order(
    p_slug, p_customer_name, p_customer_phone, p_fulfillment, p_delivery_address,
    p_notes, p_payment_method, p_items
  );
  update public.localhub_orders set source = 'whatsapp_ai_bot', external_reference = p_external_reference
   where localhub_orders.id = v_created.id;
  return query select v_created.id, v_created.order_number, v_created.total, false;
exception when unique_violation then
  select * into v_existing from public.localhub_orders o
   where o.business_id = v_business.id and o.source = 'whatsapp_ai_bot'
     and o.external_reference = p_external_reference;
  if not found then raise; end if;
  return query select v_existing.id, v_existing.order_number, v_existing.total, true;
end;
$$;
revoke all on function public.localhub_ingest_external_food_order(text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.localhub_ingest_external_food_order(text, text, text, text, text, text, text, text, jsonb) to service_role;

notify pgrst, 'reload schema';
