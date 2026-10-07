-- Migration: 20261007_backend_security_hardening
-- Fortalecimento e proteção defensiva de alto nível (Column-Level Security, RLS Hardening e proteção de segredos)

-- 1. Proteção de Segredos em Nível de Coluna (Column-Level Security)
-- Impede que qualquer cliente (mesmo usuário autenticado logado) leia a subaccount_api_key diretamente via PostgREST
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'localhub_payment_accounts' 
      and column_name = 'subaccount_api_key'
  ) then
    revoke select (subaccount_api_key) on public.localhub_payment_accounts from public, anon, authenticated;
  end if;
end;
$$;

-- 2. Reforço de RLS nas tabelas financeiras
alter table if exists public.localhub_bills enable row level security;
alter table if exists public.localhub_wallet_transactions enable row level security;
alter table if exists public.localhub_wallet_withdrawals enable row level security;
alter table if exists public.localhub_asaas_order_payments enable row level security;

-- Política de Leitura/Escrita para Contas a Pagar/Receber (localhub_bills)
drop policy if exists "owners manage their own bills" on public.localhub_bills;
create policy "owners manage their own bills"
  on public.localhub_bills
  for all
  to authenticated
  using (
    business_id in (
      select id from public.localhub_businesses where owner_id = (select auth.uid())
    )
  )
  with check (
    business_id in (
      select id from public.localhub_businesses where owner_id = (select auth.uid())
    )
  );

-- Política de Leitura para Transações da Carteira
drop policy if exists "owners read their wallet transactions" on public.localhub_wallet_transactions;
create policy "owners read their wallet transactions"
  on public.localhub_wallet_transactions
  for select
  to authenticated
  using (
    business_id in (
      select id from public.localhub_businesses where owner_id = (select auth.uid())
    )
  );

-- Política de Leitura para Saques
drop policy if exists "owners read their withdrawals" on public.localhub_wallet_withdrawals;
create policy "owners read their withdrawals"
  on public.localhub_wallet_withdrawals
  for select
  to authenticated
  using (
    business_id in (
      select id from public.localhub_businesses where owner_id = (select auth.uid())
    )
  );

-- 3. Revogação de privilégios perigosos
revoke truncate, references, trigger on all tables in schema public from public, anon, authenticated;

notify pgrst, 'reload schema';
