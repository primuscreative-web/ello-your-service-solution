drop policy "owners manage their services" on public.localhub_services;

create policy "owners create their services"
  on public.localhub_services for insert to authenticated
  with check (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "owners update their services"
  on public.localhub_services for update to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "owners delete their services"
  on public.localhub_services for delete to authenticated
  using (
    exists (
      select 1 from public.localhub_businesses b
      where b.id = business_id and b.owner_id = (select auth.uid())
    )
  );

create index localhub_bookings_service_business_idx
  on public.localhub_bookings (service_id, business_id);
