alter table public.localhub_businesses
  add column if not exists whatsapp_templates jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
