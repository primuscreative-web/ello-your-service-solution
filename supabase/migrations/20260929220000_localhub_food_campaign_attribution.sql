alter table public.localhub_campaign_links
  add column if not exists conversions integer not null default 0 check (conversions >= 0);

alter table public.localhub_orders
  add column if not exists campaign_link_id uuid references public.localhub_campaign_links(id) on delete set null;

create index if not exists localhub_orders_campaign_idx
  on public.localhub_orders (campaign_link_id) where campaign_link_id is not null;

create or replace function public.localhub_attribute_food_campaign_order(
  p_order_id uuid,
  p_tracking_token uuid,
  p_campaign_slug text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
  v_existing_campaign_id uuid;
  v_campaign_id uuid;
begin
  select orders.business_id, orders.campaign_link_id
    into v_business_id, v_existing_campaign_id
    from public.localhub_orders orders
   where orders.id = p_order_id
     and orders.public_tracking_token = p_tracking_token
     and orders.source = 'menu_online'
   for update;
  if not found then return false; end if;

  select campaign.id into v_campaign_id
    from public.localhub_campaign_links campaign
   where campaign.business_id = v_business_id
     and campaign.slug = p_campaign_slug
   for update;
  if not found then return false; end if;
  if v_existing_campaign_id is not null then
    return v_existing_campaign_id = v_campaign_id;
  end if;

  update public.localhub_orders
     set campaign_link_id = v_campaign_id
   where id = p_order_id
     and public_tracking_token = p_tracking_token
     and campaign_link_id is null;
  if not found then return false; end if;

  update public.localhub_campaign_links
     set conversions = conversions + 1
   where id = v_campaign_id;
  return true;
end;
$$;

revoke all on function public.localhub_attribute_food_campaign_order(uuid, uuid, text) from public;
grant execute on function public.localhub_attribute_food_campaign_order(uuid, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
