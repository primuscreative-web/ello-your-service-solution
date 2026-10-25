-- Restrict private business fields to the authenticated owner or a linked
-- staff member. Storefront users retain only the explicit public columns.
create or replace function public.localhub_get_business_context(p_business_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_business public.localhub_businesses%rowtype;
begin
  if (select auth.uid()) is null then
    return null;
  end if;

  select business.*
    into v_business
    from public.localhub_businesses as business
   where (
     p_business_id is null
     and business.owner_id = (select auth.uid())
   ) or (
     p_business_id is not null
     and business.id = p_business_id
     and (
       business.owner_id = (select auth.uid())
       or public.localhub_is_business_staff(business.id)
     )
   )
   limit 1;

  if not found then
    return null;
  end if;

  if v_business.owner_id = (select auth.uid()) then
    return to_jsonb(v_business);
  end if;

  -- Staff access is operational only; exclude owner identity and private
  -- onboarding, payment destination, and message-template data.
  return to_jsonb(v_business) - array[
    'owner_id', 'onboarding_details', 'pix_key', 'whatsapp_templates'
  ]::text[];
end;
$$;

revoke all on function public.localhub_get_business_context(uuid) from public, anon, authenticated;
grant execute on function public.localhub_get_business_context(uuid) to authenticated;

-- Remove the historical table-wide SELECT grant. Column grants below preserve
-- public storefront reads while private owner context is fetched via the RPC.
revoke select on public.localhub_businesses from authenticated;
revoke select (onboarding_details, pix_key) on public.localhub_businesses from anon, authenticated;
grant select (
  id, name, slug, category, city, phone, description, address, is_published, created_at,
  banner_url, gallery_urls, booking_policy, opening_hours, blocked_dates,
  accepts_delivery, accepts_pickup, delivery_fee, accepts_dine_in,
  online_payment_enabled, loyalty_enabled, loyalty_mode, loyalty_rate,
  logo_url, menu_categories_order
)
  on public.localhub_businesses to anon, authenticated;

notify pgrst, 'reload schema';
