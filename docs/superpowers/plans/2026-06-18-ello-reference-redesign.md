# ELLO Reference Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete ELLO mobile experience to faithfully match the 30 approved reference screens while preserving real Supabase flows and replacing plans/PRO with a gateway-ready Carteira ELLO.

**Architecture:** Keep the existing TanStack Start routes and repository layer, but introduce a focused ELLO design system, separate client/professional navigation shells, reference-driven media assets, and small reusable screen components. Deliver the redesign in four independently testable batches: visual foundation and entry, client experience, professional experience and wallet, then full regression/production verification.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router/Query, Tailwind CSS 4, Lucide React, Supabase, Node test runner, Vite, Vercel.

---

## Delivery boundaries

This plan covers the approved specification in four batches. Each batch must build, render, and preserve existing production data before the next begins.

1. **Foundation and entry:** tokens, media, splash, onboarding, auth, mode choice, shells, navigation, client Home.
2. **Client product:** search, professional profile tabs, quote request, booking, chat, budget detail, notifications, favorites and client profile.
3. **Professional product:** professional Home, agenda, budgets, CRM, ELLO Link, profile editing, statistics, reviews, settings and mode switching.
4. **Wallet, cleanup and release:** Carteira ELLO, removal of plans/PRO/demo content, accessibility, responsive QA, data regression, deployment.

## File map

### Shared design system

- Create `src/components/ello/app-shell.tsx`: centered mobile shell, scroll region and safe-area behavior.
- Create `src/components/ello/navigation.tsx`: client and professional bottom navigation.
- Create `src/components/ello/screen-header.tsx`: reference-style top bars.
- Create `src/components/ello/actions.tsx`: primary, secondary and icon buttons.
- Create `src/components/ello/fields.tsx`: search, text field, textarea and select shells.
- Create `src/components/ello/status.tsx`: badges, rating and availability primitives.
- Create `src/components/ello/media.tsx`: avatars, covers, carousel and responsive image frames.
- Create `src/components/ello/cards.tsx`: professional, service, metric and empty-state components.
- Create `src/lib/ello-navigation.ts`: mode-specific navigation definitions and route helpers.
- Create `src/lib/onboarding-state.ts`: persisted onboarding completion.
- Create `src/lib/wallet.ts`: wallet view-model types and gateway-disabled rules.
- Modify `src/components/ello/logo.tsx`: approved symbol/wordmark treatment.
- Modify `src/styles.css`: exact palette, typography, spacing, shell and motion tokens.
- Modify `src/routes/app.tsx`: select the correct navigation shell from account mode.

### Entry

- Modify `src/routes/index.tsx`: splash.
- Modify `src/routes/onboarding.tsx`: four-slide image-led carousel.
- Modify `src/routes/auth.tsx`: reference login/cadastro composition.
- Modify `src/routes/role.tsx`: blue client and green professional mode cards.

### Client

- Modify `src/routes/app.index.tsx`: client Home and photo carousel.
- Modify `src/routes/app.search.tsx`: tabs and compact search results.
- Modify `src/routes/app.professional.$id.tsx`: profile overview and actions.
- Create `src/routes/app.professional.$id.services.tsx`: services tab.
- Create `src/routes/app.professional.$id.reviews.tsx`: reviews tab.
- Create `src/routes/app.professional.$id.gallery.tsx`: gallery tab.
- Create `src/routes/app.professional.$id.schedule.tsx`: booking screen.
- Create `src/routes/app.professional.$id.quote.tsx`: detailed quote request screen.
- Modify `src/routes/app.messages.tsx`: reference chat/list presentation.
- Create `src/routes/app.quote.$id.tsx`: received budget detail and actions.
- Create `src/routes/app.notifications.tsx`: notification list.
- Modify `src/routes/app.favorites.tsx`: reference list style.
- Modify `src/routes/app.profile.tsx`: client profile/settings entry.

### Professional

- Modify `src/routes/app.business.tsx`: professional Home composition and links.
- Modify `src/routes/app.agenda.tsx`: reference calendar/list presentation.
- Create `src/routes/app.business.quotes.tsx`: received/sent budgets.
- Create `src/routes/app.business.clients.tsx`: authorized CRM list.
- Create `src/routes/app.business.statistics.tsx`: real metrics and charts.
- Create `src/routes/app.business.reviews.tsx`: received reviews.
- Create `src/routes/app.wallet.tsx`: gateway-disabled Carteira ELLO.
- Create `src/routes/app.settings.tsx`: shared and mode-specific settings.
- Modify `src/routes/p.$slug.tsx`: ELLO Link layout.
- Extend `src/lib/ello-repository.ts`: notifications, CRM, wallet and statistics queries using real data only.
- Extend `src/lib/supabase/database.types.ts`: only if migrations add persisted notification or wallet records.

