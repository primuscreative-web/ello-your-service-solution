alter table public.professional_profiles
  add column if not exists ello_link_whatsapp_message text,
  add column if not exists ello_link_coupon_code text,
  add column if not exists ello_link_coupon_description text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'professional_profiles_ello_link_coupon_code_format'
      and conrelid = 'public.professional_profiles'::regclass
  ) then
    alter table public.professional_profiles
      add constraint professional_profiles_ello_link_coupon_code_format
      check (
        ello_link_coupon_code is null
        or ello_link_coupon_code ~ '^[A-Z]{4}[0-9]{2}$'
      );
  end if;
end $$;
