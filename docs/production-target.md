# ELLO production target

Verified on 2026-09-24 against the Supabase dashboard, the local app configuration, and the JavaScript served by `https://ello.app.br/`.

## Authoritative production identity

- Supabase dashboard label: `ELLO1`
- Supabase immutable project ref: `fahrhrcxzcnnrhjavrfk`
- Supabase URL: `https://fahrhrcxzcnnrhjavrfk.supabase.co`
- Supabase branch: `main` (`Production`)
- Vercel project: `ello-app` (`prj_2pimmMlPl2G3xz0zTv4ERZWxsoxh`)
- Public domain: `https://ello.app.br`

Use the **Supabase project ref** as the decisive database identifier. The dashboard label is useful for recognition but can be renamed. The production site's served JavaScript and this checkout's local link both resolve to `fahrhrcxzcnnrhjavrfk`.

## Do not confuse with the inactive checkout

`C:\Users\Yan Gabriel\Desktop\ello.app` is the historical/inactive checkout. Its local `.env` has no production Supabase ref configured (`VITE_SUPABASE_URL` is `placeholder`), and it has no linked `supabase/.temp/project-ref`. Do not use it for Supabase migrations or as the source checkout for ELLO production deployments.

Both checkouts currently show the same Git remote and Vercel project ID. Those values **do not** distinguish the correct database. Always check the Supabase ref; `ELLO1` must resolve to `fahrhrcxzcnnrhjavrfk`.

## Before deploying

From `C:\Users\Yan Gabriel\Documents\ELLO`, run:

```powershell
npm run deploy:prod
```

This verifies `.vercel/project.json`, `supabase/.temp/project-ref`, `.env`, and the app runtime Supabase URL before invoking the production deployment. If any check fails, stop and inspect this document rather than switching projects or substituting credentials.
