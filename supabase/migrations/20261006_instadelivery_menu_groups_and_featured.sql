-- Migration: 20261006_instadelivery_menu_groups_and_featured
-- Adiciona suporte ao layout estilo InstaDelivery:
-- - Logo centralizada e ordem de categorias no estabelecimento
-- - Destaques, promoções do dia, preço promocional e selos de marketing nos produtos

alter table public.localhub_businesses
  add column if not exists logo_url text,
  add column if not exists menu_categories_order text[] default '{}';

alter table public.localhub_services
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_promotion boolean not null default false,
  add column if not exists promotional_price numeric(10, 2),
  add column if not exists promotion_badge text default '',
  add column if not exists display_order integer not null default 0;

-- Concede permissões para leitura pública dos novos campos
grant select (logo_url, menu_categories_order) on public.localhub_businesses to anon, authenticated;
grant select (is_featured, is_promotion, promotional_price, promotion_badge, display_order) on public.localhub_services to anon, authenticated;

-- Atualiza a função de criação de pedidos para considerar promotional_price quando o item estiver em promoção
create or replace function public.localhub_create_food_order(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns table (id uuid, order_number bigint, total numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
  v_subtotal numeric(10,2);
  v_fee numeric(10,2);
  v_order_id uuid;
  v_order_number bigint;
begin
  if length(btrim(coalesce(p_customer_name, ''))) not between 2 and 100
    or length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception 'Confira nome e telefone.' using errcode = '22023';
  end if;
  if p_fulfillment not in ('delivery', 'pickup', 'dine_in')
    or p_payment_method not in ('cash', 'pix', 'card', 'online_pix', 'online_card') then
    raise exception 'Forma de entrega ou pagamento inválida.' using errcode = '22023';
  end if;
  if p_fulfillment = 'delivery' and length(btrim(coalesce(p_delivery_address, ''))) < 8 then
    raise exception 'Informe o endereço completo para entrega.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Adicione itens ao pedido.' using errcode = '22023';
  end if;
  select * into v_business from public.localhub_businesses b
   where b.slug = p_slug and b.is_published and b.category = 'alimentacao';
  if not found then raise exception 'Esta loja não está disponível.' using errcode = 'P0002'; end if;
  if p_fulfillment = 'delivery' and not v_business.accepts_delivery then
    raise exception 'Esta loja não está aceitando entregas.' using errcode = '22023';
  end if;
  if p_fulfillment = 'pickup' and not v_business.accepts_pickup then
    raise exception 'Esta loja não está aceitando retirada.' using errcode = '22023';
  end if;
  if p_fulfillment = 'dine_in' and not v_business.accepts_dine_in then
    raise exception 'Esta loja não está aceitando consumo no local.' using errcode = '22023';
  end if;
  if p_payment_method in ('online_pix', 'online_card') and not v_business.online_payment_enabled then
    raise exception 'Pagamento online ainda não está configurado para esta loja.' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    where i.id is null or i.quantity is null or i.quantity not between 1 and 30) then
    raise exception 'Confira as quantidades dos itens.' using errcode = '22023';
  end if;

  select coalesce(sum(
    (case when coalesce(s.is_promotion, false) and s.promotional_price is not null and s.promotional_price > 0
          then s.promotional_price else s.price end) * i.quantity
  ), 0)::numeric(10,2) into v_subtotal
    from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    join public.localhub_services s on s.id = i.id
   where s.business_id = v_business.id and s.is_active;

  if (select count(*) from jsonb_to_recordset(p_items)) <>
    (select count(*) from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
      join public.localhub_services s on s.id = i.id where s.business_id = v_business.id and s.is_active) then
    raise exception 'Um ou mais itens não estão mais disponíveis.' using errcode = '22023';
  end if;

  v_fee := case when p_fulfillment = 'delivery' then v_business.delivery_fee else 0 end;

  insert into public.localhub_orders (
    business_id, customer_name, customer_phone, fulfillment, delivery_address, notes,
    payment_method, payment_timing, subtotal, delivery_fee, total
  ) values (
    v_business.id, btrim(p_customer_name), case when left(btrim(p_customer_phone), 1) = '+'
      then '+' || regexp_replace(p_customer_phone, '[^0-9]', '', 'g')
      else regexp_replace(p_customer_phone, '[^0-9]', '', 'g') end,
    p_fulfillment, case when p_fulfillment = 'delivery' then btrim(p_delivery_address) else '' end,
    left(btrim(coalesce(p_notes, '')), 500), p_payment_method,
    case when p_payment_method like 'online_%' then 'online'
         when p_fulfillment = 'dine_in' then 'at_counter' else 'on_delivery' end,
    v_subtotal, v_fee, v_subtotal + v_fee
  ) returning localhub_orders.id, localhub_orders.order_number into v_order_id, v_order_number;

  insert into public.localhub_order_items (order_id, service_id, item_name, unit_price, quantity, line_total)
  select v_order_id, s.id, s.name,
         case when coalesce(s.is_promotion, false) and s.promotional_price is not null and s.promotional_price > 0 then s.promotional_price else s.price end,
         i.quantity,
         (case when coalesce(s.is_promotion, false) and s.promotional_price is not null and s.promotional_price > 0 then s.promotional_price else s.price end) * i.quantity
    from jsonb_to_recordset(p_items) as i(id uuid, quantity integer)
    join public.localhub_services s on s.id = i.id
   where s.business_id = v_business.id and s.is_active;

  return query select v_order_id, v_order_number, v_subtotal + v_fee;
end;
$$;

revoke all on function public.localhub_create_food_order(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.localhub_create_food_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
