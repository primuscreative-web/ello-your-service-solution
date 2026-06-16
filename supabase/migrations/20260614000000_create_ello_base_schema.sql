create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('client', 'professional', 'admin');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'verification_status') then
    create type public.verification_status as enum ('draft', 'pending', 'verified', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'quote_status') then
    create type public.quote_status as enum (
      'new',
      'quoted',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'declined'
    );
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'message_kind') then
    create type public.message_kind as enum ('text', 'image', 'file', 'quote', 'appointment');
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'client',
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  birth_date date,
  city text not null default 'Sao Paulo, SP',
  region text,
  interests text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  public_name text,
  specialty text not null,
  city text not null,
  coverage text not null,
  description text not null,
  base_price text not null,
  charge_type text not null,
  availability text,
  materials text,
  phone text,
  fiscal_city text,
  document_ref text,
  verification_status public.verification_status not null default 'draft',
  profile_status text not null default 'draft',
  avatar_url text,
  banner_url text,
  headline text,
  bio text,
  experience_years integer not null default 0 check (experience_years >= 0),
  trust_level text not null default 'Bronze',
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  completed_jobs integer not null default 0 check (completed_jobs >= 0),
  response_time_minutes integer,
  is_published boolean not null default false,
  ello_link_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  base_price text,
  charge_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  media_url text,
  media_kind text not null default 'image',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  desired_date timestamptz,
  location text not null,
  status public.quote_status not null default 'new',
  response_price text,
  response_eta text,
  response_message text,
  responded_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_messages (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.appointment_status not null default 'pending',
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, professional_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create unique index if not exists professional_profiles_ello_link_slug_key
  on public.professional_profiles (ello_link_slug)
  where ello_link_slug is not null;

create index if not exists professional_profiles_public_search_idx
  on public.professional_profiles (profile_status, rating desc, completed_jobs desc);

create index if not exists services_professional_id_idx on public.services (professional_id);
create index if not exists services_category_idx on public.services (category) where active;
create index if not exists portfolio_items_professional_id_idx on public.portfolio_items (professional_id);
create index if not exists quote_requests_client_id_idx on public.quote_requests (client_id, created_at desc);
create index if not exists quote_requests_professional_id_idx on public.quote_requests (professional_id, created_at desc);
create index if not exists quote_messages_quote_request_id_idx on public.quote_messages (quote_request_id, created_at);
create index if not exists appointments_client_id_idx on public.appointments (client_id, starts_at);
create index if not exists appointments_professional_id_idx on public.appointments (professional_id, starts_at);
create unique index if not exists reviews_quote_request_id_key on public.reviews (quote_request_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_client_profiles_updated_at on public.client_profiles;
create trigger set_client_profiles_updated_at
  before update on public.client_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_professional_profiles_updated_at on public.professional_profiles;
create trigger set_professional_profiles_updated_at
  before update on public.professional_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists set_quote_requests_updated_at on public.quote_requests;
create trigger set_quote_requests_updated_at
  before update on public.quote_requests
  for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Usuario ELLO'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_messages enable row level security;
alter table public.appointments enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles owner read" on public.profiles;
create policy "profiles owner read"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "client profiles owner read" on public.client_profiles;
create policy "client profiles owner read"
  on public.client_profiles for select
  using (user_id = auth.uid());

drop policy if exists "client profiles owner insert" on public.client_profiles;
create policy "client profiles owner insert"
  on public.client_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "client profiles owner update" on public.client_profiles;
create policy "client profiles owner update"
  on public.client_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "professional profiles public or owner read" on public.professional_profiles;
create policy "professional profiles public or owner read"
  on public.professional_profiles for select
  using (
    user_id = auth.uid()
    or profile_status in ('published', 'active', 'approved')
    or is_published = true
  );

drop policy if exists "professional profiles owner insert" on public.professional_profiles;
create policy "professional profiles owner insert"
  on public.professional_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "professional profiles owner update" on public.professional_profiles;
create policy "professional profiles owner update"
  on public.professional_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "services public or owner read" on public.services;
create policy "services public or owner read"
  on public.services for select
  using (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = services.professional_id
        and (
          p.user_id = auth.uid()
          or p.profile_status in ('published', 'active', 'approved')
          or p.is_published = true
        )
    )
  );

drop policy if exists "services owner insert" on public.services;
create policy "services owner insert"
  on public.services for insert
  with check (
    exists (
      select 1 from public.professional_profiles p
      where p.id = services.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "services owner update" on public.services;
create policy "services owner update"
  on public.services for update
  using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = services.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professional_profiles p
      where p.id = services.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "portfolio public or owner read" on public.portfolio_items;
create policy "portfolio public or owner read"
  on public.portfolio_items for select
  using (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = portfolio_items.professional_id
        and (
          p.user_id = auth.uid()
          or p.profile_status in ('published', 'active', 'approved')
          or p.is_published = true
        )
    )
  );

drop policy if exists "portfolio owner insert" on public.portfolio_items;
create policy "portfolio owner insert"
  on public.portfolio_items for insert
  with check (
    exists (
      select 1 from public.professional_profiles p
      where p.id = portfolio_items.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "portfolio owner update" on public.portfolio_items;
create policy "portfolio owner update"
  on public.portfolio_items for update
  using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = portfolio_items.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professional_profiles p
      where p.id = portfolio_items.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "quotes participant read" on public.quote_requests;
create policy "quotes participant read"
  on public.quote_requests for select
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "quotes client insert" on public.quote_requests;
create policy "quotes client insert"
  on public.quote_requests for insert
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id
        and (p.profile_status in ('published', 'active', 'approved') or p.is_published = true)
    )
  );

drop policy if exists "quotes participant update" on public.quote_requests;
create policy "quotes participant update"
  on public.quote_requests for update
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "quote messages participant read" on public.quote_messages;
create policy "quote messages participant read"
  on public.quote_messages for select
  using (
    exists (
      select 1
      from public.quote_requests q
      left join public.client_profiles c on c.id = q.client_id
      left join public.professional_profiles p on p.id = q.professional_id
      where q.id = quote_messages.quote_request_id
        and (c.user_id = auth.uid() or p.user_id = auth.uid())
    )
  );

drop policy if exists "quote messages participant insert" on public.quote_messages;
create policy "quote messages participant insert"
  on public.quote_messages for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.quote_requests q
      left join public.client_profiles c on c.id = q.client_id
      left join public.professional_profiles p on p.id = q.professional_id
      where q.id = quote_messages.quote_request_id
        and (c.user_id = auth.uid() or p.user_id = auth.uid())
    )
  );

