-- Count new client identities across bookings and orders per São Paulo month.
-- Phone numbers stay in a private schema, never exposed through the public API.
create table if not exists private.localhub_client_identities (
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  phone_key text not null,
  first_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (business_id, phone_key)
);

alter table private.localhub_client_identities enable row level security;
revoke all on table private.localhub_client_identities from public, anon, authenticated, service_role;
create index if not exists localhub_client_identities_month_idx
  on private.localhub_client_identities (business_id, first_seen_at);

-- Backfill the identity ledger before the enforcement trigger is enabled.
with source_phones as (
  select business_id, regexp_replace(phone, '[^0-9]', '', 'g') as digits, created_at
    from public.localhub_bookings
  union all
  select business_id, regexp_replace(customer_phone, '[^0-9]', '', 'g') as digits, created_at
    from public.localhub_orders
), normalized as (
  select business_id,
         case when length(digits) in (10, 11) then '55' || digits else digits end as phone_key,
         created_at
    from source_phones
   where length(digits) between 10 and 15
)
insert into private.localhub_client_identities (business_id, phone_key, first_seen_at)
select business_id, phone_key, min(created_at)
  from normalized
 group by business_id, phone_key
on conflict (business_id, phone_key) do update
  set first_seen_at = least(private.localhub_client_identities.first_seen_at, excluded.first_seen_at);

create or replace function private.localhub_new_customer_limit(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case private.localhub_effective_plan(p_business_id)
    when 'free' then 50
    when 'pro' then 500
    else null
  end;
$$;
revoke all on function private.localhub_new_customer_limit(uuid) from public, anon, authenticated, service_role;

create or replace function private.enforce_localhub_monthly_new_customer_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := (to_jsonb(new) ->> 'business_id')::uuid;
  v_phone text := coalesce(to_jsonb(new) ->> 'phone', to_jsonb(new) ->> 'customer_phone', '');
  v_digits text := regexp_replace(v_phone, '[^0-9]', '', 'g');
  v_phone_key text;
  v_limit integer;
  v_month_start timestamptz := date_trunc('month', timezone('America/Sao_Paulo', now()))
                               at time zone 'America/Sao_Paulo';
  v_first_seen timestamptz;
  v_month_count integer;
begin
  -- Existing table constraints validate phone length; normalize BR national and
  -- +55 forms to the same identity before the monthly count.
  v_phone_key := case when length(v_digits) in (10, 11) then '55' || v_digits else v_digits end;
  if length(v_phone_key) not between 10 and 15 then
    raise exception 'Informe um telefone válido para concluir.' using errcode = '22023';
  end if;

  -- Serialize acquisitions per business so concurrent requests cannot consume
  -- the same final slot twice. Also records Business-tier acquisitions for a
  -- later downgrade without retroactively counting returning clients as new.
  perform 1 from public.localhub_businesses business
   where business.id = v_business_id for update;
  if not found then return new; end if;

  select identity.first_seen_at into v_first_seen
    from private.localhub_client_identities identity
   where identity.business_id = v_business_id and identity.phone_key = v_phone_key;
  if found then return new; end if;

  v_limit := private.localhub_new_customer_limit(v_business_id);
  if v_limit is not null then
    select count(*)::integer into v_month_count
      from private.localhub_client_identities identity
     where identity.business_id = v_business_id
       and identity.first_seen_at >= v_month_start;
    if v_month_count >= v_limit then
      raise exception 'PLAN_LIMIT:new_customers_per_month'
        using errcode = 'P0001',
              detail = 'Este negócio atingiu o limite mensal de novos clientes. Clientes já cadastrados podem continuar normalmente.';
    end if;
  end if;

  insert into private.localhub_client_identities (business_id, phone_key, first_seen_at)
  values (v_business_id, v_phone_key, now())
  on conflict (business_id, phone_key) do nothing;
  return new;
end;
$$;
revoke all on function private.enforce_localhub_monthly_new_customer_limit() from public, anon, authenticated, service_role;

drop trigger if exists localhub_bookings_monthly_new_customer_limit on public.localhub_bookings;
create trigger localhub_bookings_monthly_new_customer_limit
  before insert or update of business_id, phone on public.localhub_bookings
  for each row execute function private.enforce_localhub_monthly_new_customer_limit();

drop trigger if exists localhub_orders_monthly_new_customer_limit on public.localhub_orders;
create trigger localhub_orders_monthly_new_customer_limit
  before insert or update of business_id, customer_phone on public.localhub_orders
  for each row execute function private.enforce_localhub_monthly_new_customer_limit();

notify pgrst, 'reload schema';
