alter table public.localhub_businesses
  add column if not exists onboarding_details jsonb not null
  default '{"specialties": [], "serviceModes": []}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'localhub_businesses_onboarding_details_shape'
      and conrelid = 'public.localhub_businesses'::regclass
  ) then
    alter table public.localhub_businesses
      add constraint localhub_businesses_onboarding_details_shape check (
        jsonb_typeof(onboarding_details) = 'object'
        and jsonb_typeof(onboarding_details->'specialties') = 'array'
        and jsonb_typeof(onboarding_details->'serviceModes') = 'array'
      );
  end if;
end
$$;
