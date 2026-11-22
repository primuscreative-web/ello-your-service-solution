create table if not exists public.localhub_markets (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  display_name text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  locale text not null,
  is_enabled boolean not null default false,
  checkout_enabled boolean not null default false,
  payment_provider text,
  updated_at timestamptz not null default now(),
  check (not checkout_enabled or (is_enabled and payment_provider is not null))
);

create table if not exists public.localhub_market_prices (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.localhub_markets(country_code),
  plan text not null check (plan in ('pro', 'business')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  amount_minor bigint not null check (amount_minor > 0),
  compare_at_minor bigint check (compare_at_minor is null or compare_at_minor >= amount_minor),
  is_active boolean not null default false,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from)
);

create index if not exists localhub_market_prices_lookup_idx
  on public.localhub_market_prices (country_code, plan, billing_cycle, valid_from desc);

alter table public.localhub_markets enable row level security;
alter table public.localhub_market_prices enable row level security;
revoke all on public.localhub_markets, public.localhub_market_prices from public, anon, authenticated;
grant all on public.localhub_markets, public.localhub_market_prices to service_role;

insert into public.localhub_markets
  (country_code, display_name, currency_code, locale, is_enabled, checkout_enabled, payment_provider)
values
  ('BR', 'Brasil', 'BRL', 'pt-BR', true, true, 'asaas'),
  ('US', 'Estados Unidos', 'USD', 'en-US', false, false, null),
  ('AE', 'Emirados Árabes Unidos', 'AED', 'ar-AE', false, false, null),
  ('PT', 'Portugal', 'EUR', 'pt-PT', false, false, null),
  ('DE', 'Alemanha', 'EUR', 'de-DE', false, false, null),
  ('FR', 'França', 'EUR', 'fr-FR', false, false, null),
  ('ES', 'Espanha', 'EUR', 'es-ES', false, false, null),
  ('IT', 'Itália', 'EUR', 'it-IT', false, false, null),
  ('NL', 'Países Baixos', 'EUR', 'nl-NL', false, false, null),
  ('IE', 'Irlanda', 'EUR', 'en-IE', false, false, null),
  ('GB', 'Reino Unido', 'GBP', 'en-GB', false, false, null),
  ('CH', 'Suíça', 'CHF', 'de-CH', false, false, null),
  ('CN', 'China', 'CNY', 'zh-CN', false, false, null)
on conflict (country_code) do update set
  display_name = excluded.display_name,
  currency_code = excluded.currency_code,
  locale = excluded.locale,
  is_enabled = case when localhub_markets.country_code = 'BR' then true else localhub_markets.is_enabled end,
  checkout_enabled = case when localhub_markets.country_code = 'BR' then true else localhub_markets.checkout_enabled end,
  payment_provider = case when localhub_markets.country_code = 'BR' then 'asaas' else localhub_markets.payment_provider end,
  updated_at = now();

insert into public.localhub_market_prices
  (country_code, plan, billing_cycle, currency_code, amount_minor, compare_at_minor, is_active)
select seed.country_code, seed.plan, seed.billing_cycle, seed.currency_code,
       seed.amount_minor, seed.compare_at_minor, seed.is_active
  from (values
  ('BR', 'pro', 'monthly', 'BRL', 3990, 4990, true),
  ('BR', 'pro', 'yearly', 'BRL', 47880, 59880, true),
  ('BR', 'business', 'monthly', 'BRL', 7990, 11990, true),
  ('BR', 'business', 'yearly', 'BRL', 95880, 143880, true)
  ) as seed(country_code, plan, billing_cycle, currency_code, amount_minor, compare_at_minor, is_active)
 where not exists (
   select 1 from public.localhub_market_prices existing
    where existing.country_code = seed.country_code
      and existing.plan = seed.plan
      and existing.billing_cycle = seed.billing_cycle
      and existing.currency_code = seed.currency_code
      and existing.amount_minor = seed.amount_minor
      and existing.compare_at_minor = seed.compare_at_minor
      and existing.is_active
      and existing.valid_until is null
 );

