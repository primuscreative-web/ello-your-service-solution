create table if not exists public.localhub_staff_access (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  staff_id uuid not null,
  email text not null check (email = lower(btrim(email)) and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  created_at timestamptz not null default now(),
  constraint localhub_staff_access_staff_business_fk
    foreign key (staff_id, business_id)
    references public.localhub_staff(id, business_id)
    on delete cascade,
  constraint localhub_staff_access_staff_id_key unique (staff_id)
);

create unique index if not exists localhub_staff_access_email_key
  on public.localhub_staff_access (lower(email));

create index if not exists localhub_staff_access_business_idx
  on public.localhub_staff_access (business_id);

alter table public.localhub_staff_access enable row level security;

create or replace function public.localhub_staff_id_for_business(p_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select access.staff_id
    from public.localhub_staff_access access
    join public.localhub_staff staff
      on staff.id = access.staff_id
     and staff.business_id = access.business_id
    join auth.users account on account.id = (select auth.uid())
   where access.business_id = p_business_id
     and access.email = lower(account.email)
     and account.email_confirmed_at is not null
     and staff.is_active
   limit 1;
$$;

create or replace function public.localhub_is_business_staff(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.localhub_staff_id_for_business(p_business_id) is not null;
$$;

revoke all on function public.localhub_staff_id_for_business(uuid) from public;
revoke all on function public.localhub_is_business_staff(uuid) from public;
grant execute on function public.localhub_staff_id_for_business(uuid) to anon, authenticated;
grant execute on function public.localhub_is_business_staff(uuid) to anon, authenticated;

grant select, insert, update, delete on public.localhub_staff_access to authenticated;

drop policy if exists "owners manage professional access" on public.localhub_staff_access;
create policy "owners manage professional access"
  on public.localhub_staff_access for all to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
     where business.id = business_id and business.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.localhub_businesses business
     where business.id = business_id and business.owner_id = (select auth.uid())
  ));

drop policy if exists "professionals read their own access" on public.localhub_staff_access;
create policy "professionals read their own access"
  on public.localhub_staff_access for select to authenticated
  using (staff_id = public.localhub_staff_id_for_business(business_id));

drop policy if exists "published businesses are public" on public.localhub_businesses;
create policy "published businesses are public"
  on public.localhub_businesses for select to anon, authenticated
  using (
    is_published
    or owner_id = (select auth.uid())
    or public.localhub_is_business_staff(id)
  );

drop policy if exists "active services are public for published businesses" on public.localhub_services;
create policy "active services are public for published businesses"
  on public.localhub_services for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.is_published
    ))
    or exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.owner_id = (select auth.uid())
    )
    or public.localhub_is_business_staff(business_id)
  );

drop policy if exists "published businesses expose active staff" on public.localhub_staff;
create policy "published businesses expose active staff"
  on public.localhub_staff for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.is_published
    ))
    or exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.owner_id = (select auth.uid())
    )
    or public.localhub_is_business_staff(business_id)
  );

drop policy if exists "owners read their bookings" on public.localhub_bookings;
create policy "owners read their bookings"
  on public.localhub_bookings for select to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses business
       where business.id = business_id and business.owner_id = (select auth.uid())
    )
    or staff_id = public.localhub_staff_id_for_business(business_id)
  );

drop policy if exists "professionals update assigned bookings" on public.localhub_bookings;
create policy "professionals update assigned bookings"
  on public.localhub_bookings for update to authenticated
  using (staff_id = public.localhub_staff_id_for_business(business_id))
  with check (staff_id = public.localhub_staff_id_for_business(business_id));

notify pgrst, 'reload schema';