### Assets and verification

- Create `public/images/ello/splash.webp`.
- Create `public/images/ello/onboarding-client.webp`.
- Create `public/images/ello/onboarding-professional.webp`.
- Create `public/images/ello/onboarding-agenda.webp`.
- Create `public/images/ello/onboarding-assistant.webp`.
- Create `public/images/ello/home-services-1.webp`.
- Create `public/images/ello/home-services-2.webp`.
- Create `public/images/ello/home-services-3.webp`.
- Create `public/images/ello/service-*.webp`: coherent service/gallery imagery required by the reference.
- Create `src/lib/onboarding-state.test.ts`.
- Create `src/lib/wallet.test.ts`.
- Create `src/lib/ello-navigation.test.ts`.
- Preserve and run `src/lib/appointments.test.ts`.

## Batch 1 — Foundation and entry

### Task 1: Lock the visual tokens and mobile shell

**Files:**
- Modify: `src/styles.css`
- Create: `src/components/ello/app-shell.tsx`
- Modify: `src/components/ello/logo.tsx`
- Test: `src/lib/ello-navigation.test.ts`

- [ ] **Step 1: Write the navigation contract test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getBottomNavigation } from "./ello-navigation.ts";

test("client navigation matches the approved five destinations", () => {
  assert.deepEqual(
    getBottomNavigation("client").map(({ label, to }) => [label, to]),
    [
      ["Início", "/app"],
      ["Busca", "/app/search"],
      ["Favoritos", "/app/favorites"],
      ["Mensagens", "/app/messages"],
      ["Perfil", "/app/profile"],
    ],
  );
});

