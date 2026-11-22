-- Branch directory foundation. Branches are private operational metadata in
-- the private schema; all access is mediated by authenticated, owner-checked RPCs.
create table if not exists private.localhub_business_units (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  country_code char(2) not null default 'BR' check (country_code ~ '^[A-Z]{2}$'),
  city text not null check (length(btrim(city)) between 2 and 100),
  address text not null check (length(btrim(address)) between 5 and 240),
  phone text not null default '' check (length(phone) <= 32),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists localhub_business_units_business_active_idx
  on private.localhub_business_units (business_id, is_active, name);

alter table private.localhub_business_units enable row level security;
revoke all on private.localhub_business_units from public, anon, authenticated, service_role;

-- Business supports an unlimited number of branch records. Existing Pro and
-- Free access stays unchanged; this activates only after this migration runs.
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
    when p_feature in ('self_service_kiosk', 'whatsapp_automation', 'delivery_management', 'multi_unit')
      then private.localhub_effective_plan(p_business_id) = 'business'
    else false
  end;
$$;

revoke all on function private.localhub_plan_has_feature(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function private.localhub_plan_has_feature(uuid, text)
  to anon, authenticated;

create or replace function public.localhub_list_business_units(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_units jsonb;
begin
  if v_user_id is null or not exists (
    select 1
      from public.localhub_businesses business
     where business.id = p_business_id
       and business.owner_id = v_user_id
       and private.localhub_plan_has_feature(p_business_id, 'multi_unit')
  ) then
    raise exception 'FEATURE_UNAVAILABLE' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', unit.id,
    'name', unit.name,
    'country_code', unit.country_code,
    'city', unit.city,
    'address', unit.address,
    'phone', unit.phone,
    'is_active', unit.is_active,
    'created_at', unit.created_at,
    'updated_at', unit.updated_at
  ) order by unit.is_active desc, unit.name), '[]'::jsonb)
    into v_units
    from private.localhub_business_units unit
   where unit.business_id = p_business_id;

  return v_units;
end;
$$;

create or replace function public.localhub_save_business_unit(
  p_business_id uuid,
  p_unit_id uuid,
  p_name text,
  p_country_code text,
  p_city text,
  p_address text,
  p_phone text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_unit private.localhub_business_units%rowtype;
begin
  if v_user_id is null or not exists (
    select 1
      from public.localhub_businesses business
     where business.id = p_business_id
       and business.owner_id = v_user_id
       and private.localhub_plan_has_feature(p_business_id, 'multi_unit')
  ) then
    raise exception 'FEATURE_UNAVAILABLE' using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) not between 2 and 80
     or p_country_code is null or upper(btrim(p_country_code)) !~ '^[A-Z]{2}$'
     or p_city is null or length(btrim(p_city)) not between 2 and 100
     or p_address is null or length(btrim(p_address)) not between 5 and 240
     or length(coalesce(p_phone, '')) > 32 then
    raise exception 'INVALID_UNIT_DATA' using errcode = '22023';
  end if;

  if p_unit_id is null then
    insert into private.localhub_business_units (business_id, name, country_code, city, address, phone)
    values (p_business_id, btrim(p_name), upper(btrim(p_country_code)), btrim(p_city), btrim(p_address), btrim(coalesce(p_phone, '')))
    returning * into v_unit;
  else
    update private.localhub_business_units unit
       set name = btrim(p_name),
           country_code = upper(btrim(p_country_code)),
           city = btrim(p_city),
           address = btrim(p_address),
           phone = btrim(coalesce(p_phone, '')),
           updated_at = now()
     where unit.id = p_unit_id
       and unit.business_id = p_business_id
    returning * into v_unit;

    if not found then
      raise exception 'UNIT_NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  return jsonb_build_object(
    'id', v_unit.id,
    'name', v_unit.name,
    'country_code', v_unit.country_code,
    'city', v_unit.city,
    'address', v_unit.address,
    'phone', v_unit.phone,
    'is_active', v_unit.is_active,
    'created_at', v_unit.created_at,
    'updated_at', v_unit.updated_at
  );
end;
$$;

create or replace function public.localhub_set_business_unit_active(
  p_business_id uuid,
  p_unit_id uuid,
  p_is_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
  update private.localhub_business_units unit
     set is_active = p_is_active,
         updated_at = now()
   where unit.id = p_unit_id
     and unit.business_id = p_business_id
     and exists (
       select 1
         from public.localhub_businesses business
        where business.id = p_business_id
          and business.owner_id = (select auth.uid())
          and private.localhub_plan_has_feature(p_business_id, 'multi_unit')
     );

  select found;
$$;

revoke all on function public.localhub_list_business_units(uuid) from public, anon, authenticated;
revoke all on function public.localhub_save_business_unit(uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.localhub_set_business_unit_active(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.localhub_list_business_units(uuid) to authenticated;
grant execute on function public.localhub_save_business_unit(uuid, uuid, text, text, text, text, text)
  to authenticated;
grant execute on function public.localhub_set_business_unit_active(uuid, uuid, boolean)
  to authenticated;

notify pgrst, 'reload schema';
