create table if not exists public.localhub_delivery_areas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  fee numeric(10, 2) not null default 0 check (fee >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);

create index if not exists localhub_delivery_areas_business_idx
  on public.localhub_delivery_areas (business_id, is_active, name);

alter table public.localhub_orders
  add column if not exists delivery_area_id uuid,
  add column if not exists delivery_area_name text not null default '';

do $$ begin
  alter table public.localhub_orders
    add constraint localhub_orders_delivery_area_business_match
    foreign key (delivery_area_id, business_id)
    references public.localhub_delivery_areas (id, business_id)
    on delete set null (delivery_area_id);
exception when duplicate_object then null;
end $$;

alter table public.localhub_delivery_areas enable row level security;

drop policy if exists "owners manage their delivery areas" on public.localhub_delivery_areas;
create policy "owners manage their delivery areas"
  on public.localhub_delivery_areas for all to authenticated
  using (exists (
    select 1 from public.localhub_businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.localhub_businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ));

drop policy if exists "public reads active delivery areas" on public.localhub_delivery_areas;
create policy "public reads active delivery areas"
  on public.localhub_delivery_areas for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.localhub_businesses b
    where b.id = business_id and b.is_published
  ));

grant select, insert, update, delete on public.localhub_delivery_areas to authenticated;
grant select on public.localhub_delivery_areas to anon;

create or replace function public.localhub_apply_delivery_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_marker text[];
  v_area public.localhub_delivery_areas%rowtype;
  v_has_areas boolean;
begin
  if new.fulfillment <> 'delivery' then
    new.delivery_area_id := null;
    new.delivery_area_name := '';
    return new;
  end if;

  v_marker := regexp_match(new.delivery_address, E'\\[ELLO_BAIRRO:([0-9a-fA-F-]{36})\\]$');
  if v_marker is not null then
    select * into v_area
    from public.localhub_delivery_areas a
    where a.id = v_marker[1]::uuid
      and a.business_id = new.business_id
      and a.is_active;
    if not found then
      raise exception 'O bairro selecionado não está disponível para entrega.' using errcode = '22023';
    end if;
    new.delivery_area_id := v_area.id;
    new.delivery_area_name := v_area.name;
    new.delivery_fee := v_area.fee;
    new.delivery_address := btrim(regexp_replace(new.delivery_address, E'\\n\\[ELLO_BAIRRO:[0-9a-fA-F-]{36}\\]$', ''));
  else
    select exists (
      select 1 from public.localhub_delivery_areas a
      where a.business_id = new.business_id and a.is_active
    ) into v_has_areas;
    if v_has_areas then
      raise exception 'Selecione o bairro para calcular a entrega.' using errcode = '22023';
    end if;
    new.delivery_area_id := null;
    new.delivery_area_name := '';
  end if;
  new.total := new.subtotal + new.delivery_fee;
  return new;
end;
$$;

drop trigger if exists localhub_orders_apply_delivery_area on public.localhub_orders;
create trigger localhub_orders_apply_delivery_area
  before insert on public.localhub_orders
  for each row execute function public.localhub_apply_delivery_area();

revoke all on function public.localhub_apply_delivery_area() from public;
