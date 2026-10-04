alter table public.localhub_bookings
  add column if not exists service_duration_minutes integer;

update public.localhub_bookings booking
   set service_duration_minutes = service.duration_minutes
  from public.localhub_services service
 where service.id = booking.service_id
   and booking.service_duration_minutes is null;

alter table public.localhub_bookings
  alter column service_duration_minutes set not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'localhub_bookings_service_duration_minutes_check'
       and conrelid = 'public.localhub_bookings'::regclass
  ) then
    alter table public.localhub_bookings
      add constraint localhub_bookings_service_duration_minutes_check
      check (service_duration_minutes between 5 and 1440);
  end if;
end;
$$;

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
  business_date date := timezone('America/Sao_Paulo', now())::date;
  business_time time := timezone('America/Sao_Paulo', now())::time;
begin
  if p_booking_date < business_date then
    return;
  end if;

  select service.duration_minutes
    into requested_duration
    from public.localhub_services service
    join public.localhub_businesses business on business.id = service.business_id
   where business.id = p_business_id
     and business.is_published
     and service.id = p_service_id
     and service.is_active;

  if requested_duration is null then
    return;
  end if;

  return query
  select generated.slot::time
    from generate_series(
      p_booking_date + time '09:00',
      p_booking_date + time '18:00' - requested_duration * interval '1 minute',
      interval '30 minutes'
    ) as generated(slot)
   where (p_booking_date > business_date or generated.slot::time > business_time)
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

revoke all on function public.localhub_available_booking_slots(uuid, uuid, date) from public;
grant execute on function public.localhub_available_booking_slots(uuid, uuid, date) to anon, authenticated;

create or replace function public.prevent_localhub_booking_overlap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_duration integer;
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  perform 1
    from public.localhub_businesses business
   where business.id = new.business_id
   for update;

  select service.duration_minutes
    into requested_duration
    from public.localhub_services service
   where service.id = new.service_id
     and service.business_id = new.business_id;

  if requested_duration is null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.service_duration_minutes is null then
    new.service_duration_minutes := requested_duration;
  end if;

  if requested_duration > 540
     or new.booking_time < time '09:00'
     or extract(minute from new.booking_time)::integer % 30 <> 0
     or new.booking_time + requested_duration * interval '1 minute' > time '18:00' then
    raise exception using
      errcode = '23514',
      message = 'O horário solicitado está fora do expediente disponível.';
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

revoke all on function public.prevent_localhub_booking_overlap() from public;

drop trigger if exists localhub_bookings_prevent_overlap on public.localhub_bookings;
create trigger localhub_bookings_prevent_overlap
before insert or update of business_id, service_id, booking_date, booking_time, status
on public.localhub_bookings
for each row execute function public.prevent_localhub_booking_overlap();

notify pgrst, 'reload schema';