update public.localhub_market_prices p
   set is_active = false,
       valid_until = greatest(now(), p.valid_from) + interval '1 millisecond'
 where p.country_code = 'BR'
   and p.is_active
   and exists (
     select 1 from public.localhub_market_prices newer
      where newer.country_code = p.country_code
        and newer.plan = p.plan
        and newer.billing_cycle = p.billing_cycle
        and newer.id <> p.id
        and (newer.created_at > p.created_at or (newer.created_at = p.created_at and newer.id > p.id))
   );

update public.localhub_market_prices
   set is_active = false,
       valid_until = coalesce(valid_until, greatest(now(), valid_from) + interval '1 millisecond')
 where country_code <> 'BR' and is_active;

create unique index if not exists localhub_market_prices_one_current_idx
  on public.localhub_market_prices (country_code, plan, billing_cycle)
  where is_active and valid_until is null;

alter table public.localhub_asaas_plan_payments
  add column if not exists market_country_code text references public.localhub_markets(country_code),
  add column if not exists currency_code text,
  add column if not exists market_price_id uuid references public.localhub_market_prices(id),
  add column if not exists amount_minor bigint;
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'localhub_asaas_plan_payments_amount_minor_positive'
       and conrelid = 'public.localhub_asaas_plan_payments'::regclass
  ) then
    alter table public.localhub_asaas_plan_payments
      add constraint localhub_asaas_plan_payments_amount_minor_positive
      check (amount_minor is null or amount_minor > 0);
  end if;
end;
$$;

update public.localhub_asaas_plan_payments
   set market_country_code = coalesce(market_country_code, 'BR'),
       currency_code = coalesce(currency_code, 'BRL'),
       amount_minor = coalesce(amount_minor, amount_cents)
 where market_country_code is null or currency_code is null or amount_minor is null;

alter table public.localhub_plan_subscriptions
  add column if not exists market_country_code text references public.localhub_markets(country_code),
  add column if not exists currency_code text,
  add column if not exists market_price_id uuid references public.localhub_market_prices(id),
  add column if not exists pending_market_country_code text references public.localhub_markets(country_code),
  add column if not exists pending_currency_code text,
  add column if not exists pending_market_price_id uuid references public.localhub_market_prices(id);

create or replace function public.localhub_reserve_plan_change(
  p_business_id uuid,
  p_plan text,
  p_billing_cycle text
)
returns table (acquired boolean, prior_subscription_id text, prior_plan text, prior_billing_cycle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state public.localhub_plan_subscriptions%rowtype;
  v_price public.localhub_market_prices%rowtype;
begin
  select * into v_price
    from public.localhub_market_prices
   where country_code = 'BR'
     and plan = p_plan
     and billing_cycle = p_billing_cycle
     and currency_code = 'BRL'
     and is_active
     and valid_from <= now()
     and (valid_until is null or valid_until > now())
   order by valid_from desc
   limit 1;

  if not found then
    raise exception 'No active price for BR plan/cycle';
  end if;

  insert into public.localhub_plan_subscriptions (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  select * into v_state
    from public.localhub_plan_subscriptions
   where business_id = p_business_id
   for update;

  if v_state.status = 'pending' then
    return query select false, null::text, v_state.plan, v_state.billing_cycle;
    return;
  end if;

  update public.localhub_plan_subscriptions
     set status = 'pending',
         pending_plan = p_plan,
         pending_billing_cycle = p_billing_cycle,
         pending_market_country_code = 'BR',
         pending_currency_code = 'BRL',
         pending_market_price_id = v_price.id,
         updated_at = now()
   where business_id = p_business_id;

  return query select true, v_state.asaas_subscription_id, v_state.plan, v_state.billing_cycle;
end;
$$;

revoke all on function public.localhub_reserve_plan_change(uuid, text, text) from public, anon, authenticated;
grant execute on function public.localhub_reserve_plan_change(uuid, text, text) to service_role;

notify pgrst, 'reload schema';
