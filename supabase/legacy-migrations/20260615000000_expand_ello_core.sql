create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'appointment_status'
  ) then
    create type public.appointment_status as enum (
      'pending',
      'confirmed',
      'completed',
      'cancelled'
    );
  end if;
end;
$$;

alter table public.professional_profiles
  add column if not exists headline text,
  add column if not exists bio text,
  add column if not exists experience_years integer not null default 0 check (experience_years >= 0),
  add column if not exists trust_level text not null default 'Bronze',
  add column if not exists rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  add column if not exists completed_jobs integer not null default 0 check (completed_jobs >= 0),
  add column if not exists response_time_minutes integer,
  add column if not exists is_published boolean not null default false,
  add column if not exists ello_link_slug text;

create unique index if not exists professional_profiles_ello_link_slug_key
  on public.professional_profiles (ello_link_slug)
  where ello_link_slug is not null;

alter table public.portfolio_items
  add column if not exists media_url text,
  add column if not exists media_kind text not null default 'image',
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0;

update public.portfolio_items
set media_url = image_url
where media_url is null and image_url is not null;

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;
alter table public.favorites enable row level security;

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('portfolio', 'portfolio', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']),
  ('quote-attachments', 'quote-attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write"
  on storage.objects for all
  using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "portfolio public read" on storage.objects;
create policy "portfolio public read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "portfolio owner write" on storage.objects;
create policy "portfolio owner write"
  on storage.objects for all
  using (bucket_id = 'portfolio' and owner = auth.uid())
  with check (bucket_id = 'portfolio' and owner = auth.uid());

drop policy if exists "quote attachments owner read" on storage.objects;
create policy "quote attachments owner read"
  on storage.objects for select
  using (bucket_id = 'quote-attachments' and owner = auth.uid());

drop policy if exists "quote attachments owner write" on storage.objects;
create policy "quote attachments owner write"
  on storage.objects for all
  using (bucket_id = 'quote-attachments' and owner = auth.uid())
  with check (bucket_id = 'quote-attachments' and owner = auth.uid());
