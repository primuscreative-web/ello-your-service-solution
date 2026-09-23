# LocalHub

LocalHub gives local businesses one place to present services and receive appointment requests.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create a business, add services from the studio catalog, then open its page preview and submit an appointment request. Requests appear in the studio agenda, where they can be confirmed or declined.

## Current data storage

This first working version stores business details, services, and appointments in the browser's local storage. Data is limited to that browser and device. Public page URLs are previews and are not yet available to other visitors. The Supabase configuration and existing migrations remain in the repository; no remote database changes are made by the local demo.

The original Stitch screens and visual references are preserved under `public/localhub/`.
