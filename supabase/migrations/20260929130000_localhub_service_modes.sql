alter table public.localhub_services
  add column if not exists service_modes text[] not null default array['in_person']::text[];

update public.localhub_services service
   set service_modes = coalesce(
     nullif(array(
       select case mode
         when 'consultorio' then 'in_person'
         when 'online' then 'online'
         when 'domiciliar' then 'home_visit'
       end
         from jsonb_array_elements_text(coalesce(business.onboarding_details->'serviceModes', '[]'::jsonb)) as configured(mode)
        where mode in ('consultorio', 'online', 'domiciliar')
     ), array[]::text[]),
     array['in_person']::text[]
   )
  from public.localhub_businesses business
 where service.business_id = business.id
   and service.service_modes = array['in_person']::text[];

alter table public.localhub_services
  drop constraint if exists localhub_services_service_modes_check;

alter table public.localhub_services
  add constraint localhub_services_service_modes_check
    check (
      cardinality(service_modes) > 0
      and service_modes <@ array['in_person', 'online', 'home_visit']::text[]
    );

notify pgrst, 'reload schema';
