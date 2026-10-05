-- Migration: localhub_order_payment_info_rpc
-- Expande RPC segura para fornecer informações de pagamento (Pix e Cartão Asaas) pelo token público

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

-- Mantém retrocompatibilidade com a RPC anterior
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

notify pgrst, 'reload schema';
