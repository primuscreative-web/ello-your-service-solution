alter table public.localhub_services
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'localhub-products',
  'localhub-products',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read localhub product images" on storage.objects;
create policy "public read localhub product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'localhub-products');

drop policy if exists "owners upload localhub product images" on storage.objects;
create policy "owners upload localhub product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'localhub-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.localhub_businesses business
      where business.id::text = (storage.foldername(name))[2]
        and business.owner_id = (select auth.uid())
    )
  );

drop policy if exists "owners delete localhub product images" on storage.objects;
create policy "owners delete localhub product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'localhub-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.localhub_businesses business
      where business.id::text = (storage.foldername(name))[2]
        and business.owner_id = (select auth.uid())
    )
  );

create table if not exists public.localhub_payment_accounts (
  business_id uuid primary key references public.localhub_businesses(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  sales_enabled boolean not null default false,
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'requested', 'under_review', 'active', 'rejected', 'suspended')),
  provider_account_id text,
  wallet_id text,
  onboarding_requested_at timestamptz,
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    onboarding_status <> 'active'
    or (provider_account_id is not null and wallet_id is not null and activated_at is not null)
  )
);

alter table public.localhub_payment_accounts enable row level security;
drop policy if exists "owners read own payment account" on public.localhub_payment_accounts;
create policy "owners read own payment account"
  on public.localhub_payment_accounts for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));
revoke all on public.localhub_payment_accounts from public, anon, authenticated;
grant select on public.localhub_payment_accounts to authenticated;
grant all on public.localhub_payment_accounts to service_role;

create or replace function public.localhub_set_wallet_sales_enabled(
  p_business_id uuid,
  p_enabled boolean
)
returns public.localhub_payment_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.localhub_payment_accounts;
begin
  if not exists (
    select 1 from public.localhub_businesses business
    where business.id = p_business_id and business.owner_id = (select auth.uid())
  ) then
    raise exception 'Negócio não encontrado ou acesso não autorizado.' using errcode = '42501';
  end if;

  insert into public.localhub_payment_accounts (business_id, sales_enabled, onboarding_status, onboarding_requested_at)
  values (
    p_business_id,
    p_enabled,
    case when p_enabled then 'requested' else 'not_started' end,
    case when p_enabled then now() else null end
  )
  on conflict (business_id) do update
  set sales_enabled = excluded.sales_enabled,
      onboarding_status = case
        when public.localhub_payment_accounts.onboarding_status in ('active', 'under_review', 'rejected', 'suspended')
          then public.localhub_payment_accounts.onboarding_status
        when excluded.sales_enabled then 'requested'
        else 'not_started'
      end,
      onboarding_requested_at = case
        when excluded.sales_enabled then coalesce(public.localhub_payment_accounts.onboarding_requested_at, now())
        else public.localhub_payment_accounts.onboarding_requested_at
      end,
      updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.localhub_set_wallet_sales_enabled(uuid, boolean) from public, anon;
grant execute on function public.localhub_set_wallet_sales_enabled(uuid, boolean) to authenticated;

create table if not exists public.localhub_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  provider_transaction_id text unique,
  transaction_type text not null check (transaction_type in ('sale', 'fee', 'refund', 'withdrawal', 'adjustment')),
  status text not null check (status in ('pending', 'available', 'completed', 'failed', 'reversed')),
  amount_cents bigint not null,
  available_at timestamptz,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists localhub_wallet_transactions_business_created_idx
  on public.localhub_wallet_transactions (business_id, created_at desc);
alter table public.localhub_wallet_transactions enable row level security;
drop policy if exists "owners read own wallet transactions" on public.localhub_wallet_transactions;
create policy "owners read own wallet transactions"
  on public.localhub_wallet_transactions for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));
revoke all on public.localhub_wallet_transactions from public, anon, authenticated;
grant select on public.localhub_wallet_transactions to authenticated;
grant all on public.localhub_wallet_transactions to service_role;

create table if not exists public.localhub_wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  idempotency_key text not null,
  provider_transfer_id text unique,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'completed', 'failed', 'cancelled')),
  failure_reason text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (business_id, idempotency_key)
);

create index if not exists localhub_wallet_withdrawals_business_requested_idx
  on public.localhub_wallet_withdrawals (business_id, requested_at desc);
alter table public.localhub_wallet_withdrawals enable row level security;
drop policy if exists "owners read own wallet withdrawals" on public.localhub_wallet_withdrawals;
create policy "owners read own wallet withdrawals"
  on public.localhub_wallet_withdrawals for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));
revoke all on public.localhub_wallet_withdrawals from public, anon, authenticated;
grant select on public.localhub_wallet_withdrawals to authenticated;
grant all on public.localhub_wallet_withdrawals to service_role;

notify pgrst, 'reload schema';
