with ranked_appointments as (
  select
    id,
    row_number() over (
      partition by quote_request_id
      order by updated_at desc, created_at desc, id
    ) as row_number
  from public.appointments
  where quote_request_id is not null
)
delete from public.appointments
where id in (
  select id
  from ranked_appointments
  where row_number > 1
);

with ranked_slots as (
  select
    id,
    row_number() over (
      partition by professional_id, starts_at
      order by updated_at desc, created_at desc, id
    ) as row_number
  from public.appointments
  where status in ('pending', 'confirmed')
)
update public.appointments
set status = 'cancelled'
where id in (
  select id
  from ranked_slots
  where row_number > 1
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_quote_request_id_key'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_quote_request_id_key unique (quote_request_id);
  end if;
end;
$$;

create unique index if not exists appointments_professional_active_slot_key
  on public.appointments (professional_id, starts_at)
  where status in ('pending', 'confirmed');

create or replace function private.validate_appointment_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.starts_at <= now()
    and (tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at)
  then
    raise exception using
      errcode = '23514',
      message = 'appointment starts_at must be in the future';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
    ) then
      raise exception using
        errcode = '23514',
        message = 'invalid appointment status transition';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_appointment_write on public.appointments;
create trigger validate_appointment_write
  before insert or update on public.appointments
  for each row execute function private.validate_appointment_write();

drop policy if exists "appointments participant write" on public.appointments;
drop policy if exists "appointments participant insert" on public.appointments;
drop policy if exists "appointments participant update" on public.appointments;

create policy "appointments participant insert"
  on public.appointments for insert
  with check (
    exists (
      select 1
      from public.quote_requests q
      left join public.client_profiles c on c.id = q.client_id
      left join public.professional_profiles p on p.id = q.professional_id
      where q.id = appointments.quote_request_id
        and q.client_id = appointments.client_id
        and q.professional_id = appointments.professional_id
        and (c.user_id = auth.uid() or p.user_id = auth.uid())
    )
  );

create policy "appointments participant update"
  on public.appointments for update
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = appointments.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = appointments.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.quote_requests q
      left join public.client_profiles c on c.id = q.client_id
      left join public.professional_profiles p on p.id = q.professional_id
      where q.id = appointments.quote_request_id
        and q.client_id = appointments.client_id
        and q.professional_id = appointments.professional_id
        and (c.user_id = auth.uid() or p.user_id = auth.uid())
    )
  );

