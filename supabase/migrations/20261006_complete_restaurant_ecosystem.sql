-- Migration: 20261006_complete_restaurant_ecosystem.sql
-- Adiciona suporte ao ecossistema completo para restaurantes, lanchonetes e delivery na ELLO:
-- - Gestão e mapa de mesas
-- - Cadastro de motoboys e taxa por km
-- - Configurações de impressão térmica e segmentação (cozinha, bar, balcão)
-- - Contas a pagar e receber
-- - Integração iFood e Avaliações Google
-- - Programa de embaixadores e cashback

-- 1. Campos extras em localhub_businesses
alter table public.localhub_businesses
  add column if not exists google_reviews_url text,
  add column if not exists ambassador_reward_text text default 'Indique um amigo e ambos ganham R$ 10 de desconto',
  add column if not exists delivery_fee_per_km numeric(10, 2) default 0,
  add column if not exists delivery_base_km numeric(10, 2) default 0,
  add column if not exists auto_print_enabled boolean default false,
  add column if not exists print_kitchen_enabled boolean default true,
  add column if not exists print_bar_enabled boolean default false,
  add column if not exists ifood_connected boolean default false,
  add column if not exists ifood_merchant_id text,
  add column if not exists ifood_store_status text default 'offline',
  add column if not exists totem_autoatendimento_enabled boolean default true;

-- 2. Coluna de setor de preparo em localhub_services (para segmentação de impressão: cozinha, bar, etc.)
alter table public.localhub_services
  add column if not exists prep_station text default 'cozinha'; -- 'cozinha', 'bar', 'chapa', 'sobremesas', 'balcao'

-- 3. Tabela de Gestão de Mesas do Restaurante
create table if not exists public.localhub_restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  table_number integer not null,
  table_label text not null, -- ex: "Mesa 01", "Varanda 04", "Bistrô 02"
  seats integer not null default 4,
  status text not null default 'free', -- 'free', 'occupied', 'bill_requested', 'reserved'
  current_order_id uuid references public.localhub_orders(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, table_number)
);

create index if not exists idx_localhub_tables_business on public.localhub_restaurant_tables(business_id);

-- 4. Tabela de Motoboys e Entregadores Cadastrados
create table if not exists public.localhub_restaurant_drivers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  vehicle_type text not null default 'moto', -- 'moto', 'bike', 'carro'
  vehicle_plate text,
  pix_key text,
  fee_per_delivery numeric(10, 2) not null default 7.00,
  is_active boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_localhub_drivers_business on public.localhub_restaurant_drivers(business_id);

-- 5. Coluna de motoboy e mesa associados ao pedido em localhub_orders
alter table public.localhub_orders
  add column if not exists driver_id uuid references public.localhub_restaurant_drivers(id) on delete set null,
  add column if not exists table_id uuid references public.localhub_restaurant_tables(id) on delete set null,
  add column if not exists table_number integer,
  add column if not exists printed_at timestamptz,
  add column if not exists external_platform text default 'ello', -- 'ello', 'ifood', 'whatsapp', 'pdv', 'totem'
  add column if not exists external_order_id text;

-- 6. Tabela de Contas a Pagar e Receber (Financeiro Completo)
create table if not exists public.localhub_bills (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  type text not null, -- 'payable' (a pagar) ou 'receivable' (a receber)
  description text not null,
  category text not null default 'fornecedores', -- 'fornecedores', 'aluguel', 'energia', 'folha', 'impostos', 'manutencao', 'outros'
  entity_name text, -- fornecedor ou cliente
  amount numeric(10, 2) not null,
  due_date date not null,
  payment_date date,
  status text not null default 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_localhub_bills_business_due on public.localhub_bills(business_id, due_date);

-- Permissões RLS
alter table public.localhub_restaurant_tables enable row level security;
alter table public.localhub_restaurant_drivers enable row level security;
alter table public.localhub_bills enable row level security;

-- Policies para proprietários dos estabelecimentos
drop policy if exists "Owners manage tables" on public.localhub_restaurant_tables;
create policy "Owners manage tables" on public.localhub_restaurant_tables
  for all using (
    exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

drop policy if exists "Public view active tables" on public.localhub_restaurant_tables;
create policy "Public view active tables" on public.localhub_restaurant_tables
  for select using (active = true);

drop policy if exists "Owners manage drivers" on public.localhub_restaurant_drivers;
create policy "Owners manage drivers" on public.localhub_restaurant_drivers
  for all using (
    exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

drop policy if exists "Owners manage bills" on public.localhub_bills;
create policy "Owners manage bills" on public.localhub_bills
  for all using (
    exists (select 1 from public.localhub_businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

grant select, insert, update, delete on public.localhub_restaurant_tables to authenticated;
grant select on public.localhub_restaurant_tables to anon;
grant select, insert, update, delete on public.localhub_restaurant_drivers to authenticated;
grant select, insert, update, delete on public.localhub_bills to authenticated;
