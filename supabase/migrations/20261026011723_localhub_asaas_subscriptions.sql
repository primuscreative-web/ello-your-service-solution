create table if not exists public.localhub_plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.localhub_businesses(id) on delete cascade,
  asaas_subscription_id text unique,
  asaas_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  status text not null default 'free' check (status in ('free', 'pending', 'active', 'canceled', 'past_due')),
  pending_plan text check (pending_plan in ('pro', 'business')),
  pending_billing_cycle text check (pending_billing_cycle in ('monthly', 'yearly')),
  pending_payment_id text,
  pending_subscription_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.localhub_plan_subscriptions enable row level security;
revoke all on public.localhub_plan_subscriptions from public, anon, authenticated;
grant all on public.localhub_plan_subscriptions to service_role;

create table if not exists public.localhub_asaas_plan_payments (
  id uuid primary key default gen_random_uuid(),
  asaas_payment_id text not null unique,
  asaas_subscription_id text,
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  requested_plan text not null check (requested_plan in ('pro', 'business')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'received', 'confirmed', 'overdue', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists localhub_asaas_plan_payments_business_idx
  on public.localhub_asaas_plan_payments (business_id, created_at desc);

alter table public.localhub_asaas_plan_payments enable row level security;
revoke all on public.localhub_asaas_plan_payments from public, anon, authenticated;
grant all on public.localhub_asaas_plan_payments to service_role;

notify pgrst, 'reload schema';

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
begin
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
         updated_at = now()
   where business_id = p_business_id;

  return query select true, v_state.asaas_subscription_id, v_state.plan, v_state.billing_cycle;
end;
$$;

revoke all on function public.localhub_reserve_plan_change(uuid, text, text) from public, anon, authenticated;
grant execute on function public.localhub_reserve_plan_change(uuid, text, text) to service_role;
