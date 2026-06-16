create unique index if not exists professional_profiles_ello_link_slug_key
  on public.professional_profiles (ello_link_slug)
  where ello_link_slug is not null;
