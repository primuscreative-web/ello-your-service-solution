alter table public.localhub_businesses
  add column if not exists banner_url text;

grant select (
  id,
  name,
  slug,
  category,
  city,
  phone,
  description,
  address,
  banner_url,
  is_published,
  created_at
)
on public.localhub_businesses to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-banners',
  'business-banners',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "business banners public read" on storage.objects;
create policy "business banners public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'business-banners');

drop policy if exists "business banners owner upload" on storage.objects;
create policy "business banners owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
