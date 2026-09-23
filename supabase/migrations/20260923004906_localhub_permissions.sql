alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;

revoke all on public.localhub_businesses from anon, authenticated;
revoke all on public.localhub_services from anon, authenticated;
revoke all on public.localhub_bookings from anon, authenticated;

grant select (id, name, slug, category, city, phone, description, address, is_published, created_at)
  on public.localhub_businesses to anon;
grant select, insert, update, delete on public.localhub_businesses to authenticated;

grant select on public.localhub_services to anon;
grant select, insert, update, delete on public.localhub_services to authenticated;

grant insert (business_id, service_id, customer_name, phone, booking_date, booking_time, status)
  on public.localhub_bookings to anon, authenticated;
grant select on public.localhub_bookings to authenticated;
grant update (status) on public.localhub_bookings to authenticated;
