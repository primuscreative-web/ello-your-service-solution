drop policy if exists "quotes participant update" on public.quote_requests;
create policy "quotes participant update"
  on public.quote_requests for update
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = quote_requests.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = quote_requests.professional_id and p.user_id = auth.uid()
    )
  );