test("professional navigation matches the approved five destinations", () => {
  assert.deepEqual(
    getBottomNavigation("professional").map(({ label, to }) => [label, to]),
    [
      ["Início", "/app/business"],
      ["Agenda", "/app/agenda"],
      ["Clientes", "/app/business/clients"],
      ["Orçamentos", "/app/business/quotes"],
      ["Mais", "/app/settings"],
    ],
  );
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node --test src/lib/ello-navigation.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `ello-navigation.ts`.

- [ ] **Step 3: Add the navigation model**

```ts
export type AppMode = "client" | "professional";

const CLIENT_ITEMS = [
  { label: "Início", to: "/app", icon: "home" },
  { label: "Busca", to: "/app/search", icon: "search" },
  { label: "Favoritos", to: "/app/favorites", icon: "heart" },
  { label: "Mensagens", to: "/app/messages", icon: "message" },
  { label: "Perfil", to: "/app/profile", icon: "user" },
] as const;

const PROFESSIONAL_ITEMS = [
  { label: "Início", to: "/app/business", icon: "home" },
  { label: "Agenda", to: "/app/agenda", icon: "calendar" },
  { label: "Clientes", to: "/app/business/clients", icon: "users" },
  { label: "Orçamentos", to: "/app/business/quotes", icon: "receipt" },
  { label: "Mais", to: "/app/settings", icon: "menu" },
] as const;

export function getBottomNavigation(mode: AppMode) {
  return mode === "professional" ? PROFESSIONAL_ITEMS : CLIENT_ITEMS;
}
```

- [ ] **Step 4: Replace the current cyan/dark palette with approved reference tokens**

In `src/styles.css`, set:

```css
:root {
  --radius: 0.75rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.16 0.045 264);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.16 0.045 264);
  --primary: oklch(0.52 0.27 263);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.975 0.008 255);
  --secondary-foreground: oklch(0.2 0.04 264);
  --muted: oklch(0.97 0.008 255);
  --muted-foreground: oklch(0.5 0.025 264);
  --accent: oklch(0.52 0.27 263);
  --accent-foreground: oklch(1 0 0);
  --border: oklch(0.9 0.012 255);
  --input: oklch(0.9 0.012 255);
  --ring: oklch(0.52 0.27 263);
  --success: oklch(0.62 0.18 148);
  --warning: oklch(0.78 0.16 75);
}
```

Remove the dotted body background, cyan actions and heavy shell shadow. Add `.ello-screen`, safe-area padding, reference card borders, blue gradient utility, green professional gradient utility and reduced-motion rules.

- [ ] **Step 5: Implement the focused shell**

```tsx
export function ElloAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white md:bg-slate-100">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-white md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run unit and build checks**

Run:

```powershell
node --test src/lib/ello-navigation.test.ts
npm.cmd run build
```

Expected: navigation tests PASS and build exits 0.

- [ ] **Step 7: Commit**

```powershell
git add src/styles.css src/components/ello/app-shell.tsx src/components/ello/logo.tsx src/lib/ello-navigation.ts src/lib/ello-navigation.test.ts
git commit -m "Build ELLO reference design foundation"
```

### Task 2: Produce and normalize the approved visual asset set

**Files:**
- Create: `public/images/ello/*.webp`
- Create: `src/lib/ello-media.ts`

- [ ] **Step 1: Generate section-specific image assets**

Use the image generation workflow with the approved screenshots as visual references. Produce separate, text-free, implementation-ready images for splash, each onboarding slide, Home carousel and service/gallery imagery. Require consistent Brazilian subjects, lighting, blue wardrobe accents where shown, clean cutouts for onboarding and natural photographic crops for services.

- [ ] **Step 2: Normalize assets**

Convert to WebP, strip unnecessary metadata and use these target shapes:

```ts
export const ELLO_MEDIA = {
  splash: { src: "/images/ello/splash.webp", width: 860, height: 900 },
  onboardingClient: { src: "/images/ello/onboarding-client.webp", width: 760, height: 820 },
  onboardingProfessional: {
    src: "/images/ello/onboarding-professional.webp",
    width: 760,
    height: 820,
  },
  onboardingAgenda: { src: "/images/ello/onboarding-agenda.webp", width: 760, height: 820 },
  onboardingAssistant: {
    src: "/images/ello/onboarding-assistant.webp",
    width: 760,
    height: 820,
  },
  homeCarousel: [
    "/images/ello/home-services-1.webp",
    "/images/ello/home-services-2.webp",
    "/images/ello/home-services-3.webp",
  ],
} as const;
```

- [ ] **Step 3: Verify every asset**

Open each asset and check:

- no text baked into UI imagery;
- no malformed hands or tools;
- consistent visual identity;
- correct crop at 390 px width;
- file size below 350 KB where practical;
- no missing file in `ELLO_MEDIA`.

- [ ] **Step 4: Commit**

```powershell
git add public/images/ello src/lib/ello-media.ts
git commit -m "Add ELLO reference media assets"
```

### Task 3: Rebuild splash and onboarding carousel

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/onboarding.tsx`
- Create: `src/lib/onboarding-state.ts`
- Test: `src/lib/onboarding-state.test.ts`

- [ ] **Step 1: Write persistence tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { ONBOARDING_STORAGE_KEY, parseOnboardingState } from "./onboarding-state.ts";

test("uses a versioned storage key", () => {
  assert.equal(ONBOARDING_STORAGE_KEY, "ello:onboarding:v1");
});

test("accepts only the completed state", () => {
  assert.equal(parseOnboardingState("completed"), true);
  assert.equal(parseOnboardingState(null), false);
  assert.equal(parseOnboardingState("anything"), false);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test src/lib/onboarding-state.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement storage helpers**

```ts
export const ONBOARDING_STORAGE_KEY = "ello:onboarding:v1";

export function parseOnboardingState(value: string | null) {
  return value === "completed";
}

export function completeOnboarding(storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(ONBOARDING_STORAGE_KEY, "completed");
}
```

- [ ] **Step 4: Implement the splash composition**

Rebuild `src/routes/index.tsx` with:

- full blue gradient;
- white reference-style ELLO mark;
- centered brand phrase;
- bottom professional group image;
- full-width “Começar” button;
- “Entrar” secondary action;
- no profession emoji grid.

- [ ] **Step 5: Implement the four-slide onboarding**

Use a single module-level slide array with exact approved copy, image path and highlighted word. The route must support button, swipe/scroll and indicator navigation, persist completion, and send “Pular”/final “Começar” to `/auth`.

- [ ] **Step 6: Verify the entry flow**

Run:

```powershell
node --test src/lib/onboarding-state.test.ts
npm.cmd run build
```

In Browser test:

`/` → “Começar” → advance all four slides → “Começar” → `/auth`.

Expected: no console errors, no clipping at 360×800 and 390×844.

- [ ] **Step 7: Commit**

```powershell
git add src/routes/index.tsx src/routes/onboarding.tsx src/lib/onboarding-state.ts src/lib/onboarding-state.test.ts
git commit -m "Rebuild ELLO splash and onboarding"
```

### Task 4: Rebuild authentication and mode selection

**Files:**
- Modify: `src/routes/auth.tsx`
- Modify: `src/routes/role.tsx`

- [ ] **Step 1: Preserve the real e-mail/password state machine**

Extract no auth logic. Keep `createConfirmedPasswordAccount`, `signInWithPassword`, errors and navigation intact.

- [ ] **Step 2: Match reference authentication layout**

Implement:

- mark and “Bem-vindo(a)!” heading;
- social/phone/email rows using `ProviderButton`;
- the e-mail form revealed by “Continuar com e-mail”;
- Google/Apple/phone rows disabled with `aria-disabled="true"` until integrated;
- sign-in/sign-up switch;
- legal copy at the bottom;
- no claim that inactive providers work.

- [ ] **Step 3: Match reference mode selection**

Implement one blue client card and one green professional card with icon, title and explanation. Preserve `chooseMyAccountMode`, loading state, errors and final route.

- [ ] **Step 4: Verify real auth logic has not regressed**

Run:

```powershell
npm.cmd run build
npx.cmd eslint src/routes/auth.tsx src/routes/role.tsx
```

Browser checks:

- switch to e-mail form;
- invalid input remains blocked by the existing flow;
- mode buttons show saving state;
- no inactive provider silently submits.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/auth.tsx src/routes/role.tsx
git commit -m "Match ELLO authentication reference"
```

### Task 5: Build mode-aware navigation and the reference Client Home

**Files:**
- Create: `src/components/ello/navigation.tsx`
- Create: `src/components/ello/screen-header.tsx`
- Create: `src/components/ello/actions.tsx`
- Create: `src/components/ello/fields.tsx`
- Create: `src/components/ello/media.tsx`
- Create: `src/components/ello/cards.tsx`
- Create: `src/components/ello/status.tsx`
- Modify: `src/routes/app.tsx`
- Modify: `src/routes/app.index.tsx`

- [ ] **Step 1: Implement shared primitives**

Create typed components with narrow APIs. Example:

```tsx
type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ className = "", fullWidth = true, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`h-12 rounded-xl bg-primary px-5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-50 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  );
}
```

`PhotoCarousel` must expose current slide, previous/next controls, dots, keyboard labels, auto-advance and reduced-motion behavior.

- [ ] **Step 2: Replace the old global BottomNav**

Read `profile?.account_mode` from `useAuth()` in `app.tsx`, default safely to client, and render `ClientBottomNav` or `ProfessionalBottomNav`. Hide navigation on routes that explicitly request a full-screen flow through route metadata or pathname rules.

- [ ] **Step 3: Rebuild Home in approved order**

Implement:

1. location/action header;
2. personalized greeting;
3. search;
4. five popular categories;
5. full-width photo carousel;
6. horizontal professional cards;
7. bottom navigation.

Use `listCategories`, `listProfessionals` and existing profile data. Do not fall back to fake professionals in production; show a designed empty state when Supabase returns none.

- [ ] **Step 4: Verify search and carousel interaction**

Browser flow:

`/app` → type “instalar chuveiro” → submit → URL contains `/app/search?q=...`; return → move carousel → active dot changes.

- [ ] **Step 5: Run checks**

Run:

```powershell
npm.cmd run build
npx.cmd eslint src/components/ello src/routes/app.tsx src/routes/app.index.tsx
```

Expected: build and targeted lint exit 0.

- [ ] **Step 6: Commit**

```powershell
git add src/components/ello src/routes/app.tsx src/routes/app.index.tsx
git commit -m "Build ELLO client home reference UI"
```

## Batch 2 — Client product

### Task 6: Rebuild search and professional discovery

**Files:**
- Modify: `src/routes/app.search.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Define deterministic search tabs**

Use:

```ts
type SearchTab = "all" | "professionals" | "services";
```

Keep the query term in route search state and filter UI without duplicating server requests.

- [ ] **Step 2: Remove silent mock fallback**

Change repository search behavior so:

- configured Supabase success returns real rows;
- configured Supabase error returns a surfaced recoverable error;
- unconfigured local development may use demo data only behind an explicit development flag;
- production never mixes mock and real records.

- [ ] **Step 3: Implement reference result rows**

Each professional row shows avatar, name, category, rating, review count when available, distance only when real, availability and chevron. Render related services below the primary CTA.

- [ ] **Step 4: Verify**

Run build and targeted lint. Browser-check all three tabs and one professional navigation.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/app.search.tsx src/lib/ello-repository.ts
git commit -m "Rebuild ELLO professional search"
```

### Task 7: Split the professional profile into reference tabs

**Files:**
- Modify: `src/routes/app.professional.$id.tsx`
- Create: `src/routes/app.professional.$id.services.tsx`
- Create: `src/routes/app.professional.$id.reviews.tsx`
- Create: `src/routes/app.professional.$id.gallery.tsx`

- [ ] **Step 1: Create a shared profile header**

Create `ProfessionalProfileHeader` inside a focused component file if the route exceeds 350 lines. It receives only `professional`, `activeTab` and action callbacks.

- [ ] **Step 2: Build overview**

Match reference 10: cover, portrait, verified state only when real, rating, badges, metrics, bio, service preview and sticky Chat/Solicitar serviço actions.

- [ ] **Step 3: Build Services**

Match reference 11 with image rows and real prices. Missing services use a designed empty state.

- [ ] **Step 4: Build Reviews**

Match reference 12 with average, histogram and real review rows.

- [ ] **Step 5: Build Gallery**

Match reference 13 with a two-column media grid sourced from portfolio data.

- [ ] **Step 6: Verify profile tabs**

Browser flow:

overview → services → reviews → gallery → back to overview.

Expected: same professional identity persists, no query duplication error, no placeholder cards.

- [ ] **Step 7: Commit**

```powershell
git add src/routes/app.professional.$id.tsx src/routes/app.professional.$id.services.tsx src/routes/app.professional.$id.reviews.tsx src/routes/app.professional.$id.gallery.tsx
git commit -m "Build ELLO professional profile tabs"
```

### Task 8: Build quote and booking screens on real workflows

**Files:**
- Create: `src/routes/app.professional.$id.schedule.tsx`
- Create: `src/routes/app.professional.$id.quote.tsx`
- Modify: `src/lib/ello-repository.ts`
- Preserve: `src/lib/appointments.ts`
- Preserve: `src/lib/appointments.test.ts`

- [ ] **Step 1: Reuse appointment transition helpers**

Do not duplicate status rules. Use existing `proposeAppointment`, `updateAppointmentStatus` and date validation.

- [ ] **Step 2: Implement booking form**

Match reference 14: service selector, month calendar, available time buttons, address, notes and submit. Require authenticated client and future date.

- [ ] **Step 3: Implement detailed quote form**

Match reference 15: desired service, description, optional images, address and urgency. Use `createDetailedQuoteRequest`.

- [ ] **Step 4: Verify failure and success states**

Test:

- unauthenticated submit is blocked;
- missing address is blocked;
- past appointment is blocked;
- valid submit invokes repository mutation once;
- success navigates to the correct conversation/request.

- [ ] **Step 5: Run checks**

Run:

```powershell
npm.cmd run test:appointments
npm.cmd run build
npx.cmd eslint src/routes/app.professional.$id.schedule.tsx src/routes/app.professional.$id.quote.tsx src/lib/appointments.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/routes/app.professional.$id.schedule.tsx src/routes/app.professional.$id.quote.tsx src/lib/ello-repository.ts
git commit -m "Build ELLO quote and booking flows"
```

### Task 9: Rebuild messaging, received budget and notifications

**Files:**
- Modify: `src/routes/app.messages.tsx`
- Create: `src/routes/app.quote.$id.tsx`
- Create: `src/routes/app.notifications.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Remove `DemoConversation` from production rendering**

Replace it with authenticated empty/loading/error states. Keep real quote threads and realtime messages.

- [ ] **Step 2: Match the chat reference**

Implement compact identity header, online state only when known, gray/blue bubbles, timestamps, composer and attachment affordance.

- [ ] **Step 3: Build received budget detail**

Load a request by authorized user, show professional, service, value, deadline and description, and wire reject/accept to existing quote transitions.

- [ ] **Step 4: Build notifications from real domain events**

Create a repository projection combining authorized recent quote messages, appointment updates and quote status changes. If a persisted notification table is necessary, add one migration with RLS before using it; otherwise use a read-only derived feed.

- [ ] **Step 5: Verify realtime and authorization**

Use two test accounts:

client sends message → professional receives; professional sends quote → client sees detail; unauthorized account cannot read either thread.

- [ ] **Step 6: Commit**

```powershell
git add src/routes/app.messages.tsx src/routes/app.quote.$id.tsx src/routes/app.notifications.tsx src/lib/ello-repository.ts supabase/migrations
git commit -m "Rebuild ELLO messaging and notifications"
```

### Task 10: Finish client favorites and profile/settings entry

**Files:**
- Modify: `src/routes/app.favorites.tsx`
- Modify: `src/routes/app.profile.tsx`

- [ ] **Step 1: Reuse compact professional rows**

Favorites must share the search result component instead of duplicating profile markup.

- [ ] **Step 2: Rebuild client profile**

Match the approved visual system with identity, editable profile, notification/settings entries, account mode switch and payment notice. Remove links to plans, PRO and paid highlight.

- [ ] **Step 3: Verify mutations**

Favorite/unfavorite and profile save must invalidate the existing TanStack Query keys and reflect immediately.

- [ ] **Step 4: Commit**

```powershell
git add src/routes/app.favorites.tsx src/routes/app.profile.tsx
git commit -m "Finish ELLO client account screens"
```

## Batch 3 — Professional product

### Task 11: Rebuild Professional Home and Agenda

**Files:**
- Modify: `src/routes/app.business.tsx`
- Modify: `src/routes/app.agenda.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Extract the oversized business screen**

Move forms and sections into focused files under `src/components/ello/business/`:

- `professional-summary.tsx`
- `profile-editor.tsx`
- `service-editor.tsx`
- `portfolio-editor.tsx`
- `quote-panel.tsx`

Keep route-level queries/mutations in `app.business.tsx`.

- [ ] **Step 2: Build reference Professional Home**

Show greeting, real daily summary, next appointments and quick actions. Zero is valid; invented revenue is not.

- [ ] **Step 3: Match Agenda reference**

Keep existing appointment transitions and render month calendar plus date-grouped schedule rows and status labels.

- [ ] **Step 4: Verify**

Run appointment tests, build and targeted lint. Browser-check status action and calendar selection.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/app.business.tsx src/routes/app.agenda.tsx src/components/ello/business src/lib/ello-repository.ts
git commit -m "Rebuild ELLO professional home and agenda"
```

### Task 12: Add professional budgets and authorized CRM

**Files:**
- Create: `src/routes/app.business.quotes.tsx`
- Create: `src/routes/app.business.clients.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Add repository view models**

```ts
export type ProfessionalClientSummary = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  completedServices: number;
  lastInteractionAt: string;
};
```

Build this list only from quote requests or completed appointments tied to the current professional profile.

- [ ] **Step 2: Build budget tabs**

Received and sent tabs show request title, client, relative time and status. Preserve current quote mutations.

- [ ] **Step 3: Build CRM list**

Add search and service count. Do not expose e-mail, phone or unrelated users without explicit authorized relationship.

- [ ] **Step 4: Verify RLS**

Query with a second professional and confirm they cannot see the first professional’s clients or budgets.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/app.business.quotes.tsx src/routes/app.business.clients.tsx src/lib/ello-repository.ts
git commit -m "Add ELLO professional budgets and CRM"
```

### Task 13: Rebuild ELLO Link and professional profile editing

**Files:**
- Modify: `src/routes/p.$slug.tsx`
- Modify: `src/components/ello/business/profile-editor.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Match the public ELLO Link**

Use cover, overlapping portrait, identity, real contact actions, tab shortcuts, bio and services. Preserve event tracking for views and contact clicks.

- [ ] **Step 2: Match Edit Profile reference**

Provide image upload, name, category, description, service area, phone and e-mail. Keep current Supabase storage and profile update functions.

- [ ] **Step 3: Verify public/private boundaries**

Public route must expose only intended public fields. Editing requires the owner.

- [ ] **Step 4: Commit**

```powershell
git add src/routes/p.$slug.tsx src/components/ello/business/profile-editor.tsx src/lib/ello-repository.ts
git commit -m "Rebuild ELLO Link and profile editor"
```

### Task 14: Add real statistics and received reviews

**Files:**
- Create: `src/routes/app.business.statistics.tsx`
- Create: `src/routes/app.business.reviews.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Use existing metrics as the data source**

Extend the current professional dashboard counts with an explicit date range and zero-filled daily series. Do not synthesize growth percentages.

- [ ] **Step 2: Build Statistics**

Match reference 27: date filter, primary views block, four metrics, line chart and traffic distribution. Hide a chart when no time-series data exists and show a polished empty state.

- [ ] **Step 3: Build Reviews received**

Match reference 28: average, distribution and review list. Use only approved/completed review data.

- [ ] **Step 4: Verify numeric integrity**

Compare each displayed total to a direct Supabase count query for the same professional and period.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/app.business.statistics.tsx src/routes/app.business.reviews.tsx src/lib/ello-repository.ts
git commit -m "Add ELLO professional statistics and reviews"
```

### Task 15: Build settings and reliable mode switching

**Files:**
- Create: `src/routes/app.settings.tsx`
- Modify: `src/routes/role.tsx`
- Modify: `src/lib/ello-repository.ts`

- [ ] **Step 1: Build settings groups**

Account, security, notifications, privacy, professional configuration, wallet, help, contact, mode switching and sign-out. Omit plans, subscription and highlight sales.

- [ ] **Step 2: Implement mode switch**

Reuse `chooseMyAccountMode`, refresh profile and navigate to the selected mode’s Home. Never create duplicate profiles.

- [ ] **Step 3: Verify**

Client → Professional → Client; confirm the same auth user and associated profiles remain intact.

- [ ] **Step 4: Commit**

```powershell
git add src/routes/app.settings.tsx src/routes/role.tsx src/lib/ello-repository.ts
git commit -m "Add ELLO settings and mode switching"
```

## Batch 4 — Wallet, cleanup and release

### Task 16: Implement gateway-disabled Carteira ELLO

**Files:**
- Create: `src/lib/wallet.ts`
- Test: `src/lib/wallet.test.ts`
- Create: `src/routes/app.wallet.tsx`
- Modify: `src/lib/payments/payment-policy.ts`

- [ ] **Step 1: Write wallet policy tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createDisabledWalletView } from "./wallet.ts";

test("disabled wallet never invents balance or transactions", () => {
  const wallet = createDisabledWalletView();
  assert.equal(wallet.gatewayStatus, "disconnected");
  assert.equal(wallet.availableCents, 0);
  assert.equal(wallet.pendingCents, 0);
  assert.deepEqual(wallet.transactions, []);
  assert.equal(wallet.canWithdraw, false);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test src/lib/wallet.test.ts`

Expected: FAIL with missing module.

- [ ] **Step 3: Implement the wallet model**

```ts
export type WalletView = {
  gatewayStatus: "disconnected" | "connected";
  availableCents: number;
  pendingCents: number;
  canWithdraw: boolean;
  transactions: Array<{
    id: string;
    label: string;
    amountCents: number;
    createdAt: string;
    status: "pending" | "completed" | "failed";
  }>;
};

export function createDisabledWalletView(): WalletView {
  return {
    gatewayStatus: "disconnected",
    availableCents: 0,
    pendingCents: 0,
    canWithdraw: false,
    transactions: [],
  };
}
```

- [ ] **Step 4: Build the Carteira screen**

Show:

- available R$ 0,00;
- pending R$ 0,00;
- “Gateway ainda não conectado”;
- disabled Pix/withdraw/bank controls;
- empty transaction history;
- no fake income graph;
- no subscription or upsell.

- [ ] **Step 5: Update payment policy**

Keep external payment mode and state clearly that Carteira actions activate only after gateway integration.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --test src/lib/wallet.test.ts
npm.cmd run build
npx.cmd eslint src/lib/wallet.ts src/routes/app.wallet.tsx src/lib/payments/payment-policy.ts
```

Then:

```powershell
git add src/lib/wallet.ts src/lib/wallet.test.ts src/routes/app.wallet.tsx src/lib/payments/payment-policy.ts
git commit -m "Add gateway-ready ELLO wallet"
```

### Task 17: Remove plans, PRO sales and production demo content

**Files:**
- Modify: `src/routes/app.business.tsx`
- Modify: `src/routes/app.admin.tsx`
- Modify: `src/routes/app.messages.tsx`
- Modify: `src/routes/app.professional.$id.tsx`
- Modify: `src/lib/ello-repository.ts`
- Modify or delete: `src/lib/ello-data.ts` production usages

- [ ] **Step 1: Add a prohibited-copy scan**

Run:

```powershell
rg -n -i "plano pro|assinatura pro|destaque 3|destaque 7|destaque 30|comprar destaque|DemoConversation|profissional demonstrativo|ver prototipo" src
```

Record every production-visible match.

- [ ] **Step 2: Remove monetization sale surfaces**

Delete navigation, cards, buttons and admin approval flows specifically for plan/PRO/highlight sales. Preserve unrelated local partner administration only if still desired by the product.

- [ ] **Step 3: Remove silent demo rendering**

No mock professionals or conversations may appear as live production records. Use explicit empty states.

- [ ] **Step 4: Repeat the prohibited-copy scan**

Expected: no production-visible matches; permitted comments/migration history must be documented rather than rewritten destructively.

- [ ] **Step 5: Build and commit**

```powershell
npm.cmd run build
git add src
git commit -m "Remove ELLO plans and demo content"
```

### Task 18: Full visual, accessibility and responsive QA

**Files:**
- Modify: any affected frontend files found during QA
- Do not commit temporary screenshots or scripts

- [ ] **Step 1: Build a reference checklist**

Create a temporary checklist mapping screens 1–30 to routes and noting that screens 25, 26 and 29 are represented by Carteira ELLO according to the approved exception.

- [ ] **Step 2: Run full static verification**

Run:

```powershell
npm.cmd run test:appointments
node --test src/lib/onboarding-state.test.ts src/lib/ello-navigation.test.ts src/lib/wallet.test.ts
npm.cmd run build
npm.cmd run lint
```

Expected: all tests PASS, build exits 0, lint exits 0. If full lint exceeds the environment timeout, run it with a longer timeout and then run targeted lint on every changed file; do not claim full lint passed unless it finishes.

- [ ] **Step 3: Browser-check mobile**

At 390×844 and 360×800 verify:

- splash/onboarding;
- auth/mode;
- client Home/search/profile tabs/quote/booking/chat;
- professional Home/agenda/budgets/CRM/link/statistics/reviews/wallet/settings;
- no horizontal overflow;
- fixed navigation does not cover content;
- carousel works with touch-equivalent controls;
- no framework overlay;
- no relevant console error.

- [ ] **Step 4: Browser-check desktop**

At 1280×800 verify centered mobile presentation, readable shadows/background and no stretched cards.

- [ ] **Step 5: Accessibility pass**

Check keyboard focus, button names, image alt text, contrast, form labels, disabled provider semantics, reduced motion and carousel controls.

- [ ] **Step 6: Compare against reference images**

For each major screen family, capture implementation screenshots and inspect them side by side with the supplied references. Fix all material drift in:

- copy and hierarchy;
- blue/green palette;
- typography;
- margins and component geometry;
- media crop;
- navigation and selected states;
- list/card density.

- [ ] **Step 7: Commit QA fixes**

```powershell
git add src public
git commit -m "Polish ELLO reference fidelity"
```

### Task 19: Supabase and two-account end-to-end regression

**Files:**
- Modify only if a verified regression requires a fix

- [ ] **Step 1: Client flow**

With a real client account:

sign in → select client → search professional → favorite → request quote → send message → propose/confirm appointment → view agenda → submit review after valid completion.

- [ ] **Step 2: Professional flow**

With a real professional account:

sign in → select professional → update profile → add service/portfolio → receive quote → respond → message → accept appointment transition → view CRM/statistics/review.

- [ ] **Step 3: Authorization checks**

Confirm unrelated accounts cannot read or mutate private quote threads, appointments, CRM entries or professional editing data.

- [ ] **Step 4: Wallet checks**

Confirm no gateway call occurs, balances remain zero and disabled controls cannot create a payment state.

- [ ] **Step 5: Commit any regression fixes**

Use one focused commit per defect and rerun the exact failing flow after each fix.

### Task 20: Publish and verify production

**Files:**
- No source changes unless deployment reveals a verified configuration defect

- [ ] **Step 1: Final local evidence**

Run:

```powershell
git status -sb
npm.cmd run test:appointments
node --test src/lib/onboarding-state.test.ts src/lib/ello-navigation.test.ts src/lib/wallet.test.ts
npm.cmd run build
```

Expected: clean worktree before publish; all checks pass.

- [ ] **Step 2: Push the implementation branch**

Push a `codex/ello-reference-redesign` branch, inspect the Vercel preview and do not promote until visual and functional QA passes.

- [ ] **Step 3: Promote validated artifact**

Merge/push to `main` or promote the validated preview according to the active Vercel integration.

- [ ] **Step 4: Production smoke test**

Verify:

- production commit equals the intended commit;
- `/`, `/onboarding`, `/auth`, `/role`, `/app`, `/app/search`, `/app/agenda`, `/app/business`, `/app/wallet` return rendered pages;
- no production console errors;
- Supabase project remains `xavnxigqiuvlomrscwxp`;
- no plan/PRO sales surface remains;
- Carteira shows disconnected state;
- both client and professional navigation work.

- [ ] **Step 5: Record deployment result**

Report production URL, commit, test totals, checked routes, remaining intentional limitations (e-mail confirmation, gateway and real IA) and any monitoring gaps.

## Self-review

### Spec coverage

- Screens 1–24: covered by Tasks 3–15.
- Screens 25–26: explicitly removed and replaced by Carteira in Task 16.
- Screens 27–28: covered by Task 14.
- Screen 29: converted to honest wallet presentation in Task 16.
- Screen 30: covered by Task 15.
- Carousel before Home content: Task 5.
- No gateway, plans or subscription: Tasks 16–17.
- Existing Supabase workflows and authorization: Tasks 8–15 and 19.
- Responsive/reference fidelity: Task 18.
- Production release: Task 20.

### Type consistency

- Account mode is consistently `"client" | "professional"`.
- Wallet status is consistently `"disconnected" | "connected"`.
- Route destinations match the approved navigation contract.
- Existing appointment and quote transition helpers remain the single source of business rules.

### Explicit limitations

- “Idêntico” is treated as maximal implementation fidelity to the supplied visual references; generated photographic assets will be newly produced rather than copied from an unavailable original asset library.
- Google, Apple, phone auth, gateway payments and IA remain visibly inactive until their integrations exist.