drop policy if exists "appointments participant read" on public.appointments;
create policy "appointments participant read"
  on public.appointments for select
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = appointments.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = appointments.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "appointments participant write" on public.appointments;
create policy "appointments participant write"
  on public.appointments for all
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = appointments.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = appointments.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = appointments.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = appointments.professional_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "favorites client read" on public.favorites;
create policy "favorites client read"
  on public.favorites for select
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = favorites.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "favorites client write" on public.favorites;
create policy "favorites client write"
  on public.favorites for all
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = favorites.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = favorites.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "reviews participant read" on public.reviews;
create policy "reviews participant read"
  on public.reviews for select
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = reviews.professional_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = reviews.professional_id
        and (p.profile_status in ('published', 'active', 'approved') or p.is_published = true)
    )
  );

drop policy if exists "reviews client insert" on public.reviews;
create policy "reviews client insert"
  on public.reviews for insert
  with check (
    exists (
      select 1
      from public.client_profiles c
      join public.quote_requests q on q.client_id = c.id
      where c.id = reviews.client_id
        and c.user_id = auth.uid()
        and q.id = reviews.quote_request_id
        and q.professional_id = reviews.professional_id
        and q.status = 'completed'
    )
  );

drop policy if exists "reviews client update" on public.reviews;
create policy "reviews client update"
  on public.reviews for update
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.professional_profiles, public.services, public.portfolio_items, public.reviews to anon;

grant usage on type public.app_role to anon, authenticated;
grant usage on type public.verification_status to anon, authenticated;
grant usage on type public.quote_status to anon, authenticated;
grant usage on type public.appointment_status to anon, authenticated;
grant usage on type public.message_kind to anon, authenticated;
