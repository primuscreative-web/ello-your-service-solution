-- Keep public storefront reads limited to published businesses and active catalog rows.
-- SECURITY DEFINER helpers live outside the exposed API schemas and disclose only booleans.

alter table public.localhub_businesses
  alter column is_published set default true,
  add column if not exists logo_url text,
  add column if not exists menu_categories_order text[] not null default '{}';

alter table public.localhub_services
  add column if not exists service_modes text[] not null default array['in_person']::text[],
  add column if not exists image_url text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_promotion boolean not null default false,
  add column if not exists promotional_price numeric(10, 2),
  add column if not exists promotion_badge text default '',
  add column if not exists display_order integer not null default 0;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.localhub_is_published_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.localhub_businesses business
     where business.id = p_business_id
       and business.is_published
  );
$$;

create or replace function private.localhub_is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.localhub_businesses business
     where business.id = p_business_id
       and business.owner_id = (select auth.uid())
  );
$$;

revoke all on function private.localhub_is_published_business(uuid) from public;
revoke all on function private.localhub_is_business_owner(uuid) from public;
grant execute on function private.localhub_is_published_business(uuid) to anon, authenticated;
grant execute on function private.localhub_is_business_owner(uuid) to anon, authenticated;

-- These fields are intentionally public storefront data. Sensitive fiscal columns
-- remain restricted to authenticated business users.
grant select (
  id, name, slug, category, city, phone, description, address, is_published, created_at,
  banner_url, gallery_urls, booking_policy, opening_hours, blocked_dates,
  accepts_delivery, accepts_pickup, delivery_fee,
  accepts_dine_in, online_payment_enabled, pix_key, loyalty_enabled, loyalty_mode, loyalty_rate,
  logo_url, menu_categories_order
)
  on public.localhub_businesses to anon, authenticated;
revoke select (onboarding_details) on public.localhub_businesses from anon;

-- Existing migrations granted table-wide service reads to anon, which included
-- fiscal fields. Replace that with the storefront-only column list below.
revoke select on public.localhub_services from anon;
revoke select (ncm, cest, cfop, fiscal_origin, tax_regime_code)
  on public.localhub_services from anon;
grant select (
  id, business_id, name, description, duration_minutes, price, is_active, menu_category,
  product_kind, service_modes, image_url, is_featured, is_promotion, promotional_price,
  promotion_badge, display_order
)
  on public.localhub_services to anon, authenticated;
grant select on public.localhub_service_addons, public.localhub_delivery_areas
  to anon, authenticated;
grant select on public.localhub_product_variants, public.localhub_product_option_groups,
  public.localhub_product_options to anon, authenticated;

drop policy if exists "active services are public for published businesses" on public.localhub_services;
create policy "active services are public for published businesses"
  on public.localhub_services for select to anon, authenticated
  using (
    (is_active and private.localhub_is_published_business(business_id))
    or private.localhub_is_business_owner(business_id)
    or public.localhub_is_business_staff(business_id)
  );

drop policy if exists "published businesses expose active staff" on public.localhub_staff;
create policy "published businesses expose active staff"
  on public.localhub_staff for select to anon, authenticated
  using (
    (is_active and private.localhub_is_published_business(business_id))
    or private.localhub_is_business_owner(business_id)
    or public.localhub_is_business_staff(business_id)
  );

drop policy if exists "published businesses expose active service add-ons" on public.localhub_service_addons;
create policy "published businesses expose active service add-ons"
  on public.localhub_service_addons for select to anon, authenticated
  using (
    (is_active and private.localhub_is_published_business(business_id))
    or private.localhub_is_business_owner(business_id)
    or public.localhub_is_business_staff(business_id)
  );

drop policy if exists "public reads active delivery areas" on public.localhub_delivery_areas;
create policy "public reads active delivery areas"
  on public.localhub_delivery_areas for select to anon, authenticated
  using (
    (is_active and private.localhub_is_published_business(business_id))
    or private.localhub_is_business_owner(business_id)
  );

drop policy if exists "public reads active product variants" on public.localhub_product_variants;
create policy "public reads active product variants"
  on public.localhub_product_variants for select to anon, authenticated
  using (is_active and private.localhub_is_published_business(business_id));

drop policy if exists "public reads active product option groups" on public.localhub_product_option_groups;
create policy "public reads active product option groups"
  on public.localhub_product_option_groups for select to anon, authenticated
  using (is_active and private.localhub_is_published_business(business_id));

drop policy if exists "public reads active product options" on public.localhub_product_options;
create policy "public reads active product options"
  on public.localhub_product_options for select to anon, authenticated
  using (is_active and private.localhub_is_published_business(business_id));

notify pgrst, 'reload schema';
