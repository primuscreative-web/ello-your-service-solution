-- Enforce Business-only WhatsApp templates on both INSERT and UPDATE paths.
create or replace function private.enforce_localhub_business_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_items jsonb;
  v_new_items jsonb;
  v_old_videos integer := 0;
  v_new_videos integer := 0;
  v_video_limit integer;
  v_portfolio_changed boolean;
begin
  v_new_items := coalesce(new.onboarding_details -> 'portfolioItems', '[]'::jsonb);
  if tg_op = 'UPDATE' then
    v_old_items := coalesce(old.onboarding_details -> 'portfolioItems', '[]'::jsonb);
    v_portfolio_changed := new.onboarding_details is distinct from old.onboarding_details;
  else
    v_old_items := '[]'::jsonb;
    v_portfolio_changed := true;
  end if;

  if v_portfolio_changed then
    if jsonb_typeof(v_new_items) <> 'array' then
      raise exception 'O portfólio enviado é inválido.' using errcode = '22023';
    end if;

    select count(*)::integer into v_new_videos
      from jsonb_array_elements(v_new_items) item
     where item ->> 'mediaType' = 'video';
    select count(*)::integer into v_old_videos
      from jsonb_array_elements(v_old_items) item
     where item ->> 'mediaType' = 'video';

    v_video_limit := private.localhub_plan_limit(new.id, 'portfolio_videos');
    -- Downgrades retain existing data but block adding or replacing videos
    -- while the stored count is over the tier limit.
    if v_video_limit is not null
      and v_new_videos > v_video_limit
      and v_new_videos > v_old_videos then
      raise exception 'PLAN_LIMIT:portfolio_videos'
        using errcode = 'P0001',
              detail = 'O limite de vídeos deste plano foi atingido.';
    end if;
  end if;

  if (tg_op = 'INSERT' and new.whatsapp_templates is distinct from '{}'::jsonb)
     or (tg_op = 'UPDATE' and new.whatsapp_templates is distinct from old.whatsapp_templates) then
    if private.localhub_effective_plan(new.id) <> 'business' then
      raise exception 'PLAN_FEATURE:whatsapp_automation'
        using errcode = 'P0001',
              detail = 'A automação WhatsApp está disponível no plano Business.';
    end if;
  end if;

  return new;
end;
$$;
