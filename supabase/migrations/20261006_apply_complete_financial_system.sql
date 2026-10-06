-- ==============================================================================
-- ELLO - Sistema Financeiro Unificado Asaas (Consolidado e Idempotente)
-- Execute no SQL Editor do painel Supabase (Projeto fahrhrcxzcnnrhjavrfk)
-- ==============================================================================

-- 1. Tabela de Contas de Pagamento / Subcontas Asaas por Estabelecimento
create table if not exists public.localhub_payment_accounts (
  business_id uuid primary key references public.localhub_businesses(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  sales_enabled boolean not null default false,
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'requested', 'under_review', 'active', 'rejected', 'suspended')),
  provider_account_id text,
  wallet_id text,
  subaccount_api_key text,
  account_number text,
  agency text,
  pix_key text,
  pix_key_type text check (pix_key_type in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP', null)),
  legal_name text,
  cpf_cnpj text,
  email text,
  phone text,
  postal_code text,
  address text,
  address_number text,
  complement text,
  province text,
  city text,
  state text,
  onboarding_requested_at timestamptz,
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Habilita RLS
alter table public.localhub_payment_accounts enable row level security;

-- Política de leitura apenas para o proprietário do estabelecimento
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

-- 2. Tabela de Saques e Transferências da Carteira do Lojista
create table if not exists public.localhub_wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  net_amount_cents bigint not null check (net_amount_cents > 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  destination_pix_key text not null,
  destination_pix_key_type text not null,
  provider_transfer_id text,
  failure_reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
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

-- 3. Adiciona campos de Cartão de Crédito e Parcelamento na tabela de pagamentos
alter table public.localhub_asaas_order_payments
  add column if not exists credit_card_brand text,
  add column if not exists credit_card_last4 text,
  add column if not exists installments integer default 1;

-- 4. Função Segura para Obter Perfil de Pagamento do Lojista (Oculta subaccount_api_key)
create or replace function public.localhub_get_business_payment_profile(p_business_id uuid)
returns table (
  business_id uuid,
  provider text,
  sales_enabled boolean,
  onboarding_status text,
  provider_account_id text,
  wallet_id text,
  account_number text,
  agency text,
  pix_key text,
  pix_key_type text,
  legal_name text,
  cpf_cnpj text,
  email text,
  phone text,
  postal_code text,
  address text,
  address_number text,
  complement text,
  province text,
  city text,
  state text,
  onboarding_requested_at timestamptz,
  activated_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.localhub_businesses business
    where business.id = p_business_id and business.owner_id = (select auth.uid())
  ) then
    raise exception 'Negócio não encontrado ou acesso não autorizado.' using errcode = '42501';
  end if;

  return query
  select
    pa.business_id,
    pa.provider,
    pa.sales_enabled,
    pa.onboarding_status,
    pa.provider_account_id,
    pa.wallet_id,
    pa.account_number,
    pa.agency,
    pa.pix_key,
    pa.pix_key_type,
    pa.legal_name,
    pa.cpf_cnpj,
    pa.email,
    pa.phone,
    pa.postal_code,
    pa.address,
    pa.address_number,
    pa.complement,
    pa.province,
    pa.city,
    pa.state,
    pa.onboarding_requested_at,
    pa.activated_at,
    pa.updated_at
  from public.localhub_payment_accounts pa
  where pa.business_id = p_business_id;
end;
$$;

revoke all on function public.localhub_get_business_payment_profile(uuid) from public, anon;
grant execute on function public.localhub_get_business_payment_profile(uuid) to authenticated;

-- 5. RPC Segura para o Cliente obter dados do pagamento (Pix e Cartão) no Checkout/Tracking
create or replace function public.localhub_get_order_payment_info(p_tracking_token uuid)
returns table (
  order_id uuid,
  order_number bigint,
  customer_name text,
  customer_phone text,
  total numeric,
  status text,
  payment_method text,
  payment_status text,
  billing_type text,
  pix_payload text,
  pix_image text,
  pix_expiration timestamptz,
  invoice_url text,
  credit_card_brand text,
  credit_card_last4 text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.localhub_orders%rowtype;
  v_payment public.localhub_asaas_order_payments%rowtype;
begin
  if p_tracking_token is null then
    return;
  end if;

  select * into v_order
    from public.localhub_orders
   where public.localhub_orders.public_tracking_token = p_tracking_token;

  if not found then
    return;
  end if;

  select * into v_payment
    from public.localhub_asaas_order_payments
   where public.localhub_asaas_order_payments.order_id = v_order.id;

  return query select
    v_order.id,
    v_order.order_number,
    v_order.customer_name,
    v_order.customer_phone,
    v_order.total,
    v_order.status,
    v_order.payment_method,
    v_order.payment_status,
    v_payment.billing_type,
    v_payment.pix_qr_code_payload,
    v_payment.pix_qr_code_image,
    v_payment.pix_expiration_date,
    v_payment.invoice_url,
    v_payment.credit_card_brand,
    v_payment.credit_card_last4;
end;
$$;

revoke all on function public.localhub_get_order_payment_info(uuid) from public, anon, authenticated;
grant execute on function public.localhub_get_order_payment_info(uuid) to anon, authenticated, service_role;
