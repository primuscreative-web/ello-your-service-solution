alter table public.localhub_bookings
  add column if not exists visit_type text not null default 'first_visit'
    check (visit_type in ('first_visit', 'follow_up')),
  add column if not exists service_mode text not null default 'in_person'
    check (service_mode in ('in_person', 'online', 'home_visit')),
  add column if not exists reminder_consent boolean not null default false;

alter table public.localhub_bookings
  drop constraint if exists localhub_bookings_status_check;

alter table public.localhub_bookings
  add constraint localhub_bookings_status_check
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'));

grant insert (visit_type, service_mode, reminder_consent) on public.localhub_bookings to anon, authenticated;

alter table public.localhub_staff
  add column if not exists registration_label text not null default '',
  add column if not exists registration_number text not null default '';

grant select (registration_label, registration_number) on public.localhub_staff to anon, authenticated;
grant insert (registration_label, registration_number) on public.localhub_staff to authenticated;
grant update (registration_label, registration_number) on public.localhub_staff to authenticated;

create table if not exists public.localhub_waitlist (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses(id) on delete cascade,
  service_id uuid not null,
  staff_id uuid,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 100),
  phone text not null check (length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  preferred_date date,
  preferred_weekday smallint check (preferred_weekday between 1 and 7),
  day_period text not null default 'any'
    check (day_period in ('morning', 'afternoon', 'evening', 'any')),
  contact_consent boolean not null default false check (contact_consent),
  status text not null default 'waiting'
    check (status in ('waiting', 'contacted', 'scheduled', 'closed')),
  created_at timestamptz not null default now(),
  constraint localhub_waitlist_service_business_fk
    foreign key (service_id, business_id)
    references public.localhub_services(id, business_id) on delete cascade,
  constraint localhub_waitlist_staff_business_fk
    foreign key (staff_id, business_id)
    references public.localhub_staff(id, business_id) on delete set null (staff_id)
);

create index if not exists localhub_waitlist_business_status_created_idx
  on public.localhub_waitlist(business_id, status, created_at);

alter table public.localhub_waitlist enable row level security;
revoke all on public.localhub_waitlist from anon, authenticated;
grant insert (business_id, service_id, staff_id, customer_name, phone, preferred_date,
  preferred_weekday, day_period, contact_consent) on public.localhub_waitlist to anon, authenticated;
grant select, update, delete on public.localhub_waitlist to authenticated;

drop policy if exists "public can join published business waitlists" on public.localhub_waitlist;
create policy "public can join published business waitlists"
  on public.localhub_waitlist for insert to anon, authenticated
  with check (
    contact_consent
    and status = 'waiting'
    and exists (
      select 1
        from public.localhub_businesses business
        join public.localhub_services service on service.business_id = business.id
       where business.id = localhub_waitlist.business_id
         and business.is_published
         and service.id = localhub_waitlist.service_id
         and service.is_active
    )
  );

drop policy if exists "owners manage their business waitlist" on public.localhub_waitlist;
create policy "owners manage their business waitlist"
  on public.localhub_waitlist for all to authenticated
  using (exists (
    select 1 from public.localhub_businesses business
     where business.id = localhub_waitlist.business_id and business.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.localhub_businesses business
     where business.id = localhub_waitlist.business_id and business.owner_id = (select auth.uid())
  ));

notify pgrst, 'reload schema';
