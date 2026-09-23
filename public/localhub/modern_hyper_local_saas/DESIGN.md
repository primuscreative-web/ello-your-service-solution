---
name: Modern Hyper-Local SaaS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#3130c0'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b4dd8'
  on-tertiary-container: '#d9d8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies high-precision utility, effortless executive clarity, and subtle digital prestige. Tailored for Brazilian and global local business owners (clinics, boutiques, studios, artisanal services) demanding an immediate, world-class mobile-first web presence ("Seu negócio inteiro em um único link"), the aesthetic synthesizes three design languages:
- **Linear:** Crisp 1px structural framing, hyper-focused typography, data density without clutter, and fluid micro-states.
- **Stripe:** Luminous color accents, vibrant gradient washes on actionable surfaces, and confident, generous vertical rhythm.
- **Apple:** Soft physical realism, tactile depth, natural corner curves, and pristine contrast.

The emotional signature is trustworthy, high-performing, and instantly empowering—translating complex omnichannel marketing, booking, and catalogs into an intuitive, touch-perfect mobile hub.

## Colors

The palette leverages a curated balance of cool slate/zinc neutrals, energized by hyper-saturated functional accents:

- **Primary (`#4F46E5` / `#6366F1`):** Electric Indigo & Vibrant Violet. Anchors navigational chrome, primary identity markers, active states, and focal calls to action.
- **Secondary (`#10B981`):** Emerald Conversion. Reserved strictly for growth-driving levers—WhatsApp direct booking buttons, checkout conversions, live availability badges, and positive revenue deltas.
- **Tertiary (`#6366F1`):** Indigo Glow. Used for hover fills, interactive focus halos, and ambient subtle backdrop gradients.
- **Neutrals & Surfaces:** Built on Slate tones (`#0F172A` text-primary, `#475569` text-muted, `#F8FAFC` base-canvas, `#FFFFFF` surface-cards).
- **Dividers & Strokes:** Razor-sharp borders executed in `#E2E8F0` (slate-200) for interactive elements and `#F1F5F9` (slate-100) for structural card dividers.

## Typography

The type system blends the energetic geometric cadence of **Plus Jakarta Sans** for headlines and brand impact with the analytical neutrality of **Inter** for data tables, form fields, and long-form microcopy.

- **Headlines & Titles:** Set with negative letter-spacing to reproduce the dense, editorial authority of modern SaaS dashboards.
- **Numbers & Metrics:** Must consistently declare tabular numbers (`font-variant-numeric: tabular-nums`) to maintain perfect vertical rhythm across live financial summaries and order counters.
- **Labels & Micro-Badges:** Uppercase or semi-bold micro-labels feature slight positive letter-spacing (`+0.02em` to `+0.04em`) to ensure instant legibility on compact handheld screens.

## Layout & Spacing

The layout is anchored in an 8pt spatial grid with an adaptive, fluid column architecture:

- **Mobile Viewports (<640px):** Single-column layout with fixed `1rem` edge margins and `1rem` component gutters. Maximum utility is delivered through bottom-sheet patterns and sticky action bars within thumb reach.
- **Tablet (640px - 1024px):** 6-column fluid grid, `1.5rem` margins and gutters. Side-by-side metric tiles and preview splits emerge.
- **Desktop (>1024px):** 12-column layout maxing out at `1280px` canvas width, framed by generous `3rem` section margins. Utilizes a persistent left-hand command rail (`260px` fixed) coupled with dynamic preview canvases.

Vertical rhythm follows predictable multiples: `0.5rem` for tight micro-elements, `1rem` between stacked form elements, and `2.5rem` between distinct dashboard card sections.

## Elevation & Depth

Visual hierarchy rejects harsh drop shadows, relying instead on ambient, layered multi-stop shadows combined with hairline borders:

- **Level 0 (Base Canvas):** Flat `#F8FAFC` background.
- **Level 1 (Cards & Surfaces):** `#FFFFFF` surface with a 1px border (`#E2E8F0`) and an ambient glow: `0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 2px 4px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hover States & Dropdowns):** `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`, border color subtly lifts to `#CBD5E1`.
- **Level 3 (Modals & Command Menus):** `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)` with a translucent backdrop blur (`backdrop-blur-md` with `rgba(15, 23, 42, 0.2)` overlay).
- **Level 4 (Direct WhatsApp & Conversion Action Floating Bar):** Tinted soft cast shadow: `0 10px 20px -3px rgba(16, 185, 129, 0.25)`.

## Shapes

The geometric signature balances friendly consumer elegance with SaaS precision:

- **Cards & Major Modules:** Standardized to `1rem` (`rounded-2xl` equivalent in mobile viewport card modules) to provide soft framing for storefront previews.
- **Buttons & Input Controls:** Styled with `0.5rem` (`rounded-lg`) to preserve sharp, focused touch targets.
- **Status Pills, Badges & Micro-tags:** Always fully rounded (`pill-shaped` / `rounded-full`) to contrast distinctly against rectangular content cards.

## Components

### Buttons
- **Primary Action (Brand):** Indigo-to-violet subtle gradient fill (`bg-gradient-to-r from-indigo-600 to-indigo-500`), pure white text, 1px top highlight border (`rgba(255, 255, 255, 0.2)` inset).
- **Conversion Action (WhatsApp / Direct Booking):** Emerald green (`#10B981`), bold white text, dynamic scale feedback on tap (`active:scale-[0.98]`).
- **Secondary / Ghost:** Pure white background, 1px border (`#E2E8F0`), dark slate text (`#0F172A`), hover background `#F8FAFC`.

### Chips & Badge Pills
- **Live Status:** Emerald tint (`#ECFDF5`), emerald text (`#059669`), paired with a pulsating green status dot (`#10B981`).
- **Category & Meta:** Neutral slate fill (`#F1F5F9`), slate text (`#475569`), `rounded-full`, padding `0.25rem 0.625rem`.

### Form Inputs & Selectors
- Background `#FFFFFF`, 1px crisp border in `#E2E8F0`. Focus state replaces border with `#4F46E5` accompanied by an electric indigo ambient ring (`box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15)`).

### Cards & Content Modules
- Pure white container, 1px `#F1F5F9` stroke, `1rem` corner radius, internal padding of `1rem` on mobile and `1.5rem` on desktop. Includes high-contrast header separation with action icon slots.

### Checkboxes & Radios
- Square with soft corners (`0.25rem`) for checkboxes, circular for radios. Inactive border `#CBD5E1`. Checked state fills `#4F46E5` with an animated white check vector.

### Mobile-Specific Preview Bar
- A persistent bottom-docked status indicator showing the public link status (`suaempresa.link`), featuring an instant "Copy Link" pill and a 1-tap live view overlay.