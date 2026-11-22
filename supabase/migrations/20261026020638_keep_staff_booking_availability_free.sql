-- Opening hours and booking availability remain free across all industries.
-- Paid tiers may limit team management, not the ability to view available times.
create or replace function public.localhub_available_booking_slots(
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
set search_path = ''
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

notify pgrst, 'reload schema';
