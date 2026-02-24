# TESTS.md — FragSwipe Test Tasks

> Work through these tasks in order. Do not skip ahead.
> After each task: run the tests, fix all failures, then move to the next.
> All testing rules in AGENTS.md apply.

---

## Pre-Testing

- [ ] Run `npm run type-check` — fix all errors
- [ ] Run `npm run lint` — fix all errors
- [ ] Create `tests/seed-test-data.ts` — creates 3 users (admin, seller, buyer), 20 listings across all categories, 5 shadow-banned listings, all in Cape Town area coordinates. Must be idempotent.
- [ ] Create `tests/teardown.ts` — deletes only rows with @test.fragswipe.local emails. Must refuse to run unless NODE_ENV=test.
- [ ] Run the seeder and confirm data exists in the dev database.

---

## Unit Tests

- [ ] `tests/unit/payfast.test.ts` — signature generation, ITN verification, IP whitelist, tampered data, missing fields
- [ ] `tests/unit/moderation.test.ts` — URL regex detection, profanity blocklist, racial term blocklist, clean content passes
- [ ] `tests/unit/tier-limits.test.ts` — all three tiers at limit, attempts to exceed each, paused listings don't count
- [ ] `tests/unit/geocoding.test.ts` — valid address, invalid address, API error, raw_address never returned
- [ ] `tests/unit/validation.test.ts` — all zod schemas in lib/validation/, invalid inputs, malicious input attempts
- [ ] `tests/unit/StatusBanner.test.tsx` — all status values show correct label and colour, shadow_banned shows "UNDER REVIEW"
- [ ] `tests/unit/ListingSwipeCard.test.tsx` — swipe callbacks, favourite button, WhatsApp link format, raw address never rendered

---

## Integration Tests

- [ ] `tests/integration/listings-api.test.ts` — create (auth, no-auth, invalid, tier limit, shadow-ban trigger), patch own, patch other user returns 403, delete
- [ ] `tests/integration/payfast-itn.test.ts` — valid ITN updates subscription, bad signature rejected, wrong IP rejected, missing fields return 400
- [ ] `tests/integration/nearby-listings.test.ts` — within radius, sorted by distance, category filter, excludes shadow_banned, excludes already-swiped

---

## E2E Tests

- [ ] `tests/e2e/create-listing.spec.ts` — signup → onboarding → create coral_sps listing → verify ACTIVE banner in my-listings
- [ ] `tests/e2e/swipe-favourite.spec.ts` — login → swipe right → verify in /favourites → verify gone from /discover
- [ ] `tests/e2e/whatsapp-link.spec.ts` — click WhatsApp button → verify wa.me URL format and encoded title in new tab
- [ ] `tests/e2e/admin-moderation.spec.ts` — create listing with URL → login as admin → approve in /admin/moderation → verify active
- [ ] `tests/e2e/tier-limits.spec.ts` — free user creates 10 listings → 11th attempt returns 403 with upgrade message

---

## Coverage

- [ ] Run `npm run test -- --coverage`
- [ ] Any file in `lib/`, `app/api/`, or `components/` below 70% — write additional tests to bring it above threshold
- [ ] Run coverage again and confirm all files meet threshold

---

## CI/CD

- [ ] Update `.github/workflows/ci.yml` — type-check → lint → unit tests → E2E tests → fail build on any error
- [ ] Set up Husky pre-commit hook — runs type-check, lint, and unit tests before every commit

---

## Final Check

- [ ] Run `npm run type-check && npm run lint && npm run test && npm run test:e2e`
- [ ] All tests passing, zero failures, coverage above 70%
- [ ] Show final summary: total tests, pass rate, coverage percentage
