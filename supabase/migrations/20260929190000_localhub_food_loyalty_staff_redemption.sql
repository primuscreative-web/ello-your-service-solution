create or replace function public.localhub_redeem_food_loyalty(
  p_business_id uuid,
  p_customer_id uuid,
  p_balance_units numeric
)
returns table (remaining_balance numeric, discount_amount numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  v_mode text;
  v_balance numeric(12,2);
  v_discount numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Entre novamente para registrar o resgate.' using errcode = '42501';
  end if;
  select b.loyalty_mode into v_mode
    from public.localhub_businesses b
   where b.id = p_business_id
     and b.owner_id = (select auth.uid())
     and b.category = 'alimentacao'
     and b.loyalty_enabled;
  if not found then
    raise exception 'Você não tem permissão para registrar resgates neste negócio.' using errcode = '42501';
  end if;
  if p_balance_units is null or p_balance_units <= 0 then
    raise exception 'Informe um saldo válido para resgatar.' using errcode = '22023';
  end if;
  if v_mode = 'points' and p_balance_units <> trunc(p_balance_units) then
    raise exception 'A quantidade de pontos deve ser um número inteiro.' using errcode = '22023';
  end if;
  if v_mode = 'cashback' and p_balance_units <> round(p_balance_units, 2) then
    raise exception 'O cashback deve ser informado em centavos.' using errcode = '22023';
  end if;

  select c.loyalty_balance into v_balance
    from public.localhub_customers c
   where c.id = p_customer_id and c.business_id = p_business_id
   for update;
  if not found then
    raise exception 'Cliente não encontrado neste negócio.' using errcode = 'P0002';
  end if;
  if p_balance_units > v_balance then
    raise exception 'O saldo foi alterado ou é insuficiente. Atualize o CRM e tente novamente.' using errcode = '22023';
  end if;

  v_discount := case when v_mode = 'points'
    then round(p_balance_units / 100, 2)
    else p_balance_units end;
  if v_discount <= 0 then
    raise exception 'O valor do resgate deve ser maior que zero.' using errcode = '22023';
  end if;

  update public.localhub_customers c
     set loyalty_balance = c.loyalty_balance - p_balance_units,
         updated_at = now()
   where c.id = p_customer_id and c.business_id = p_business_id
   returning c.loyalty_balance into remaining_balance;
  insert into public.localhub_loyalty_ledger
    (business_id, customer_id, entry_type, amount)
  values (p_business_id, p_customer_id, 'redeemed', -p_balance_units);

  discount_amount := v_discount;
  return next;
end;
$$;
revoke all on function public.localhub_redeem_food_loyalty(uuid, uuid, numeric) from public, anon;
grant execute on function public.localhub_redeem_food_loyalty(uuid, uuid, numeric) to authenticated;

notify pgrst, 'reload schema';
