-- Business-only delivery operations and accurate driver-cost snapshots.
alter table public.localhub_drivers
  add column if not exists vehicle_plate text,
  add column if not exists pix_key text,
  add column if not exists fee_per_delivery numeric(10,2) not null default 7.00;

alter table public.localhub_drivers
  drop constraint if exists localhub_drivers_fee_per_delivery_nonnegative;
alter table public.localhub_drivers
  add constraint localhub_drivers_fee_per_delivery_nonnegative
  check (fee_per_delivery >= 0);

alter table public.localhub_orders
  add column if not exists driver_fee_per_delivery_snapshot numeric(10,2),
  add column if not exists completed_at timestamptz;
alter table public.localhub_orders
  drop constraint if exists localhub_orders_driver_fee_snapshot_nonnegative;
alter table public.localhub_orders
  add constraint localhub_orders_driver_fee_snapshot_nonnegative
  check (driver_fee_per_delivery_snapshot is null or driver_fee_per_delivery_snapshot >= 0);

create or replace function private.localhub_plan_has_feature(p_business_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_feature in ('team', 'crm', 'white_label', 'video_portfolio')
      then private.localhub_effective_plan(p_business_id) in ('pro', 'business')
    when p_feature in ('self_service_kiosk', 'whatsapp_automation', 'delivery_management')
      then private.localhub_effective_plan(p_business_id) = 'business'
    when p_feature = 'multi_unit' then false
    else false
  end;
$$;
revoke all on function private.localhub_plan_has_feature(uuid, text) from public, anon, authenticated, service_role;
grant execute on function private.localhub_plan_has_feature(uuid, text) to anon, authenticated;

drop policy if exists "owners manage their delivery drivers" on public.localhub_drivers;
create policy "business owners manage entitled delivery drivers"
  on public.localhub_drivers for all to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_plan_has_feature(business_id, 'delivery_management')
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_plan_has_feature(business_id, 'delivery_management')
    )
  );

create or replace function private.enforce_localhub_delivery_plan_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (coalesce(new.delivery_fee_per_km, 0) > 0 or coalesce(new.delivery_base_km, 0) > 0)
     and not private.localhub_plan_has_feature(new.id, 'delivery_management')
     and (tg_op = 'INSERT'
          or new.delivery_fee_per_km is distinct from old.delivery_fee_per_km
          or new.delivery_base_km is distinct from old.delivery_base_km) then
    raise exception using errcode = '42501', message = 'PLAN_FEATURE:delivery_management';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_localhub_delivery_plan_entitlement() from public, anon, authenticated, service_role;
drop trigger if exists enforce_localhub_delivery_plan_entitlement on public.localhub_businesses;
create trigger enforce_localhub_delivery_plan_entitlement
  before insert or update of delivery_fee_per_km, delivery_base_km on public.localhub_businesses
  for each row execute function private.enforce_localhub_delivery_plan_entitlement();

create or replace function private.enforce_localhub_order_delivery_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee numeric(10,2);
begin
  if new.driver_id is not null and new.driver_id is distinct from old.driver_id then
    if not private.localhub_plan_has_feature(new.business_id, 'delivery_management') then
      raise exception using errcode = '42501', message = 'PLAN_FEATURE:delivery_management';
    end if;

    select driver.fee_per_delivery into v_fee
      from public.localhub_drivers driver
     where driver.id = new.driver_id and driver.business_id = new.business_id;
    if not found then
      raise exception using errcode = '23503', message = 'Entregador não pertence a este negócio.';
    end if;
    new.driver_fee_per_delivery_snapshot := v_fee;
  end if;

  if new.status = 'completed' and old.status is distinct from 'completed' and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_localhub_order_delivery_entitlement() from public, anon, authenticated, service_role;
drop trigger if exists enforce_localhub_order_delivery_entitlement on public.localhub_orders;
create trigger enforce_localhub_order_delivery_entitlement
  before update of driver_id, status on public.localhub_orders
  for each row execute function private.enforce_localhub_order_delivery_entitlement();