create or replace function private.propose_appointment(
  p_quote_request_id uuid,
  p_starts_at timestamptz,
  p_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_quote public.quote_requests;
  v_existing public.appointments;
  v_appointment public.appointments;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_starts_at <= now() then
    raise exception using errcode = '23514', message = 'appointment starts_at must be in the future';
  end if;

  select q.*
  into v_quote
  from public.quote_requests q
  join public.client_profiles c on c.id = q.client_id
  where q.id = p_quote_request_id
    and c.user_id = v_user_id
  for update of q;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'only the quote client can propose an appointment';
  end if;

  if v_quote.status in ('cancelled', 'declined', 'completed') then
    raise exception using
      errcode = '23514',
      message = 'quote does not accept appointments';
  end if;

  select a.*
  into v_existing
  from public.appointments a
  where a.quote_request_id = v_quote.id
  for update;

  if found and v_existing.status <> 'pending' then
    raise exception using
      errcode = '23514',
      message = 'only pending appointments can be rescheduled';
  end if;

  insert into public.appointments (
    quote_request_id,
    client_id,
    professional_id,
    service_id,
    starts_at,
    status,
    address,
    notes
  )
  values (
    v_quote.id,
    v_quote.client_id,
    v_quote.professional_id,
    v_quote.service_id,
    p_starts_at,
    'pending',
    v_quote.location,
    coalesce(nullif(btrim(p_notes), ''), v_quote.description)
  )
  on conflict (quote_request_id) do update
  set
    starts_at = excluded.starts_at,
    address = excluded.address,
    notes = excluded.notes,
    updated_at = now()
  returning * into v_appointment;

  insert into public.quote_messages (quote_request_id, sender_user_id, body)
  values (
    v_quote.id,
    v_user_id,
    'Agendamento proposto para '
      || to_char(p_starts_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
      || '.'
  );

  return v_appointment;
end;
$$;

create or replace function private.transition_appointment(
  p_appointment_id uuid,
  p_status public.appointment_status
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_quote_request_id uuid;
  v_appointment public.appointments;
  v_is_client boolean;
  v_is_professional boolean;
  v_message text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select a.quote_request_id
  into v_quote_request_id
  from public.appointments a
  where a.id = p_appointment_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'appointment not found';
  end if;

  if v_quote_request_id is not null then
    perform 1
    from public.quote_requests q
    where q.id = v_quote_request_id
    for update;
  end if;

  select a.*
  into v_appointment
  from public.appointments a
  where a.id = p_appointment_id
  for update;

  select exists (
    select 1
    from public.client_profiles c
    where c.id = v_appointment.client_id
      and c.user_id = v_user_id
  )
  into v_is_client;

  select exists (
    select 1
    from public.professional_profiles p
    where p.id = v_appointment.professional_id
      and p.user_id = v_user_id
  )
  into v_is_professional;

  if p_status = 'confirmed' then
    if not v_is_professional or v_appointment.status <> 'pending' then
      raise exception using
        errcode = '42501',
        message = 'only the professional can confirm a pending appointment';
    end if;
    v_message := 'Agendamento confirmado.';
  elsif p_status = 'completed' then
    if not v_is_professional or v_appointment.status <> 'confirmed' then
      raise exception using
        errcode = '42501',
        message = 'only the professional can complete a confirmed appointment';
    end if;
    v_message := 'Servico marcado como concluido.';
  elsif p_status = 'cancelled' then
    if not (v_is_client or v_is_professional)
      or v_appointment.status not in ('pending', 'confirmed')
    then
      raise exception using
        errcode = '42501',
        message = 'only participants can cancel an active appointment';
    end if;
    v_message := 'Agendamento cancelado.';
  else
    raise exception using errcode = '23514', message = 'invalid appointment status transition';
  end if;

  update public.appointments
  set status = p_status
  where id = v_appointment.id
  returning * into v_appointment;

  if v_appointment.quote_request_id is not null then
    if p_status = 'confirmed' then
      update public.quote_requests
      set status = 'accepted', accepted_at = now(), updated_at = now()
      where id = v_appointment.quote_request_id;
    elsif p_status = 'completed' then
      update public.quote_requests
      set status = 'completed', updated_at = now()
      where id = v_appointment.quote_request_id;
    elsif p_status = 'cancelled' then
      update public.quote_requests
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_appointment.quote_request_id;
    end if;

    insert into public.quote_messages (quote_request_id, sender_user_id, body)
    values (v_appointment.quote_request_id, v_user_id, v_message);
  end if;

  return v_appointment;
end;
$$;

create or replace function public.propose_appointment(
  p_quote_request_id uuid,
  p_starts_at timestamptz,
  p_notes text default null
)
returns public.appointments
language sql
set search_path = ''
as $$
  select private.propose_appointment(p_quote_request_id, p_starts_at, p_notes);
$$;

create or replace function public.transition_appointment(
  p_appointment_id uuid,
  p_status public.appointment_status
)
returns public.appointments
language sql
set search_path = ''
as $$
  select private.transition_appointment(p_appointment_id, p_status);
$$;

revoke all on function private.propose_appointment(uuid, timestamptz, text) from public, anon;
revoke all on function private.transition_appointment(uuid, public.appointment_status) from public, anon;
revoke all on function public.propose_appointment(uuid, timestamptz, text) from public, anon;
revoke all on function public.transition_appointment(uuid, public.appointment_status) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.propose_appointment(uuid, timestamptz, text) to authenticated;
grant execute on function private.transition_appointment(uuid, public.appointment_status) to authenticated;
grant execute on function public.propose_appointment(uuid, timestamptz, text) to authenticated;
grant execute on function public.transition_appointment(uuid, public.appointment_status) to authenticated;

revoke insert, update, delete on public.appointments from authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end;
$$;
