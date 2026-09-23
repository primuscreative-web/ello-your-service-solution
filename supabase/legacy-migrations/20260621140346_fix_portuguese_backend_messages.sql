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
    v_message := 'Serviço marcado como concluído.';
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

update public.quote_messages
set body = replace(body, 'Servico marcado como concluido.', 'Serviço marcado como concluído.')
where body like '%Servico marcado como concluido.%';
