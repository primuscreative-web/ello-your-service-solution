alter table public.professional_profiles
  add column if not exists boosted_until timestamptz,
  add column if not exists ello_link_pro_enabled boolean not null default false,
  add column if not exists ello_link_pro_until timestamptz,
  add column if not exists intro_video_url text,
  add column if not exists cover_url text,
  add column if not exists qr_code_enabled boolean not null default true,
  add column if not exists max_portfolio_items integer not null default 6;

alter table public.professional_profiles
  drop constraint if exists professional_profiles_max_portfolio_items_check;

alter table public.professional_profiles
  add constraint professional_profiles_max_portfolio_items_check
  check (max_portfolio_items between 0 and 60);

create table if not exists public.ello_link_events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  event_type text not null,
  source text,
  visitor_hash text,
  created_at timestamptz not null default now(),
  constraint ello_link_events_event_type_check
    check (event_type in ('view', 'quote_click', 'share_click', 'qr_view'))
);

create table if not exists public.monetization_requests (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  request_type text not null,
  status text not null default 'pending',
  requested_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monetization_requests_request_type_check
    check (request_type in ('profile_boost', 'ello_link_pro', 'local_partner_space')),
  constraint monetization_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled'))
);

create table if not exists public.local_partner_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text not null,
  description text not null,
  cta_label text not null default 'Conhecer parceiro',
  cta_url text,
  image_url text,
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_profiles_boosted_until_idx
  on public.professional_profiles (boosted_until desc)
  where boosted_until is not null;

create index if not exists ello_link_events_professional_created_idx
  on public.ello_link_events (professional_id, created_at desc);

create index if not exists monetization_requests_professional_created_idx
  on public.monetization_requests (professional_id, created_at desc);

create index if not exists local_partner_spaces_active_city_idx
  on public.local_partner_spaces (active, city, starts_at, ends_at);

drop trigger if exists update_monetization_requests_updated_at on public.monetization_requests;
create trigger update_monetization_requests_updated_at
  before update on public.monetization_requests
  for each row execute function public.set_updated_at();

drop trigger if exists update_local_partner_spaces_updated_at on public.local_partner_spaces;
create trigger update_local_partner_spaces_updated_at
  before update on public.local_partner_spaces
  for each row execute function public.set_updated_at();

alter table public.ello_link_events enable row level security;
alter table public.monetization_requests enable row level security;
alter table public.local_partner_spaces enable row level security;

drop policy if exists "ello link events public insert" on public.ello_link_events;
create policy "ello link events public insert"
  on public.ello_link_events for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = ello_link_events.professional_id
        and p.profile_status in ('published', 'active', 'approved')
    )
  );

drop policy if exists "ello link events owner read" on public.ello_link_events;
create policy "ello link events owner read"
  on public.ello_link_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = ello_link_events.professional_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "monetization requests owner read" on public.monetization_requests;
create policy "monetization requests owner read"
  on public.monetization_requests for select
  to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = monetization_requests.professional_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "monetization requests owner insert" on public.monetization_requests;
create policy "monetization requests owner insert"
  on public.monetization_requests for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = monetization_requests.professional_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "monetization requests owner update" on public.monetization_requests;
create policy "monetization requests owner update"
  on public.monetization_requests for update
  to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = monetization_requests.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.professional_profiles p
      where p.id = monetization_requests.professional_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "local partner spaces public read active" on public.local_partner_spaces;
create policy "local partner spaces public read active"
  on public.local_partner_spaces for select
  to anon, authenticated
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

grant select on public.local_partner_spaces to anon, authenticated;
grant insert, select on public.ello_link_events to anon, authenticated;
grant select, insert, update on public.monetization_requests to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-covers', 'profile-covers', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('profile-videos', 'profile-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile covers public read" on storage.objects;
create policy "profile covers public read"
  on storage.objects for select
  using (bucket_id = 'profile-covers');

drop policy if exists "profile covers owner write" on storage.objects;
create policy "profile covers owner write"
  on storage.objects for all
  using (bucket_id = 'profile-covers' and owner = auth.uid())
  with check (bucket_id = 'profile-covers' and owner = auth.uid());

drop policy if exists "profile videos public read" on storage.objects;
create policy "profile videos public read"
  on storage.objects for select
  using (bucket_id = 'profile-videos');

drop policy if exists "profile videos owner write" on storage.objects;
create policy "profile videos owner write"
  on storage.objects for all
  using (bucket_id = 'profile-videos' and owner = auth.uid())
  with check (bucket_id = 'profile-videos' and owner = auth.uid());

comment on table public.monetization_requests is
  'Solicitacoes comerciais iniciais da ELLO sem gateway de pagamento ativo.';
comment on table public.ello_link_events is
  'Eventos anonimizados para estatisticas do ELLO Link.';
comment on table public.local_partner_spaces is
  'Espacos comerciais para parceiros locais exibidos no app.';
