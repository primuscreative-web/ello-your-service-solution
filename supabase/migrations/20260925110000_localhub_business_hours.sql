alter table public.localhub_businesses
  add column if not exists opening_hours jsonb not null default '{"1":{"open":"09:00","close":"18:00","closed":false},"2":{"open":"09:00","close":"18:00","closed":false},"3":{"open":"09:00","close":"18:00","closed":false},"4":{"open":"09:00","close":"18:00","closed":false},"5":{"open":"09:00","close":"18:00","closed":false},"6":{"open":"09:00","close":"18:00","closed":false},"7":{"open":"09:00","close":"18:00","closed":false}}'::jsonb);

alter table public.localhub_businesses
  add column if not exists blocked_dates date[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'localhub_businesses_blocked_dates_limit'
       and conrelid = 'public.localhub_businesses'::regclass
  ) then
    alter table public.localhub_businesses
      add constraint localhub_businesses_blocked_dates_limit
      check (cardinality(blocked_dates) <= 180);
  end if;
end;
$$;

create or replace function public.localhub_opening_hours_valid(p_hours jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  day_entry record;
  opening text;
  closing text;
  break_start text;
  break_end text;
begin
  if jsonb_typeof(p_hours) is distinct from 'object' then
    return false;
  end if;
  if (select count(*) from jsonb_object_keys(p_hours)) <> 7 then
    return false;
  end if;

  for day_entry in select key, value from jsonb_each(p_hours) loop
    if day_entry.key !~ '^[1-7]$'
       or jsonb_typeof(day_entry.value -> 'closed') is distinct from 'boolean' then
      return false;
    end if;
    opening := day_entry.value ->> 'open';
    closing := day_entry.value ->> 'close';
    break_start := day_entry.value ->> 'breakStart';
    break_end := day_entry.value ->> 'breakEnd';
    if coalesce(opening !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
       or coalesce(closing !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
       or closing <= opening then
      return false;
    end if;
    if (break_start is null) <> (break_end is null) then
      return false;
    end if;
    if break_start is not null and (
      coalesce(break_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
      or coalesce(break_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
      or break_start <= opening
      or break_end <= break_start
      or break_end >= closing
    ) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'localhub_businesses_opening_hours_valid'
       and conrelid = 'public.localhub_businesses'::regclass
  ) then
    alter table public.localhub_businesses
      add constraint localhub_businesses_opening_hours_valid
      check (public.localhub_opening_hours_valid(opening_hours));
  end if;
end;
$$;

grant select (opening_hours) on public.localhub_businesses to anon, authenticated;
grant select (blocked_dates) on public.localhub_businesses to anon, authenticated;
grant select (onboarding_details) on public.localhub_businesses to anon, authenticated;
grant update (booking_date, booking_time) on public.localhub_bookings to authenticated;

create or replace function public.localhub_available_booking_slots(
  p_business_id uuid,
  p_service_id uuid,
  p_booking_date date
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

  if p_booking_date = any(coalesce(business_blocked_dates, '{}'::date[])) then
    return;
  end if;

  weekday_hours := business_hours -> extract(isodow from p_booking_date)::integer::text;
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
         join public.localhub_services booked_service
           on booked_service.id = booking.service_id
          and booked_service.business_id = booking.business_id
        where booking.business_id = p_business_id
          and booking.booking_date = p_booking_date
          and booking.status in ('pending', 'confirmed')
          and booking.booking_time < generated.slot::time + requested_duration * interval '1 minute'
          and booking.booking_time + booking.service_duration_minutes * interval '1 minute' > generated.slot::time
     )
   order by generated.slot;
end;
$$;

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
      or new.booking_time is distinct from old.booking_time;
  end if;

  perform 1
    from public.localhub_businesses business
   where business.id = new.business_id
   for update;

  select service.duration_minutes, business.opening_hours, business.blocked_dates
    into requested_duration, business_hours, business_blocked_dates
    from public.localhub_services service
    join public.localhub_businesses business on business.id = service.business_id
   where service.id = new.service_id
     and service.business_id = new.business_id;

  if requested_duration is null then
    return new;
  end if;

  if tg_op = 'INSERT'
     or new.service_duration_minutes is null
     or (tg_op = 'UPDATE' and new.service_id is distinct from old.service_id) then
    new.service_duration_minutes := requested_duration;
  else
    requested_duration := new.service_duration_minutes;
  end if;

  if validate_schedule then
    if new.booking_date = any(coalesce(business_blocked_dates, '{}'::date[])) then
      raise exception using
        errcode = '23514',
        message = 'Esta data está fechada para agendamentos.';
    end if;

    weekday_hours := business_hours -> extract(isodow from new.booking_date)::integer::text;
    if coalesce((weekday_hours ->> 'closed')::boolean, true) then
      raise exception using errcode = '23514', message = 'Este dia não está disponível para agendamentos.';
    end if;

    opening_time := (weekday_hours ->> 'open')::time;
    closing_time := (weekday_hours ->> 'close')::time;
    break_start := nullif(weekday_hours ->> 'breakStart', '')::time;
    break_end := nullif(weekday_hours ->> 'breakEnd', '')::time;
    if opening_time is null or closing_time is null or closing_time <= opening_time
       or requested_duration > 540
       or new.booking_time < opening_time
       or mod(extract(epoch from (new.booking_time - opening_time)) / 60, 30) <> 0
       or new.booking_time + requested_duration * interval '1 minute' > closing_time then
      raise exception using
        errcode = '23514',
        message = 'O horário solicitado está fora do expediente disponível.';
    end if;

    if break_start is not null
       and new.booking_time < break_end
       and new.booking_time + requested_duration * interval '1 minute' > break_start then
      raise exception using
        errcode = '23514',
        message = 'O horário solicitado conflita com o intervalo do negócio.';
    end if;
  end if;

  if exists (
    select 1
      from public.localhub_bookings booking
      join public.localhub_services booked_service
        on booked_service.id = booking.service_id
       and booked_service.business_id = booking.business_id
     where booking.business_id = new.business_id
       and booking.booking_date = new.booking_date
       and booking.status in ('pending', 'confirmed')
       and booking.id is distinct from new.id
       and booking.booking_time < new.booking_time + requested_duration * interval '1 minute'
       and booking.booking_time + booking.service_duration_minutes * interval '1 minute' > new.booking_time
  ) then
    raise exception using
      errcode = '23P01',
      message = 'Este horário acabou de ficar indisponível. Escolha outro horário.';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
