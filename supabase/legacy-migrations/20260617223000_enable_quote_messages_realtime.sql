do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'quote_messages'
  ) then
    alter publication supabase_realtime add table public.quote_messages;
  end if;
end;
$$;
