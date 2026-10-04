create table if not exists public.localhub_asaas_order_payments (
  order_id uuid primary key references public.localhub_orders(id) on delete cascade,
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  asaas_payment_id text not null unique,
  asaas_customer_id text,
  billing_type text not null default 'PIX' check (billing_type in ('PIX', 'CREDIT_CARD', 'BOLETO')),
  status text not null default 'pending'
    check (status in ('pending', 'received', 'confirmed', 'overdue', 'refunded', 'cancelled')),
  pix_qr_code_payload text,
  pix_qr_code_image text,
  pix_expiration_date timestamptz,
  amount_cents bigint not null check (amount_cents > 0),
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists localhub_asaas_order_payments_business_idx
  on public.localhub_asaas_order_payments (business_id, created_at desc);

alter table public.localhub_asaas_order_payments enable row level security;

drop policy if exists "owners read own asaas order payments" on public.localhub_asaas_order_payments;
create policy "owners read own asaas order payments"
  on public.localhub_asaas_order_payments for select to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
    where business.id = business_id and business.owner_id = (select auth.uid())
  ));

revoke all on public.localhub_asaas_order_payments from public, anon, authenticated;
grant select on public.localhub_asaas_order_payments to authenticated;
grant all on public.localhub_asaas_order_payments to service_role;

create table if not exists public.localhub_asaas_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.localhub_asaas_webhook_events enable row level security;
revoke all on public.localhub_asaas_webhook_events from public, anon, authenticated;
grant all on public.localhub_asaas_webhook_events to service_role;

-- Função segura com SECURITY DEFINER para recuperar o Pix de um pedido através do token de rastreio público
create or replace function public.localhub_get_order_pix_payment(p_tracking_token uuid)
returns table (
  order_id uuid,
  order_number bigint,
  total numeric,
  payment_status text,
  pix_payload text,
  pix_image text,
  pix_expiration timestamptz,
  invoice_url text
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
    v_order.total,
    v_order.payment_status,
    v_payment.pix_qr_code_payload,
    v_payment.pix_qr_code_image,
    v_payment.pix_expiration_date,
    v_payment.invoice_url;
end;
$$;

revoke all on function public.localhub_get_order_pix_payment(uuid) from public, anon, authenticated;
grant execute on function public.localhub_get_order_pix_payment(uuid) to anon, authenticated, service_role;
