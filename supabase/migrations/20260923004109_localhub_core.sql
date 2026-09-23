create table public.localhub_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null,
  city text not null,
  phone text not null,
  description text not null default '',
  address text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.localhub_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses (id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 100),
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localhub_services_id_business_id_key unique (id, business_id)
);

create index localhub_services_business_id_idx on public.localhub_services (business_id);

create table public.localhub_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.localhub_businesses (id) on delete cascade,
  service_id uuid not null references public.localhub_services (id) on delete restrict,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 100),
  phone text not null check (length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15),
  booking_date date not null,
  booking_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint localhub_bookings_service_business_match
    foreign key (service_id, business_id)
    references public.localhub_services (id, business_id)
    on delete restrict
);

create index localhub_bookings_business_schedule_idx
  on public.localhub_bookings (business_id, booking_date, booking_time);

alter table public.localhub_businesses enable row level security;
alter table public.localhub_services enable row level security;
alter table public.localhub_bookings enable row level security;

create policy "published businesses are public"
  on public.localhub_businesses for select to anon, authenticated
  using (is_published or owner_id = (select auth.uid()));

create policy "owners create their business"
  on public.localhub_businesses for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "owners update their business"
  on public.localhub_businesses for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners delete their business"
  on public.localhub_businesses for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "active services are public for published businesses"
  on public.localhub_services for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.is_published
    )
    or exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "owners manage their services"
  on public.localhub_services for all to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "public can request bookings"
  on public.localhub_bookings for insert to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1
      from public.localhub_services s
      join public.localhub_businesses b on b.id = s.business_id
      where s.id = service_id
        and s.business_id = localhub_bookings.business_id
        and s.is_active
        and b.is_published
    )
  );

create policy "owners read their bookings"
  on public.localhub_bookings for select to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "owners update their booking status"
  on public.localhub_bookings for update to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

grant select (id, name, slug, category, city, phone, description, address, is_published, created_at)
  on public.localhub_businesses to anon;
grant select on public.localhub_businesses to authenticated;
grant insert, update, delete on public.localhub_businesses to authenticated;
grant select on public.localhub_services to anon, authenticated;
grant insert, update, delete on public.localhub_services to authenticated;
grant insert (business_id, service_id, customer_name, phone, booking_date, booking_time, status)
  on public.localhub_bookings to anon, authenticated;
grant select on public.localhub_bookings to authenticated;
grant update (status) on public.localhub_bookings to authenticated;
