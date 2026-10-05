-- Migration: localhub_asaas_subaccounts_and_unified_payments
-- Unificação de pagamentos 100% no Asaas com suporte a subcontas, Pix, Cartão de Crédito e Saques.

alter table public.localhub_payment_accounts
  add column if not exists subaccount_api_key text,
  add column if not exists account_number text,
  add column if not exists agency text,
  add column if not exists pix_key text,
  add column if not exists pix_key_type text check (pix_key_type in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP', null)),
  add column if not exists legal_name text,
  add column if not exists cpf_cnpj text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists postal_code text,
  add column if not exists address text,
  add column if not exists address_number text,
  add column if not exists complement text,
  add column if not exists province text,
  add column if not exists city text,
  add column if not exists state text;

alter table public.localhub_asaas_order_payments
  add column if not exists credit_card_brand text,
  add column if not exists credit_card_last4 text,
  add column if not exists installments integer default 1;

-- Função para o proprietário buscar sua conta de pagamento sem expor a subaccount_api_key
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

notify pgrst, 'reload schema';
