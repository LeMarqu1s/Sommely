# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server with HTTPS (localhost:5173)
npm run dev:mobile   # Dev server for mobile testing
npm run tunnel       # Expose via LocalTunnel for mobile device testing
npm run build        # tsc + vite build → dist/
npm run preview      # Preview production build locally
npm run cap:sync     # Build + sync to Capacitor native projects
npm run cap:android  # Open Android Studio
npm run cap:ios      # Open Xcode
```

There are no lint or test scripts — TypeScript strict mode is used for type safety.

## Architecture

**Sommely** is a mobile-first PWA ("Yuka for Wine") built with React 18 + TypeScript + Vite, deployable to Vercel. Users scan wine bottle labels, get AI-powered scores based on their taste profile, and manage a personal wine collection. A Capacitor wrapper packages it as a native iOS/Android app.

### Data Flow

1. **Auth & State** — `src/context/AuthContext.tsx` is the central state hub: user session, profile (12-question onboarding), and subscription tier all live here.
2. **Scan Pipeline** — Camera → image enhancement (`src/lib/imageEnhance.ts` + `imageOptimize.ts`) → OpenAI GPT-4 Vision (`src/lib/openai.ts`) → match score algorithm (`src/lib/matchScore.ts`) → `/result` page.
3. **Database** — Supabase (`src/lib/supabase.ts`) for auth, user profiles, scan history, wine cave, and subscriptions with RLS.
4. **Payments** — Stripe 2 plans Pro (mensuel 8,99€ / annuel 47,99€) via `src/lib/stripe.ts` et `src/utils/stripe.ts` (liens Payment Links).
5. **Sharing** — `/share` route generates dynamic OG images via a Vercel serverless endpoint (`api/og.tsx`).

### Key Directories

- `src/pages/` — Route-level components (~20 pages). Bottom nav is hidden on pages listed in `NAV_HIDDEN` in `App.tsx`.
- `src/components/` — Reusable UI, including `analytics/` (Clarity + GA4), `payment/`, and `ui/`.
- `src/lib/` — All third-party integrations (Supabase, OpenAI, Stripe, Sentry, storage).
- `src/hooks/` — `useCamera`, `useMemberCount`.
- `src/types/` — Shared TypeScript interfaces: `Wine`, `UserProfile`, `ScanResult`, `Subscription`.
- `src/utils/` — Stripe helpers, subscription logic, currency formatting.
- `api/` — Vercel serverless functions (OG image generation).

### Routing

React Router v6. Main user flow: `/auth` → `/onboarding` → `/scan` → `/result` → `/cave` or `/share`. The `/premium` paywall is reachable from multiple points when the free scan limit (3/day) is hit.

### Subscription Model

```typescript
plan: 'free' | 'monthly' | 'annual'
status: 'trial' | 'active' | 'cancelled' | 'expired'
```

Free users get 3 scans/day. Trial is 7 days. Subscription state gates features throughout the app.

### Styling Conventions

- Tailwind CSS with a custom design system defined in `tailwind.config.js`.
- Primary palette: burgundy (`#722F37`), gold (`#D4AF37`), cream (`#FAF9F6`).
- Fonts: DM Serif Display (headings), DM Sans (body).
- 8px spacing grid; border radii 16/24/32px.
- All UI copy is in **French**.

### Vite Proxy

`vite.config.ts` proxies `/api/openai` → OpenAI API to avoid CORS issues in dev.

## iOS Safari Checklist (apply before every UI change)

- `fixed`/`sticky` elements must not block touch events on underlying content.
- Z-index hierarchy: BottomNav = `z-50`, modals = `z-[60]` or higher.
- Apply `safe-area-inset-bottom` padding wherever the BottomNav is visible.
- Never use `backdrop-filter` on full-width wrapper elements — it breaks touch events on iOS WebKit.
- All modal inner content must call `e.stopPropagation()`.

## Before Modifying Any File

1. Read the complete file first — no blind edits.
2. Check for cross-file side effects: imports, shared state, `useEffect` dependencies.
3. Before deleting code, use Grep to confirm it is unused elsewhere in the project.
4. After editing, re-read the modified sections to catch logic or syntax issues.
5. Verify imports: nothing unused, nothing missing.
