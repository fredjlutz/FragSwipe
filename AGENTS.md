# AGENTS.md — FragSwipe Project

> This file is the single source of truth for any AI coding agent working on this repository.
> Read this entire file before taking any action. Do not write a single line of code without
> first stating your plan and receiving explicit approval.

---

## Project Overview

**FragSwipe** is a mobile-optimised web marketplace for buying and selling corals and marine life
in South Africa. It uses a Tinder-style swipe interface. Buyers swipe through listings sorted by
proximity, favourite items, and contact sellers via WhatsApp deep links. Sellers manage their own
listings with full lifecycle state management. Stores get branded pages and bulk upload capability.
Admins moderate content and manage users via a dashboard.

---

## Tech Stack

| Layer | Technology | Version/Notes |
|---|---|---|
| Frontend | Next.js (App Router) | v14, TypeScript strict |
| Styling | Tailwind CSS | Mobile-first, min tap target 44x44px |
| Backend / DB | Supabase | PostgreSQL + PostGIS + Auth + Storage + Edge Functions |
| Deployment | Vercel | CI/CD via GitHub; 3 envs: dev / preview / production |
| Image storage | Supabase Storage | Private buckets, signed URLs (1hr expiry) |
| Address validation | Google Maps Address Validation API | Server-side only |
| Payments | PayFast | Recurring subscriptions, South African ZAR |
| Animations | Framer Motion | Swipe card gestures |
| Validation | Zod | All forms and API routes |
| Testing | Vitest (unit) + Playwright (E2E) | Required for all business logic |
| Charts (admin) | Recharts | Admin dashboard only |

---

## Essential Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate Supabase types (run after any schema change)
npx supabase gen types typescript --local > lib/database.types.ts

# Apply DB migrations
npx supabase db push

