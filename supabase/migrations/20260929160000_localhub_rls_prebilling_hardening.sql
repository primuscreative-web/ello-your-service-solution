alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from public, anon, authenticated;

revoke truncate, references, trigger
  on all tables in schema public
  from public, anon, authenticated;

do $$
declare
  v_unprotected_tables text;
begin
  select string_agg(format('%I', table_class.relname), ', ' order by table_class.relname)
    into v_unprotected_tables
    from pg_class table_class
    join pg_namespace table_schema on table_schema.oid = table_class.relnamespace
   where table_schema.nspname = 'public'
     and table_class.relkind = 'r'
     and table_class.relname like 'localhub_%'
     and (
       not table_class.relrowsecurity
       or not exists (
         select 1
           from pg_policies policy
          where policy.schemaname = table_schema.nspname
            and policy.tablename = table_class.relname
       )
     );

  if v_unprotected_tables is not null then
    raise exception 'RLS ausente ou sem policy nas tabelas ELLO: %', v_unprotected_tables;
  end if;
end;
$$;

notify pgrst, 'reload schema';
