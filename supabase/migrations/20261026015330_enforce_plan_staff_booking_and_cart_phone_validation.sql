-- Enforce paid team access inside the SECURITY DEFINER availability RPC.
-- Keep public business-hour availability, but do not reveal staff schedules on Free.
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
  if p_staff_id is not null
     and not private.localhub_plan_has_feature(p_business_id, 'team') then
    return;
  end if;

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

-- Use a non-shadowable search path and robust E.164 validation for public cart saves.
create or replace function public.localhub_save_abandoned_food_cart(
  p_slug text,
  p_phone text,
  p_items jsonb,
  p_recovery_consent boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
  v_phone text;
  v_cart jsonb;
  v_estimate numeric(10,2);
  v_cart_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'O carrinho não pode ser salvo.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
     where item.id is null or item.quantity is null or item.quantity not between 1 and 30
  ) then
    raise exception 'Confira os produtos e as quantidades do carrinho.' using errcode = '22023';
  end if;
  v_phone := case
    when left(btrim(coalesce(p_phone, '')), 1) = '+' then '+' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    when length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) between 10 and 11
      then '+55' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    else '+' || regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  end;
  if length(coalesce(p_phone, '')) > 32
     or length(v_phone) not between 9 and 16
     or left(v_phone, 1) <> '+'
     or substring(v_phone from 2) !~ '^[1-9][0-9]{7,14}$' then
    raise exception 'Informe um WhatsApp válido para salvar o carrinho.' using errcode = '22023';
  end if;
  select b.id into v_business_id from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;

  if not coalesce(p_recovery_consent, false) then
    update public.localhub_message_outbox m
       set status = 'cancelled'
     where m.business_id = v_business_id and m.destination = v_phone
       and m.trigger_type = 'abandoned_cart' and m.status = 'queued'
       and m.payload ->> 'cart_id' in (
         select c.id::text from public.localhub_abandoned_carts c
          where c.business_id = v_business_id and c.phone_e164 = v_phone
       );
    update public.localhub_abandoned_carts c
       set recovery_consent_at = null, recovery_message_queued_at = null
     where c.business_id = v_business_id and c.phone_e164 = v_phone
       and c.recovered_order_id is null;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_business_id::text || ':' || v_phone, 0));
  select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'quantity', item.quantity)
                   order by entry.ordinality),
         sum(s.price * item.quantity)::numeric(10,2)
    into v_cart, v_estimate
    from jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    cross join lateral jsonb_to_record(entry.value) as item(id uuid, quantity integer)
    join public.localhub_services s on s.id = item.id
   where s.business_id = v_business_id and s.is_active;
  if jsonb_array_length(coalesce(v_cart, '[]'::jsonb)) <> jsonb_array_length(p_items) then
    raise exception 'Um ou mais itens não estão mais disponíveis.' using errcode = '22023';
  end if;

  select c.id into v_cart_id from public.localhub_abandoned_carts c
   where c.business_id = v_business_id and c.phone_e164 = v_phone
     and c.recovered_order_id is null
   order by c.created_at desc limit 1 for update;
  if v_cart_id is null then
    insert into public.localhub_abandoned_carts
      (business_id, customer_id, phone_e164, cart, total_estimate, recovery_consent_at)
    values (
      v_business_id,
      (select customer.id from public.localhub_customers customer
        where customer.business_id = v_business_id and customer.phone_e164 = v_phone),
      v_phone, v_cart, v_estimate, now()
    );
  else
    update public.localhub_abandoned_carts
       set customer_id = (select customer.id from public.localhub_customers customer
                           where customer.business_id = v_business_id and customer.phone_e164 = v_phone),
           cart = v_cart,
           total_estimate = v_estimate,
           abandoned_at = now(),
           recovery_consent_at = now(),
           recovery_message_queued_at = null
     where id = v_cart_id;
  end if;
end;
$$;
