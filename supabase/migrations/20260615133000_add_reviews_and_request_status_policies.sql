alter table public.reviews enable row level security;

create unique index if not exists reviews_quote_request_id_key
  on public.reviews (quote_request_id);

create or replace function public.refresh_professional_review_stats()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_professional_id uuid;
begin
  target_professional_id := coalesce(new.professional_id, old.professional_id);

  update public.professional_profiles p
  set
    rating = coalesce(stats.average_rating, 0),
    completed_jobs = coalesce(stats.review_count, 0),
    updated_at = now()
  from (
    select
      professional_id,
      round(avg(rating)::numeric, 2) as average_rating,
      count(*)::integer as review_count
    from public.reviews
    where professional_id = target_professional_id
    group by professional_id
  ) stats
  where p.id = target_professional_id
    and p.id = stats.professional_id;

  update public.professional_profiles p
  set rating = 0, completed_jobs = 0, updated_at = now()
  where p.id = target_professional_id
    and not exists (
      select 1 from public.reviews r where r.professional_id = target_professional_id
    );

  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_professional_review_stats_on_reviews on public.reviews;
create trigger refresh_professional_review_stats_on_reviews
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_professional_review_stats();

drop policy if exists "reviews participant read" on public.reviews;
create policy "reviews participant read"
  on public.reviews for select
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = reviews.professional_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = reviews.professional_id
        and p.profile_status in ('published', 'active', 'approved')
    )
  );

drop policy if exists "reviews client insert" on public.reviews;
create policy "reviews client insert"
  on public.reviews for insert
  with check (
    exists (
      select 1
      from public.client_profiles c
      join public.quote_requests q on q.client_id = c.id
      where c.id = reviews.client_id
        and c.user_id = auth.uid()
        and q.id = reviews.quote_request_id
        and q.professional_id = reviews.professional_id
        and q.status = 'completed'
    )
  );

drop policy if exists "reviews client update" on public.reviews;
create policy "reviews client update"
  on public.reviews for update
  using (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles c
      where c.id = reviews.client_id and c.user_id = auth.uid()
    )
  );
