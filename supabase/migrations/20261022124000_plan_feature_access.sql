create or replace function private.localhub_has_paid_plan(p_business_id uuid, p_minimum_plan text default 'pro')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.localhub_plan_subscriptions subscription
     where subscription.business_id = p_business_id
       and subscription.status = 'active'
       and case p_minimum_plan
         when 'business' then subscription.plan = 'business'
         else subscription.plan in ('pro', 'business')
       end
  );
$$;

revoke all on function private.localhub_has_paid_plan(uuid, text) from public, anon, authenticated;
grant execute on function private.localhub_has_paid_plan(uuid, text) to authenticated;

drop policy if exists "owners manage their staff" on public.localhub_staff;
create policy "paid owners manage their staff"
  on public.localhub_staff for all to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_has_paid_plan(business_id, 'pro')
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_has_paid_plan(business_id, 'pro')
    )
  );

drop policy if exists "owners manage professional access" on public.localhub_staff_access;
create policy "paid owners manage professional access"
  on public.localhub_staff_access for all to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_has_paid_plan(business_id, 'pro')
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id
         and business.owner_id = (select auth.uid())
         and private.localhub_has_paid_plan(business_id, 'pro')
    )
  );

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'localhub_customers', 'localhub_coupons', 'localhub_coupon_redemptions',
    'localhub_loyalty_ledger', 'localhub_abandoned_carts', 'localhub_campaign_links',
    'localhub_message_outbox'
  ] loop
    execute format('drop policy if exists %L on public.%I', 'owners manage own ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (exists (select 1 from public.localhub_businesses business where business.id = business_id and business.owner_id = (select auth.uid()) and private.localhub_has_paid_plan(business_id, ''pro''))) with check (exists (select 1 from public.localhub_businesses business where business.id = business_id and business.owner_id = (select auth.uid()) and private.localhub_has_paid_plan(business_id, ''pro'')))',
      'paid owners manage own ' || table_name,
      table_name
    );
  end loop;
end;
$$;

notify pgrst, 'reload schema';
