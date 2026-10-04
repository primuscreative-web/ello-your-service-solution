alter table public.localhub_businesses
  add column if not exists gallery_urls text[] not null default '{}',
  add column if not exists booking_policy text not null default '';

alter table public.localhub_bookings
  add column if not exists staff_id uuid,
  add column if not exists addon_ids uuid[] not null default '{}';

create table if not exists public.localhub_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  specialty text not null default '',
  avatar_url text,
  weekly_hours jsonb not null default '{}',
  blocked_dates date[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localhub_staff_id_business_id_key unique (id, business_id)
);

create index if not exists localhub_staff_business_active_idx
  on public.localhub_staff (business_id, is_active);

create table if not exists public.localhub_service_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  service_id uuid not null,
  name text not null check (length(btrim(name)) between 2 and 80),
  duration_minutes integer not null default 0 check (duration_minutes between 0 and 180),
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localhub_service_addons_service_business_fk
    foreign key (service_id, business_id)
    references public.localhub_services (id, business_id) on delete cascade
);

create index if not exists localhub_service_addons_service_idx
  on public.localhub_service_addons (service_id, is_active);

alter table public.localhub_bookings
  add constraint localhub_bookings_staff_business_fk
  foreign key (staff_id, business_id)
  references public.localhub_staff (id, business_id)
  on delete set null (staff_id);

alter table public.localhub_staff enable row level security;
alter table public.localhub_service_addons enable row level security;

create policy "published businesses expose active staff"
  on public.localhub_staff for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.localhub_businesses business
      where business.id = business_id and business.is_published
    ))
    or exists (
      select 1 from public.localhub_businesses business
      where business.id = business_id and business.owner_id = (select auth.uid())
    )
  );

create policy "owners manage their staff"
  on public.localhub_staff for all to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));

create policy "published businesses expose active service add-ons"
  on public.localhub_service_addons for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.localhub_businesses business
      where business.id = business_id and business.is_published
    ))
    or exists (
      select 1 from public.localhub_businesses business
      where business.id = business_id and business.owner_id = (select auth.uid())
    )
  );

create policy "owners manage their service add-ons"
  on public.localhub_service_addons for all to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));

grant select (gallery_urls, booking_policy) on public.localhub_businesses to anon, authenticated;
grant update (gallery_urls, booking_policy) on public.localhub_businesses to authenticated;
grant select on public.localhub_staff to anon, authenticated;
grant insert, update, delete on public.localhub_staff to authenticated;
grant select on public.localhub_service_addons to anon, authenticated;
grant insert, update, delete on public.localhub_service_addons to authenticated;
grant insert (staff_id, addon_ids) on public.localhub_bookings to anon, authenticated;
grant update (staff_id) on public.localhub_bookings to authenticated;

drop policy if exists "business owners delete their media" on storage.objects;
create policy "business owners delete their media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop function if exists public.localhub_available_booking_slots(uuid, uuid, date);

create function public.localhub_available_booking_slots(
  p_business_id uuid,
  p_service_id uuid,
  p_booking_date date,
  p_staff_id uuid default null,
  p_addon_ids uuid[] default '{}'
)
returns table (slot_time time)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  requested_duration integer;
  business_hours jsonb;
  business_blocked_dates date[];
  staff_hours jsonb;
  staff_blocked_dates date[];
  weekday_hours jsonb;
  opening_time time;
  closing_time time;
  break_start time;
  break_end time;
  business_date date := timezone('America/Sao_Paulo', now())::date;
  business_time time := timezone('America/Sao_Paulo', now())::time;
