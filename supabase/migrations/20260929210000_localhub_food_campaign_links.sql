create or replace function public.localhub_open_food_campaign(
  p_business_slug text,
  p_campaign_slug text
)
returns table (target_path text, campaign_name text, coupon_code text, clicks bigint)
language plpgsql security definer set search_path = ''
as $$
declare
  v_campaign record;
  v_coupon_code text;
  v_clicks bigint;
begin
  select campaign.id, campaign.business_id, campaign.name, campaign.slug, campaign.coupon_id,
         business.slug as business_slug
    into v_campaign
    from public.localhub_campaign_links campaign
    join public.localhub_businesses business on business.id = campaign.business_id
   where business.slug = p_business_slug
     and business.is_published
     and business.category = 'alimentacao'
     and campaign.slug = p_campaign_slug
   for update of campaign;
  if not found then
    raise exception 'Este link de campanha não está disponível.' using errcode = 'P0002';
  end if;
  if v_campaign.coupon_id is not null then
    select coupon.code into v_coupon_code from public.localhub_coupons coupon
     where coupon.id = v_campaign.coupon_id
       and coupon.business_id = v_campaign.business_id
       and coupon.is_active
       and (coupon.starts_at is null or coupon.starts_at <= now())
       and (coupon.ends_at is null or coupon.ends_at > now());
    if not found then
      raise exception 'O cupom desta campanha não está mais disponível.' using errcode = 'P0002';
    end if;
  end if;
  update public.localhub_campaign_links campaign
     set clicks = campaign.clicks + 1
   where campaign.id = v_campaign.id
  returning campaign.clicks into v_clicks;
  return query select
    '/loja/' || v_campaign.business_slug || '?campanha=' || v_campaign.slug ||
      case when v_coupon_code is null then '' else '&cupom=' || v_coupon_code end,
    v_campaign.name,
    v_coupon_code,
    v_clicks;
end;
$$;
revoke all on function public.localhub_open_food_campaign(text, text) from public;
grant execute on function public.localhub_open_food_campaign(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
