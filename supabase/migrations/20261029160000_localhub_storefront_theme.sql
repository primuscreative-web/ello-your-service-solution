alter table public.localhub_businesses
  add column if not exists public_theme text not null default 'standard'
  check (length(public_theme) between 1 and 40);

grant select (public_theme)
  on public.localhub_businesses to anon, authenticated;

notify pgrst, 'reload schema';