# Build for production
npm run build
```

> **Agent rule:** After any schema change, regenerate types and update all affected files.
> After any code change, run `npm run type-check` and `npm run lint`. Fix all errors before
> considering a task complete.

---

## Directory Structure

```
fragswipe/
├── AGENTS.md                        ← You are here
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (dashboard)/
│   │   ├── discover/page.tsx        ← Swipe feed
│   │   ├── favourites/page.tsx
│   │   ├── my-listings/page.tsx
│   │   └── sell/new/page.tsx
│   ├── (public)/
│   │   ├── page.tsx                 ← Landing page
│   │   ├── how-to-photograph-corals/page.tsx
│   │   └── stores/
│   │       ├── page.tsx             ← Stores directory
│   │       └── [handle]/page.tsx    ← Individual store page
│   └── (admin)/
│       └── admin/
│           ├── page.tsx             ← Dashboard
│           ├── moderation/page.tsx
│           ├── members/page.tsx
│           └── listings/page.tsx
├── components/
│   ├── admin/
│   ├── forms/
│   ├── listings/
│   ├── marketing/
│   ├── store/
│   └── swipe/
├── hooks/
│   ├── useSwipeQueue.ts
│   └── useGeolocation.ts
├── lib/
│   ├── env.ts                       ← Zod-validated env vars (NEVER import process.env directly)
│   ├── geocoding.ts                 ← Google Maps wrapper (server-only)
│   ├── payfast.ts                   ← PayFast signature + ITN verification
│   ├── rateLimit.ts
│   ├── database.types.ts            ← Auto-generated from Supabase schema
│   └── validation/
│       ├── profileSchema.ts
│       ├── listingSchema.ts
│       └── payfastItnSchema.ts
├── supabase/
│   ├── migrations/                  ← SQL migration files
│   └── functions/
│       └── moderate-listing/        ← Edge Function for shadow-ban check
├── tests/
│   ├── unit/
│   └── e2e/
├── middleware.ts                    ← Auth + admin guard + rate limiting
├── next.config.js                   ← CSP headers, image domains
└── vercel.json
```

---

## Database Schema (Supabase / PostgreSQL + PostGIS)

### Tables

**profiles**
- `id` uuid PK (FK → auth.users)
- `full_name` text NOT NULL
- `whatsapp_number` text NOT NULL (E.164 format, e.g. +27821234567)
- `raw_address` text NOT NULL — **NEVER exposed to any non-admin client or API**
- `neighbourhood` text NOT NULL — derived from Google geocoding response
- `location` geography(POINT) NOT NULL — lat/lng PostGIS point
- `role` enum('member','store','admin') DEFAULT 'member'
- `subscription_tier` enum('free','pro','store') DEFAULT 'free'
- `is_banned` boolean DEFAULT false
- `created_at`, `updated_at`

**listings**
- `id` uuid PK
- `seller_id` uuid FK → profiles
- `title`, `description`, `price` (ZAR numeric)
- `category` enum: 'coral_sps' | 'coral_lps' | 'coral_soft' | 'zoanthid' | 'anemone' | 'fish' | 'invert' | 'macro_algae' | 'hardscape' | 'hardware'
- `tags` text[]
- `status` enum: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned'
- `moderation_flag` boolean DEFAULT false
- `location` geography(POINT) — **copied from seller profile at listing creation time**
- `neighbourhood` text — **copied from seller profile at listing creation time**
- `created_at`, `updated_at`

**listing_images** — `id`, `listing_id`, `storage_path`, `display_order`, `created_at`

**favourites** — `id`, `buyer_id`, `listing_id`, `created_at`

**swipe_history** — `id`, `user_id`, `listing_id`, `direction` enum('left','right'), `created_at`

**subscriptions** — `id`, `profile_id`, `tier`, `payfast_token`, `status`, `starts_at`, `ends_at`

**moderation_log** — `id`, `listing_id`, `flagged_reason`, `reviewed_by`, `reviewed_at`, `action_taken`

**moderation_blocklist** — `id`, `term` text, `category` enum('profanity','racial','other')

### Key RPC Function
`nearby_listings(lat, lng, radius_km=10, category=null)` — returns active listings
sorted by ST_Distance, excluding already-swiped listings for the calling user.

### RLS Rules (enforce strictly)
- `profiles.raw_address` → NEVER readable by anon or authenticated non-admin
- `profiles.neighbourhood` + `profiles.location` → public readable
- `listings` → anyone can read active; only seller can insert/update own; admin can update any
- `favourites` → owner only
- `moderation_log` → admin only

---

## Subscription Tiers

| Tier  | Monthly Price | Max Active Listings | Store Page | Custom Branding |
|-------|--------------|---------------------|------------|-----------------|
| Free  | R0           | 10                  | No         | No              |
| Pro   | R50          | 50                  | No         | No              |
| Store | R100         | 100                 | Yes        | Yes             |

- Tier limits **must be enforced server-side** in API routes (not only in the UI)
- Return HTTP 403 with `{ error: "Upgrade your plan to add more listings" }` if exceeded
- On downgrade: excess listings → status = 'paused' (never deleted automatically)

---

## Listing Status Lifecycle

```
active → sold        (seller confirms sale)
active → paused      (seller pauses ad)
active → shadow_banned  (auto moderation trigger)
active → removed     (seller deletes OR admin removes)
paused → active      (seller reactivates)
shadow_banned → active   (admin approves)
shadow_banned → removed  (admin removes)
```

Each status must show a corresponding banner on the listing card:
- ACTIVE → green
- SOLD → grey
- PAUSED → yellow
- UNDER REVIEW → orange (label shown to seller when shadow_banned; never show "shadow_banned" wording)
- REMOVED → red

---

## Privacy Rules (Non-Negotiable)

- **Raw address**: stored in `profiles.raw_address` only. Never returned in any API response
  to non-admin users. Never logged. Never passed to client components.
- **Neighbourhood**: safe to display publicly (e.g. "Sea Point")
- **Distance**: display as "X.X km away" only. Calculated server-side from PostGIS.
- **Exact coordinates**: never exposed to the client. Only used in server-side PostGIS queries.

---

## Moderation & Shadow Banning

Triggered on listing create and edit via a Supabase Edge Function (`moderate-listing`).

Shadow-ban if listing `title` or `description` contains:
1. Any URL pattern (regex: `https?://|www\.`)
2. Any term from `moderation_blocklist` table (profanity or racial categories)

On trigger:
- Set `listings.status = 'shadow_banned'`
- Set `listings.moderation_flag = true`
- Insert row into `moderation_log` with `flagged_reason`
- Return listing ID to caller — do NOT inform the user why their post was flagged

Otherwise: set `status = 'active'`

---

## WhatsApp Deep Link Format

