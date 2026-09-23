# LocalHub

LocalHub gives local businesses one place to present services and receive appointment requests.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create a business, add services from the studio catalog, then open its page preview and submit an appointment request. Requests appear in the studio agenda, where they can be confirmed or declined.

## Current data storage

The current interface stores business details, services, and appointments in the browser's local storage. Data is limited to that browser and device, and public page URLs are previews rather than pages available to other visitors.

The connected Supabase project has the LocalHub schema, row-level security policies, and restricted API grants. The interface has not yet moved its business and appointment data from local storage to Supabase. Previous ELLO migrations are archived under `supabase/legacy-migrations/` and must not be applied to the new project.

The original Stitch screens and visual references are preserved under `public/localhub/`.