begin
  if p_booking_date < business_date then
    return;
  end if;

  select service.duration_minutes, business.opening_hours, business.blocked_dates
    into requested_duration, business_hours, business_blocked_dates
    from public.localhub_services service
    join public.localhub_businesses business on business.id = service.business_id
   where business.id = p_business_id
     and business.is_published
     and service.id = p_service_id
     and service.is_active;

  if requested_duration is null then
    return;
  end if;

  if cardinality(coalesce(p_addon_ids, '{}')) > 0 then
    select requested_duration + coalesce(sum(addon.duration_minutes), 0)
      into requested_duration
      from public.localhub_service_addons addon
     where addon.business_id = p_business_id
       and addon.service_id = p_service_id
       and addon.id = any(p_addon_ids)
       and addon.is_active;

    if (select count(distinct addon.id)
          from public.localhub_service_addons addon
         where addon.business_id = p_business_id
           and addon.service_id = p_service_id
           and addon.id = any(p_addon_ids)
           and addon.is_active) <> cardinality(p_addon_ids) then
      return;
    end if;
  end if;

  if p_staff_id is not null then
    select staff.weekly_hours, staff.blocked_dates
      into staff_hours, staff_blocked_dates
      from public.localhub_staff staff
     where staff.id = p_staff_id
       and staff.business_id = p_business_id
       and staff.is_active;
    if not found then
      return;
    end if;
  end if;

  if p_booking_date = any(coalesce(business_blocked_dates, '{}'::date[]))
     or p_booking_date = any(coalesce(staff_blocked_dates, '{}'::date[])) then
    return;
  end if;

  weekday_hours := coalesce(
    staff_hours -> extract(isodow from p_booking_date)::integer::text,
    business_hours -> extract(isodow from p_booking_date)::integer::text
  );
  if coalesce((weekday_hours ->> 'closed')::boolean, true) then
    return;
  end if;

  opening_time := (weekday_hours ->> 'open')::time;
  closing_time := (weekday_hours ->> 'close')::time;
  break_start := nullif(weekday_hours ->> 'breakStart', '')::time;
  break_end := nullif(weekday_hours ->> 'breakEnd', '')::time;
  if opening_time is null or closing_time is null or closing_time <= opening_time then
    return;
  end if;

  return query
  select generated.slot::time
    from generate_series(
      p_booking_date + opening_time,
      p_booking_date + closing_time - requested_duration * interval '1 minute',
      interval '30 minutes'
    ) as generated(slot)
   where (p_booking_date > business_date or generated.slot::time > business_time)
     and (
       break_start is null
       or generated.slot::time >= break_end
       or generated.slot::time + requested_duration * interval '1 minute' <= break_start
     )
     and not exists (
       select 1
         from public.localhub_bookings booking
        where booking.business_id = p_business_id
          and booking.booking_date = p_booking_date
          and booking.status in ('pending', 'confirmed')
          and (p_staff_id is null or booking.staff_id is null or booking.staff_id = p_staff_id)
          and booking.booking_time < generated.slot::time + requested_duration * interval '1 minute'
          and booking.booking_time + booking.service_duration_minutes * interval '1 minute' > generated.slot::time
     )
   order by generated.slot;
end;
$$;

revoke all on function public.localhub_available_booking_slots(uuid, uuid, date, uuid, uuid[]) from public;
grant execute on function public.localhub_available_booking_slots(uuid, uuid, date, uuid, uuid[]) to anon, authenticated;

drop trigger if exists localhub_bookings_prevent_overlap on public.localhub_bookings;

