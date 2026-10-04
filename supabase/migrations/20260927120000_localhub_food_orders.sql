alter table public.localhub_businesses
  add column if not exists accepts_delivery boolean not null default true,
  add column if not exists accepts_pickup boolean not null default true,
  add column if not exists delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0);

alter table public.localhub_services
  add column if not exists menu_category text not null default '';

create table public.localhub_drivers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 100),
  phone text not null check (length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localhub_drivers_id_business_id_key unique (id, business_id)
);

create table public.localhub_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 100),
  customer_phone text not null check (length(regexp_replace(customer_phone, '[^0-9]', '', 'g')) between 10 and 15),
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  delivery_address text not null default '',
  notes text not null default '',
  payment_method text not null check (payment_method in ('cash', 'pix', 'card')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total = subtotal + delivery_fee),
  status text not null default 'received' check (status in ('received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  driver_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint localhub_orders_driver_business_match
    foreign key (driver_id, business_id)
    references public.localhub_drivers (id, business_id)
    on delete set null (driver_id)
);

create table public.localhub_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.localhub_orders(id) on delete cascade,
  service_id uuid references public.localhub_services(id) on delete set null,
  item_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 30),
  line_total numeric(10, 2) not null check (line_total = unit_price * quantity)
);

create index localhub_orders_business_created_idx on public.localhub_orders (business_id, created_at desc);
create index localhub_orders_driver_status_idx on public.localhub_orders (driver_id, status, created_at desc);
create index localhub_order_items_order_id_idx on public.localhub_order_items (order_id);
create index localhub_drivers_business_idx on public.localhub_drivers (business_id, is_active);

alter table public.localhub_drivers enable row level security;
alter table public.localhub_orders enable row level security;
alter table public.localhub_order_items enable row level security;

create policy "owners manage their delivery drivers"
  on public.localhub_drivers for all to authenticated
  using (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "owners read their orders"
  on public.localhub_orders for select to authenticated
  using (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "owners update their orders"
  on public.localhub_orders for update to authenticated
  using (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "owners read their order items"
  on public.localhub_order_items for select to authenticated
  using (exists (
    select 1 from public.localhub_orders o
    join public.localhub_businesses b on b.id = o.business_id
    where o.id = order_id and b.owner_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.localhub_drivers to authenticated;
grant select on public.localhub_orders, public.localhub_order_items to authenticated;
grant update (status, driver_id, updated_at) on public.localhub_orders to authenticated;
revoke all on public.localhub_orders, public.localhub_order_items, public.localhub_drivers from anon;
grant select (id, name, slug, category, city, phone, description, address, is_published, created_at,
  banner_url, onboarding_details, opening_hours, blocked_dates, accepts_delivery, accepts_pickup, delivery_fee)
  on public.localhub_businesses to anon;
grant select on public.localhub_services to anon, authenticated;

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
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
  v_subtotal numeric(10, 2);
  v_fee numeric(10, 2);
  v_order_id uuid;
  v_order_number bigint;
begin
  if length(btrim(coalesce(p_customer_name, ''))) not between 2 and 100
    or length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception 'Confira nome e telefone.' using errcode = '22023';
  end if;
  if p_fulfillment not in ('delivery', 'pickup') or p_payment_method not in ('cash', 'pix', 'card') then
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

  if exists (
    select 1 from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    where i.id is null or i.quantity is null or i.quantity not between 1 and 30
  ) then raise exception 'Confira as quantidades dos itens.' using errcode = '22023'; end if;

  select coalesce(sum(s.price * i.quantity), 0)::numeric(10, 2) into v_subtotal
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
    payment_method, subtotal, delivery_fee, total
  ) values (
    v_business.id, btrim(p_customer_name), regexp_replace(p_customer_phone, '[^0-9]', '', 'g'),
    p_fulfillment, case when p_fulfillment = 'delivery' then btrim(p_delivery_address) else '' end,
    left(btrim(coalesce(p_notes, '')), 500), p_payment_method, v_subtotal, v_fee, v_subtotal + v_fee
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
