# Phase 4 public app audit

Date: 2026-09-22. Result: **PASS for the local/development implementation**, under the recorded fresh-project and deferred-content amendments. This is not production launch approval or a claim that real tours are published. Safe to create `checkpoint-phase-4-public` for this implementation. Next development scope: Phase 5A, Stripe test-mode setup only.

## Requirement evidence

| Requirement | Status | Concrete evidence |
| --- | --- | --- |
| Published server-rendered homepage and tour | PASS | `src/modules/content/homepage-server.ts:getHomepage`, `homepage.ts:loadHomepage`, public `page.tsx` and `tour/page.tsx`; `tests/integrations/public-homepage.test.mjs` and database public-projection tests; hosted/browser evidence in PHASE_4A_REPORT and PHASE_4B_REPORT |
| One source for price, capacity, stops and departures | PASS | Public availability boundary calls the shared booking availability domain; `read_public_homepage_v1` migration limits publication projection; no frontend price or capacity allocation found in reviewed public components |
| Date/guest/departure selection persists across steps | PASS | `booking.tsx:BookingProvider`, `use-availability.ts`; Phase 4C populated/stale-inventory browser checks and Phase 4F optimized-build navigation preserving date and two guests |
| Expiring holds and validated pending orders | PASS | Checkout POST delegates to `createHold` and `createPendingOrder`; `checkout-flow.tsx` handles countdown, retries and recovery; Phase 4D hosted/browser evidence; current native PostgreSQL contention, replay, expiry and rollback tests pass |
| Operator/session isolation and safe browser boundary | PASS | Fixed deployment operator/product binding; signed HttpOnly session; Origin guard, bounded JSON and exact action fields; server-only hold/order modules; recovery queries filter operator and session before returning non-contact order projection; current RLS/session/domain tests pass |
| Explore guides and SEO | PASS | `explore/[slug]/page.tsx`, `seo.ts`, `robots.ts`, `sitemap.ts`; published-only allowlist, escaped JSON-LD and request-time withdrawal; current SEO tests and Phase 4E/4F hosted evidence |
| Legacy migration | NOT APPLICABLE | DECISIONS.md fresh-project amendment; no import or existing-service change |
| Real catalog, guide copy, prices and authentic reviews | PARTIAL, explicitly deferred | User will enter operational details later. Empty states do not invent prices, departures or reviews. This content gate does not block the development checkpoint; populated synthetic behavior was verified in prior subphases |
| Editorial layout and Book/Live Tracking hierarchy | PASS within current content | Public homepage section order and shared components; Phase 3.5 visual evidence plus Phase 4A/B/F browser reviews. Price/frequency appear when supplied; current empty state communicates publication pending |
| Responsive layout, focus, reduced motion and image behavior | PASS for tested Chrome scope | PHASE_4F_REPORT matrix: 320/390/768/1440px coverage, dialog/menu keyboard checks, skip navigation, image attributes and screenshots. `public.css` reserves mobile footer space, uses safe-area padding and 44px primary controls |
| Core Web Vitals-oriented implementation | PASS for implementation; field measurement pending | `ui.tsx:Media` preloads hero and lazily loads other images with reserved space; dynamic checkout chunk verified absent on homepage and present at checkout in Phase 4F. No map SDK is loaded. No field score or Lighthouse result is claimed |
| Accurate phase boundaries | PASS | Pending orders are not confirmed tickets; payment and tracking remain explicitly unavailable. No Stripe integration, new GPS source or production deployment added in Phase 4 |

## Checks run in this audit

- `npm test`: **116 passed**, zero failures (15 identity, 20 integration, 67 database, 14 native PostgreSQL).
- `npm run lint` and `npm run typecheck`: passed.
- Complete optimized build: passed using ignored `private/build-phase-4-audit`. Temporary next.config.ts, tsconfig.json and next-env.d.ts changes restored. The previously documented OneDrive/default `.next` cleanup issue is not resolved by this audit.
- Browser static build assets checked for exact configured Supabase private key and checkout signing secret: zero matches. This focused check is not a general credential-history audit; no secret values were printed.
- Current localhost HTTP checks: home, tour, booking, Explore, live, robots and sitemap returned 200. Robots disallows all crawling and sitemap contains zero locations in local mode.
- Static palette contrast calculations: ink/paper 13.74:1, muted/paper 5.51:1, white/red 10.22:1 and focus/paper 5.26:1. This does not establish contrast over every photograph or disabled-control state.
- Source review: public React contains no direct privileged database calls. Privileged modules are server-only; the public snapshot RPC is service-role-only. Customer contact fields remain in memory, while sessionStorage holds the retry attempt and selection. The only reviewed public raw HTML insertion is escaped JSON-LD. No new schema changes or duplicate booking engine were found.

Browser and hosted mutation evidence above is attributed to the named subphase reports; those flows were not all repeated during this audit. Fresh automated regression tests cover the current source revision. No hosted fixtures, customers, orders or owner data were mutated during this audit.

## Remaining launch gates and technical debt

Owner activation and real content entry remain manual. Price editing limitations and age-band scope remain as recorded in Phase 4A. Contact/legal information must be supplied before launch. Payments belong to Phase 5 and tracking to Phase 6. Production abuse controls, load testing, pending-order cleanup operations, physical-device/Safari and screen-reader review, and measured deployment performance remain pending. The homepage projection also performs a quote lookup when reused by guides with a published product; profile before optimizing it.

These limitations must not be interpreted as approval to enable indexing, take payments, publish externally or change the old website. No new roadmap deviation was introduced. The original source roadmap remains unchanged.

Only this report and phase status changed in the audit. Existing user edits to AGENTS.md and README.md are excluded from the audit commit.
