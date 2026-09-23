drop policy if exists "professional profiles admin read" on public.professional_profiles;
create policy "professional profiles admin read"
  on public.professional_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

drop policy if exists "professional profiles admin update monetization" on public.professional_profiles;
create policy "professional profiles admin update monetization"
  on public.professional_profiles for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

drop policy if exists "monetization requests admin read" on public.monetization_requests;
create policy "monetization requests admin read"
  on public.monetization_requests for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

drop policy if exists "monetization requests admin update" on public.monetization_requests;
create policy "monetization requests admin update"
  on public.monetization_requests for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

drop policy if exists "local partner spaces admin manage" on public.local_partner_spaces;
create policy "local partner spaces admin manage"
  on public.local_partner_spaces for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

grant select, update on public.professional_profiles to authenticated;
grant select, update on public.monetization_requests to authenticated;
grant select, insert, update, delete on public.local_partner_spaces to authenticated;
