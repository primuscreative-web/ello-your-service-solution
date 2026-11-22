-- Entitlements for Free, Pro and Business.
-- Keep catalog/video values aligned with src/lib/plan-access.ts.

-- Evolution sessions must be assigned per business. A shared environment
-- instance must never be exposed to multiple merchants as a paid feature.
alter table public.localhub_businesses
  add column if not exists whatsapp_instance_id text;

create unique index if not exists localhub_businesses_whatsapp_instance_id_key
  on public.localhub_businesses (whatsapp_instance_id)
  where whatsapp_instance_id is not null;

create or replace function private.localhub_effective_plan(p_business_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select subscription.plan
      from public.localhub_plan_subscriptions subscription
     where subscription.business_id = p_business_id
       and subscription.status = 'active'
       and subscription.plan in ('pro', 'business')
     limit 1
  ), 'free');
$$;

revoke all on function private.localhub_effective_plan(uuid) from public, anon, authenticated, service_role;

create or replace function private.localhub_plan_has_feature(p_business_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_feature in ('team', 'crm', 'white_label', 'video_portfolio')
      then private.localhub_effective_plan(p_business_id) in ('pro', 'business')
    when p_feature in ('self_service_kiosk', 'whatsapp_automation')
      then private.localhub_effective_plan(p_business_id) = 'business'
    when p_feature = 'multi_unit' then false
    else false
  end;
$$;

revoke all on function private.localhub_plan_has_feature(uuid, text) from public, anon, authenticated, service_role;
grant execute on function private.localhub_plan_has_feature(uuid, text) to anon, authenticated;

create or replace function private.localhub_plan_limit(p_business_id uuid, p_resource text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_resource = 'catalog_items' and private.localhub_effective_plan(p_business_id) = 'free' then 10
    when p_resource = 'portfolio_videos' and private.localhub_effective_plan(p_business_id) = 'free' then 0
    when p_resource = 'portfolio_videos' and private.localhub_effective_plan(p_business_id) = 'pro' then 20
    else null
  end;
$$;

revoke all on function private.localhub_plan_limit(uuid, text) from public, anon, authenticated, service_role;

create or replace function private.enforce_localhub_service_catalog_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if tg_op = 'UPDATE' and old.business_id = new.business_id then
    return new;
  end if;

  -- Serialize concurrent inserts for one business so two requests cannot
  -- both consume the final catalog slot.
  perform 1
    from public.localhub_businesses business
   where business.id = new.business_id
   for update;

  v_limit := private.localhub_plan_limit(new.business_id, 'catalog_items');
  if v_limit is null then return new; end if;

  select count(*)::integer into v_count
    from public.localhub_services service
   where service.business_id = new.business_id;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT:catalog_items'
      using errcode = 'P0001',
            detail = 'O plano Grátis permite até 10 produtos ou serviços.';
  end if;

  return new;
end;
$$;

drop trigger if exists localhub_service_catalog_plan_limit on public.localhub_services;
create trigger localhub_service_catalog_plan_limit
  before insert or update of business_id on public.localhub_services
  for each row execute function private.enforce_localhub_service_catalog_limit();

create or replace function private.enforce_localhub_business_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_items jsonb;
  v_new_items jsonb;
  v_old_videos integer := 0;
  v_new_videos integer := 0;
  v_video_limit integer;
  v_portfolio_changed boolean;
begin
  v_new_items := coalesce(new.onboarding_details -> 'portfolioItems', '[]'::jsonb);
  if tg_op = 'UPDATE' then
    v_old_items := coalesce(old.onboarding_details -> 'portfolioItems', '[]'::jsonb);
    v_portfolio_changed := new.onboarding_details is distinct from old.onboarding_details;
  else
    v_old_items := '[]'::jsonb;
    v_portfolio_changed := true;
  end if;

  if v_portfolio_changed then
    if jsonb_typeof(v_new_items) <> 'array' then
      raise exception 'O portfólio enviado é inválido.' using errcode = '22023';
    end if;

    select count(*)::integer into v_new_videos
      from jsonb_array_elements(v_new_items) item
     where item ->> 'mediaType' = 'video';
    select count(*)::integer into v_old_videos
      from jsonb_array_elements(v_old_items) item
     where item ->> 'mediaType' = 'video';

    v_video_limit := private.localhub_plan_limit(new.id, 'portfolio_videos');
    -- Downgrades retain existing data but block adding or replacing videos
    -- while the stored count is over the tier limit.
    if v_video_limit is not null
      and v_new_videos > v_video_limit
      and v_new_videos > v_old_videos then
      raise exception 'PLAN_LIMIT:portfolio_videos'
        using errcode = 'P0001',
              detail = 'O limite de vídeos deste plano foi atingido.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.whatsapp_templates is distinct from old.whatsapp_templates
      and private.localhub_effective_plan(new.id) <> 'business' then
      raise exception 'PLAN_FEATURE:whatsapp_automation'
        using errcode = 'P0001',
              detail = 'A automação WhatsApp está disponível no plano Business.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists localhub_business_plan_entitlements on public.localhub_businesses;
create trigger localhub_business_plan_entitlements
  before insert or update on public.localhub_businesses
  for each row execute function private.enforce_localhub_business_entitlements();

drop policy if exists "Owners manage tables" on public.localhub_restaurant_tables;
create policy "Business owners manage tables"
  on public.localhub_restaurant_tables for all to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_plan_has_feature(business_id, 'self_service_kiosk')
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_plan_has_feature(business_id, 'self_service_kiosk')
    )
  );

drop policy if exists "Public view active tables" on public.localhub_restaurant_tables;
drop policy if exists "public reads active tables" on public.localhub_restaurant_tables;
drop policy if exists "public reads restaurant tables" on public.localhub_restaurant_tables;
drop policy if exists "public view active restaurant tables" on public.localhub_restaurant_tables;
drop policy if exists "public view active tables" on public.localhub_restaurant_tables;
revoke select on public.localhub_restaurant_tables from anon;
grant select, insert, update, delete on public.localhub_restaurant_tables to authenticated;

drop policy if exists "published businesses expose active staff" on public.localhub_staff;
create policy "paid businesses expose active staff"
  on public.localhub_staff for select to anon, authenticated
  using (
    (is_active
      and exists (
        select 1 from public.localhub_businesses business
         where business.id = business_id
           and business.is_published
           and private.localhub_plan_has_feature(business_id, 'team')
      ))
    or exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.owner_id = (select auth.uid())
    )
    or public.localhub_is_business_staff(business_id)
  );

notify pgrst, 'reload schema';
