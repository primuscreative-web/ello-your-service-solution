alter table public.localhub_orders
  add column if not exists payment_status text not null default 'not_applicable'
    check (payment_status in ('not_applicable', 'pending', 'paid', 'failed', 'refunded', 'disputed'));

create table if not exists public.localhub_stripe_connect_accounts (
  business_id uuid primary key references public.localhub_businesses(id) on delete cascade,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.localhub_stripe_connect_accounts enable row level security;
drop policy if exists "owners read own stripe connect account" on public.localhub_stripe_connect_accounts;
create policy "owners read own stripe connect account"
  on public.localhub_stripe_connect_accounts for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));
revoke all on public.localhub_stripe_connect_accounts from public, anon, authenticated;
grant select on public.localhub_stripe_connect_accounts to authenticated;
grant all on public.localhub_stripe_connect_accounts to service_role;

create table if not exists public.localhub_stripe_order_payments (
  order_id uuid primary key references public.localhub_orders(id) on delete cascade,
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  stripe_account_id text not null references public.localhub_stripe_connect_accounts(stripe_account_id),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  checkout_url text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'disputed')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'brl' check (currency = 'brl'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists localhub_stripe_order_payments_business_created_idx
  on public.localhub_stripe_order_payments (business_id, created_at desc);
alter table public.localhub_stripe_order_payments enable row level security;
drop policy if exists "owners read own stripe order payments" on public.localhub_stripe_order_payments;
create policy "owners read own stripe order payments"
  on public.localhub_stripe_order_payments for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));
revoke all on public.localhub_stripe_order_payments from public, anon, authenticated;
grant select on public.localhub_stripe_order_payments to authenticated;
grant all on public.localhub_stripe_order_payments to service_role;

create table if not exists public.localhub_stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);
alter table public.localhub_stripe_webhook_events enable row level security;
revoke all on public.localhub_stripe_webhook_events from public, anon, authenticated;
grant all on public.localhub_stripe_webhook_events to service_role;

notify pgrst, 'reload schema';
