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
  v_service public.localhub_services%rowtype;
  v_item record;
  v_subtotal numeric(10,2) := 0;
  v_unit_price numeric(10,2);
  v_fee numeric(10,2);
  v_order_id uuid;
  v_order_number bigint;
  v_variant_name text;
  v_options_name text;
  v_item_name text;
  v_variant_count integer;
  v_lines jsonb := '[]'::jsonb;
begin
  if length(btrim(coalesce(p_customer_name, ''))) not between 2 and 100
    or length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')) not between 10 and 15 then
    raise exception 'Confira nome e telefone.' using errcode = '22023';
  end if;
  if p_fulfillment is null or p_fulfillment not in ('delivery', 'pickup', 'dine_in')
    or p_payment_method is null or p_payment_method not in ('cash', 'pix', 'card', 'online_pix', 'online_card') then
    raise exception 'Forma de entrega ou pagamento inválida.' using errcode = '22023';
  end if;
  if p_fulfillment = 'delivery' and length(btrim(coalesce(p_delivery_address, ''))) < 8 then
    raise exception 'Informe o endereço completo para entrega.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array'
    or jsonb_array_length(p_items) not between 1 and 50 then
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

  for v_item in
    select * from jsonb_to_recordset(p_items) as i(id uuid, quantity integer, variant_id uuid, option_ids uuid[], strict_configuration boolean)
  loop
    select * into v_service from public.localhub_services s
     where s.id = v_item.id and s.business_id = v_business.id and s.is_active;
    if not found then raise exception 'Um ou mais itens não estão mais disponíveis.' using errcode = '22023'; end if;
    v_unit_price := v_service.price;
    v_variant_name := null;
    v_options_name := null;
    select count(*) into v_variant_count from public.localhub_product_variants v
      where v.business_id = v_business.id and v.service_id = v_service.id and v.is_active;
    if v_item.variant_id is not null then
      select v.name, v.price_delta into v_variant_name, v_fee
        from public.localhub_product_variants v
       where v.id = v_item.variant_id and v.service_id = v_service.id
         and v.business_id = v_business.id and v.is_active;
      if not found then raise exception 'Uma variação selecionada não está disponível.' using errcode = '22023'; end if;
      v_unit_price := v_unit_price + v_fee;
    elsif v_variant_count > 0 and coalesce(v_item.strict_configuration, false) then
      raise exception 'Escolha uma variação para %.', v_service.name using errcode = '22023';
    end if;

    if coalesce(cardinality(v_item.option_ids), 0) <>
       (select count(distinct selected.option_id) from unnest(coalesce(v_item.option_ids, '{}'::uuid[])) as selected(option_id)) then
      raise exception 'Há opções repetidas no item %.', v_service.name using errcode = '22023';
    end if;
    if exists (
      select 1 from unnest(coalesce(v_item.option_ids, '{}'::uuid[])) selected(option_id)
      left join public.localhub_product_options o on o.id = selected.option_id
        and o.business_id = v_business.id and o.is_active
      left join public.localhub_product_option_groups g on g.id = o.group_id
        and g.service_id = v_service.id and g.business_id = v_business.id and g.is_active
      where o.id is null or g.id is null
    ) then
      raise exception 'Uma opção selecionada não pertence a este item ou não está disponível.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.localhub_product_option_groups g
      where g.service_id = v_service.id and g.business_id = v_business.id and g.is_active
        and coalesce(v_item.strict_configuration, false)
        and (select count(*) from unnest(coalesce(v_item.option_ids, '{}'::uuid[])) selected(option_id)
          join public.localhub_product_options o on o.id = selected.option_id and o.group_id = g.id and o.is_active)
          < greatest(g.min_selections, case when g.required then 1 else 0 end)
    ) then
      raise exception 'Selecione as opções obrigatórias de %.', v_service.name using errcode = '22023';
    end if;
    if exists (
      select 1 from public.localhub_product_option_groups g
      where g.service_id = v_service.id and g.business_id = v_business.id and g.is_active
        and (select count(*) from unnest(coalesce(v_item.option_ids, '{}'::uuid[])) selected(option_id)
          join public.localhub_product_options o on o.id = selected.option_id and o.group_id = g.id and o.is_active)
          > g.max_selections
    ) then
      raise exception 'Excesso de opções selecionadas em %.', v_service.name using errcode = '22023';
    end if;
    select coalesce(sum(o.price_delta), 0), string_agg(o.name, ', ' order by o.position)
      into v_fee, v_options_name
      from unnest(coalesce(v_item.option_ids, '{}'::uuid[])) selected(option_id)
      join public.localhub_product_options o on o.id = selected.option_id
       and o.business_id = v_business.id and o.is_active
      join public.localhub_product_option_groups g on g.id = o.group_id
       and g.service_id = v_service.id and g.business_id = v_business.id and g.is_active;
    v_unit_price := v_unit_price + coalesce(v_fee, 0);
    if v_unit_price < 0 then
      raise exception 'O preço configurado para % não pode ser negativo.', v_service.name using errcode = '22023';
    end if;
    v_item_name := v_service.name
      || case when v_variant_name is not null then ' · ' || v_variant_name else '' end
      || case when v_options_name is not null then ' · ' || v_options_name else '' end;
    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'service_id', v_service.id, 'item_name', v_item_name,
      'unit_price', v_unit_price, 'quantity', v_item.quantity
    ));
  end loop;

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
  select v_order_id, line.service_id, line.item_name, line.unit_price, line.quantity,
    line.unit_price * line.quantity
  from jsonb_to_recordset(v_lines) as line(service_id uuid, item_name text, unit_price numeric, quantity integer);
  return query select v_order_id, v_order_number, v_subtotal + v_fee;
end;
$$;
