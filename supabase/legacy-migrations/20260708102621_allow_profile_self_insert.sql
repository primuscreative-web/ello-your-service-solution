drop policy if exists "profiles owner insert" on public.profiles;

create policy "profiles owner insert"
  on public.profiles for insert
  with check (id = auth.uid());