```
https://wa.me/{e164number}?text=Hi%2C+I%27m+interested+in+your+listing+%22{encodedTitle}%22+on+FragSwipe
```
- Encode `title` with `encodeURIComponent()`
- Open in new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Use seller's `whatsapp_number` from their profile (never shown raw — only used in this link)

---

## Coding Standards

### TypeScript
- Strict mode. No `any`. No `@ts-ignore` without a comment explaining why.
- All functions must have explicit return types.
- All components must have typed props interfaces.
- Database access only via the typed Supabase client using `lib/database.types.ts`.

### Environment Variables
- NEVER import `process.env` directly anywhere except `lib/env.ts`.
- All env vars must be declared and validated with Zod in `lib/env.ts`.
- Use `env.VARIABLE_NAME` throughout the codebase.

### Next.js Patterns
- Use **Server Components by default**.
- Only add `"use client"` when strictly necessary: event handlers, hooks, browser APIs.
- All data fetching in Server Components uses the Supabase server client.
- All mutations go through Next.js API routes (`app/api/`).

### API Routes
- Every route must verify the Supabase session before executing logic.
- Validate all request bodies with Zod schemas.
- Return `{ data, error }` shape consistently.
- Never throw uncaught exceptions — catch and return `{ error: message }`.

### Forms
- All form validation via Zod schemas in `lib/validation/`.
- Show inline field-level errors (not toast-only).
- Use `react-hook-form` with zod resolver.

### Naming Conventions
| Scope | Convention |
|---|---|
| Variables / functions | camelCase |
| Components / types / interfaces | PascalCase |
| Database columns | snake_case |
| File names | kebab-case |
| Constants | SCREAMING_SNAKE_CASE |

### Comments & Docs
- JSDoc on every exported function.
- Inline comments for non-obvious logic only.
- Security-sensitive code (PayFast ITN, RLS policies) must have a comment explaining the threat it mitigates.

---

## Security Requirements

- [ ] PayFast ITN route validates IP whitelist (41.74.179.194 range) AND MD5 signature
- [ ] Supabase Storage buckets are private; all images served via signed URLs (1hr expiry)
- [ ] Rate limit `/api/listings/create` at 10 req/min per user via Vercel Edge middleware
- [ ] Content Security Policy headers set in `next.config.js`
- [ ] Strip HTML from all user-supplied text fields server-side before storing
- [ ] `raw_address` RLS: SELECT denied for anon and authenticated non-admin
- [ ] Admin routes guarded in `middleware.ts` by session + `role = 'admin'` check
- [ ] Banned users (`is_banned = true`) blocked from accessing the app via middleware session check

---

## Testing Requirements

- Unit tests (Vitest) required for:
  - `lib/geocoding.ts` (mock Google API responses)
  - `lib/payfast.ts` (signature generation and ITN verification)
  - Shadow-ban regex and blocklist logic
  - Tier limit enforcement logic
- E2E tests (Playwright) required for:
  - Signup → onboarding → create listing happy path
- Run all tests before marking any task as done: `npm run test && npm run test:e2e`

---

## Git & PR Conventions

- Branch naming: `feature/`, `fix/`, `chore/` prefixes
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`)
- Never commit `.env` files or secrets
- Every PR must pass: ESLint + TypeScript check + unit tests

---

## Agent Behavioural Rules

1. **Plan before code.** For every task, write out your implementation plan (files to create/modify,
   data flow, component tree) and wait for explicit approval before writing code.
2. **One phase at a time.** Do not build ahead. Complete only the task described in the current prompt.
3. **Run checks after every change.** Always run `npm run type-check` and `npm run lint` after changes.
   Fix all errors before declaring done.
4. **Regenerate types after schema changes.** Any migration must be followed by
   `npx supabase gen types typescript`.
5. **Never expose raw_address.** This is a hard rule with no exceptions.
6. **Never show "shadow_banned" to end users.** Always display "Under Review" instead.
7. **Enforce tier limits server-side.** Do not rely on UI-only guards.
8. **Ask, don't assume.** If a requirement is ambiguous, ask before implementing.
9. **Security comments are mandatory** on PayFast ITN, RLS policies, and middleware guards.
10. **Do not install new dependencies** without listing them and explaining why they are needed.
    Wait for approval before running `npm install`.