create or replace function public.prevent_localhub_booking_overlap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_duration integer;
  business_hours jsonb;
  business_blocked_dates date[];
  staff_hours jsonb;
  staff_blocked_dates date[];
  weekday_hours jsonb;
  opening_time time;
  closing_time time;
  break_start time;
  break_end time;
  validate_schedule boolean;
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  validate_schedule := tg_op = 'INSERT';
  if tg_op = 'UPDATE' then
    validate_schedule := new.business_id is distinct from old.business_id
      or new.service_id is distinct from old.service_id
      or new.booking_date is distinct from old.booking_date
      or new.booking_time is distinct from old.booking_time
      or new.staff_id is distinct from old.staff_id
      or new.addon_ids is distinct from old.addon_ids;
  end if;

  perform 1 from public.localhub_businesses business where business.id = new.business_id for update;

  select service.duration_minutes, business.opening_hours, business.blocked_dates
    into requested_duration, business_hours, business_blocked_dates
    from public.localhub_services service
    join public.localhub_businesses business on business.id = service.business_id
   where service.id = new.service_id and service.business_id = new.business_id;

  if requested_duration is null then
    return new;
  end if;

  if cardinality(coalesce(new.addon_ids, '{}')) > 0 then
    if (select count(distinct addon.id)
          from public.localhub_service_addons addon
         where addon.business_id = new.business_id
           and addon.service_id = new.service_id
           and addon.id = any(new.addon_ids)
           and addon.is_active) <> cardinality(new.addon_ids) then
      raise exception using errcode = '23514', message = 'Um adicional selecionado não está mais disponível.';
    end if;
    select requested_duration + coalesce(sum(addon.duration_minutes), 0)
      into requested_duration
      from public.localhub_service_addons addon
     where addon.business_id = new.business_id
       and addon.service_id = new.service_id
       and addon.id = any(new.addon_ids)
       and addon.is_active;
  end if;

  if tg_op = 'UPDATE'
     and new.service_id is not distinct from old.service_id
     and new.addon_ids is not distinct from old.addon_ids then
    requested_duration := new.service_duration_minutes;
  else
    new.service_duration_minutes := requested_duration;
  end if;

  if new.staff_id is not null then
    select staff.weekly_hours, staff.blocked_dates
      into staff_hours, staff_blocked_dates
      from public.localhub_staff staff
     where staff.id = new.staff_id and staff.business_id = new.business_id and staff.is_active;
    if not found then
      raise exception using errcode = '23514', message = 'A profissional escolhida não está disponível.';
    end if;
  end if;

  weekday_hours := coalesce(
    staff_hours -> extract(isodow from new.booking_date)::integer::text,
    business_hours -> extract(isodow from new.booking_date)::integer::text
  );
  opening_time := (weekday_hours ->> 'open')::time;
  closing_time := (weekday_hours ->> 'close')::time;
  break_start := nullif(weekday_hours ->> 'breakStart', '')::time;
  break_end := nullif(weekday_hours ->> 'breakEnd', '')::time;

  if validate_schedule then
    if new.booking_date = any(coalesce(business_blocked_dates, '{}'::date[]))
       or new.booking_date = any(coalesce(staff_blocked_dates, '{}'::date[])) then
      raise exception using errcode = '23514', message = 'Esta data está fechada para agendamentos.';
    end if;
    if coalesce((weekday_hours ->> 'closed')::boolean, true)
       or opening_time is null or closing_time is null or closing_time <= opening_time
       or requested_duration > 540
       or new.booking_time < opening_time
       or mod(extract(epoch from (new.booking_time - opening_time)) / 60, 30) <> 0
       or new.booking_time + requested_duration * interval '1 minute' > closing_time then
      raise exception using errcode = '23514', message = 'O horário solicitado está fora da disponibilidade configurada.';
    end if;
    if break_start is not null and new.booking_time < break_end
       and new.booking_time + requested_duration * interval '1 minute' > break_start then
      raise exception using errcode = '23514', message = 'O horário solicitado conflita com o intervalo da profissional.';
    end if;
  end if;

  if exists (
    select 1 from public.localhub_bookings booking
     where booking.business_id = new.business_id
       and booking.booking_date = new.booking_date
       and booking.status in ('pending', 'confirmed')
       and booking.id is distinct from new.id
       and (new.staff_id is null or booking.staff_id is null or booking.staff_id = new.staff_id)
       and booking.booking_time < new.booking_time + requested_duration * interval '1 minute'
       and booking.booking_time + booking.service_duration_minutes * interval '1 minute' > new.booking_time
  ) then
    raise exception using errcode = '23P01', message = 'Este horário acabou de ficar indisponível. Escolha outro horário.';
  end if;

  return new;
end;
$$;

create trigger localhub_bookings_prevent_overlap
before insert or update of business_id, service_id, booking_date, booking_time, status, staff_id, addon_ids
on public.localhub_bookings
for each row execute function public.prevent_localhub_booking_overlap();

notify pgrst, 'reload schema';
