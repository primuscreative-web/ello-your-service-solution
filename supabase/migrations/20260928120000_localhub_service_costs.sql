create table if not exists public.localhub_service_costs (
  service_id uuid primary key references public.localhub_services(id) on delete cascade,
  cost_price numeric(10, 2) not null default 0 check (cost_price >= 0),
  updated_at timestamptz not null default now()
);

alter table public.localhub_service_costs enable row level security;

drop policy if exists "owners manage service costs" on public.localhub_service_costs;
create policy "owners manage service costs"
  on public.localhub_service_costs for all to authenticated
  using (exists (
    select 1
    from public.localhub_services s
    join public.localhub_businesses b on b.id = s.business_id
    where s.id = service_id and b.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.localhub_services s
    join public.localhub_businesses b on b.id = s.business_id
    where s.id = service_id and b.owner_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.localhub_service_costs to authenticated;
revoke all on public.localhub_service_costs from anon;
