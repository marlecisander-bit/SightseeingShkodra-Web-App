# Performance audit and local optimization — 23 October 2026

**Status: implemented and validated locally; not pushed, merged or deployed.** Source baseline is published main `cd17d901b315f4785e9497ceee9b2a1a4004bff4`. Implementation: `/private/tmp/shkodra-performance-20261023`. Original IDE worktree remains untouched apart from this task's documentation/review artifacts.

The initial report is [PERFORMANCE-BASELINE-2026-10-23.md](PERFORMANCE-BASELINE-2026-10-23.md). Machine-readable, redacted measurements are [performance/summary-2026-10-23.json](performance/summary-2026-10-23.json).

## Findings ranked by impact and changes implemented

1. **Admin navigation reloaded the document.** Ordinary sidebar anchors and mobile `location.assign` discarded the shell and recreated its notification provider. Internal tasks now use Next Link/router navigation. Prefetch remains explicitly disabled, avoiding speculative requests to legacy mutation-capable GETs. External destinations retain their native/new-tab behavior. A pending-link outline and panel-only skeleton provide feedback without blanking the sidebar/header. Motion is limited to a 120ms opacity transition and disabled under reduced-motion preferences.
2. **Every admin section referenced all editors.** The single `[section]` page statically imported calendar, CMS, booking, partner, review and email panels. Separate route entrypoints now import only their own panel under a shared `(workspace)` layout. Public URLs are unchanged. Preview routes remain outside the workspace shell. The sidebar/header and one notification provider persist on normal section changes.
3. **Repeated verified identity reads.** Page/panel/service guards separately fetched the same verified user and staff membership. React request-local cache now shares session-client/user/membership reads within one server render. Every page, handler, action and privileged operation still applies its own permission policy. Membership is keyed by user and operator; no process-wide/private cache or availability cache was introduced. Invalid scopes fail before identity access. Separate requests and calls outside a render see changed/revoked identities.
4. **Sequential CMS reads.** WebsitePanel's independent website, destination, map-reference, authorization and review-setting reads now start together. Each protected reader retains its own authorization guard. Failures show the existing generic unavailable state; partial/unauthorized content is not rendered. Public publication/review caches already correctly deduplicate per request and were preserved. A speculative map-stop cache was considered but omitted because repeated reads were not demonstrated on the inspected routes.
5. **Explore lazy-loaded its LCP image.** Lighthouse identified the first centre image as LCP, lazy, without high priority, with roughly 665ms resource-discovery delay in the published baseline trace. Only the first Explore image now uses eager/high-priority loading. Later images remain lazy. Image quality, responsive sizes, crop, dimensions, content and hero photography/typography/widget layout are unchanged.
6. **Closed homepage map controls were in the initial client graph.** The existing disclosure now dynamically imports its iframe/recovery controls when opened. It still mounts no external iframe until requested. Tracking handshake, refresh, stale-state thresholds and the independent Netlify application are unchanged.
7. **Notification history duplicated the provider inbox read.** The default All view now consumes the existing provider projection. Filtered/paginated reads remain supported, and incoming provider updates still reset that projection. Tests show no additional `filter=all` request; settings retain their independent authorized request.

## Correctness protections accompanying client navigation

CMS unsaved/pending changes still block context switches, and now block cross-page client clicks and cross-page Back navigation as well. The guard restores the current history entry without replacing editor state. Modified/new-tab/download links retain native behavior. Per-page context focus runs after the panel arrives, opening Calendar/Pricing/Schedule details and following FAQ/media/SEO contexts; it no longer relies on the shell remounting. Bell dropdown UI resets on pathname changes without remounting its data provider.

Each page re-authorizes independently of the persistent shell. If its fresh account/operator/role differs from the shell, a full reload refreshes the shell and inbox. Back/Forward restores can reuse an RSC snapshot, so the existing history guard now refreshes authorization/live server data after committing a different path or query. Hash-only menu/editor history does not refetch. Existing BFCache reload protection remains. No persistent cache was added for reservations, prices, seat capacity or live availability; their existing no-store readers and transactional mutation checks remain intact.

## Initial measured public baseline

Lighthouse 13.5.0, isolated temporary profiles, production content at unchanged cd17d90. Mobile: 412×823, simulated 150ms RTT/1638kbps, 4× CPU. Desktop: 1350×940, Lighthouse desktop preset. These are individual lab observations, not field p75. Public content only was exported.

| Route | Mode | FCP | LCP | Trace TTFB | CLS | TBT | Requests | Script/image transfer |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| FAQ | mobile | 1.22s | 1.22s | 121ms | 0 | 0ms | 36 | 179,104 / 28,538 B |
| Explore | mobile | 1.25s | 2.58s | 145ms | 0 | 6ms | 29 | 180,728 / 386,719 B |
| Destination /explore/centre | desktop | 0.35s | 0.56s | 127ms | 0 | 0ms | 36 | 180,646 / 119,496 B |

Lighthouse main-thread work totaled approximately 570ms on FAQ, 450ms on Explore and 109ms on the desktop destination run; this is total work, distinct from long-task blocking. INP and real-user p75 were not collected. TBT is not an INP substitute. Browser cache/edge/database coldness was not proven. Lighthouse's server-response diagnostic differs from trace TTFB and from HTTP connection timings.

Three HTML-only HTTP samples were also collected for /route, /explore, /faq and /book. Their exact TTFB/total/body-size observations are in the baseline/JSON. They include network/TLS overhead, varied substantially and are not compared with local localhost timings. Browser booking initialization/checkout was not profiled live.

**Safety caveat:** three initial /route HTTP probes preceded discovering the transitive `getDayPlanner → getHomepage → read_availability_v1 → ensure_schedule_date_v1` path. This GET can materialize dated departures; further operational live probing stopped. No booking/hold/payment/email action or direct database mutation was submitted, but zero incidental departure writes cannot be asserted. No corrective production mutation was attempted. Homepage, ongoing route/planner polling, Reservations and dated departure preparation were excluded from further live profiling. This limitation is also recorded in the baseline.

## Admin baseline and before/after navigation

Authenticated Chrome, 1710px desktop, existing session; no private page bodies/screenshots or customer data exported. Full-page goto to visible panel heading, with 100ms readiness sampling and automation overhead:

| Panel | Baseline visible panel |
|---|---:|
| overview | 960ms |
| departures | 1005ms |
| content | 1705ms |
| route-stops | 877ms |
| reviews | 600ms |
| partners | 1203ms |
| email | 674ms |

Calendar & Availability, Prices & Offers and Schedule & Departures share /departures; it was inspected without a date query. Page Editor and Business Settings share /content; email settings use /email. Reservations was inspected in source and regression tests, not loaded for live timing because it calls prepareServiceDate. These observations are neither true cold-cache measurements nor matched production before/after results. The actual warm production Overview → Route stops sidebar click took **1336ms** to its visible heading.

For a repeatable local comparison, development-only fixtures use the original anchor navigation versus current Link navigation with the same synthetic headings and navigation CSS. There is no Supabase, real auth, booking, email, notification subscription or external map connection. Both routes were compiled/warmed first; 50ms readiness sampling plus automation overhead remains. No artificial delay is added.

| Fixture | Three warm clicks | Median | Shell instance preserved |
|---|---|---:|---|
| before | 477ms, 475ms, 522ms | 477ms | no |
| after | 447ms, 440ms, 439ms | 440ms | yes |

This isolates navigation behavior: about 8% lower median in this fixture and preservation of the shell. It does **not** demonstrate production admin navigation below 500ms. Production after timings require a separately authorized release/acceptance run. Mobile fixture navigation at 390px opened/closed the task drawer correctly, retained history behavior and had no horizontal overflow; desktop 1440px also fit.

## Bundle comparison

Unique JS files referenced by each production client-reference manifest, plus gzip computed from those files. This is a repeatable build accounting measure, **not** total network traffic, framework parse cost or bytes redownloaded on warm navigation. Shared chunks can be browser-cached.

| Admin destination | Before raw/gzip | After raw/gzip | Gzip reduction |
|---|---:|---:|---:|
| overview | 466,155 / 134,633 B | 352,121 / 98,317 B | 27.0% |
| bookings | 466,155 / 134,633 B | 356,550 / 100,355 B | 25.5% |
| departures | 466,155 / 134,633 B | 381,458 / 107,437 B | 20.2% |
| content | 466,155 / 134,633 B | 424,690 / 122,046 B | 9.3% |
| route-stops | 466,155 / 134,633 B | 394,566 / 113,011 B | 16.1% |
| reviews | 466,155 / 134,633 B | 390,815 / 111,417 B | 17.2% |
| partners | 466,155 / 134,633 B | 363,110 / 102,426 B | 23.9% |
| email | 466,155 / 134,633 B | 354,996 / 99,735 B | 25.9% |

Homepage referenced JS: 124,723 / 42,815 B raw/gzip → 121,258 / 41,948 B after deferring the closed map controls. Reproduce with `node scripts/performance-bundles.mjs [checkout]` after a production build.

## Matched local Explore image experiment

Actual before/after Explore components, the same synthetic public content/local image/CSS, fresh Lighthouse profiles and warmed local image optimizer. This is a **development fixture**, including development JavaScript, not a production app benchmark. Two sequential runs per condition were collected; the first pass overlapped other local work, so the second pass repeated without the build/test workload. Mobile LCP consistently used the same centre image at the same bounds. Discovery checks changed from lazy/no priority to eager/high priority; content was not hidden.

| Metric | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---:|---:|---:|---:|
| FCP | 0.91–0.91s | 0.91–0.91s | 0.25–0.25s | 0.25–0.25s |
| LCP | 7.12–7.31s | 2.11–2.48s | 0.45–0.53s | 0.49–0.61s |
| CLS | 0.00–0.00 | 0.00–0.00 | 0.00–0.00 | 0.00–0.00 |
| TBT | 19.00–22.50ms | 17.50–20.00ms | 0.00–0.00ms | 0.00–0.00ms |

Mobile improvement is measured in this fixture; it must not be projected onto the published 2.58s Explore baseline. Desktop observations overlap and show no consistent improvement. The development fixture transferred about 1.16MB and made 31–33 requests; small request-count differences are development overhead, not a demonstrated application API reduction. Exact transfer/request/main-thread values are in the JSON.

## Database/request improvements and unchanged boundaries

- The cache regression test runs three permission guards in one simulated React server request: verified-user reads **3 → 1**, membership reads **3 → 1**; a different operator still gets its own membership lookup. Different permission checks can still fail from the same identity snapshot. New request scopes see a new account, inactive membership or sign-out. Outside a render, repeated calls re-read identity.
- WebsitePanel's independent reads are now concurrent rather than four sequential stages. Actual Supabase query execution durations/SQL plans were not collected; latency savings are expected, not measured database timings. No index/schema/migration was added.
- Notification history's All view no longer requests a second identical inbox projection. Synthetic tests verify zero extra all-filter reads, while settings, filters, pagination, read actions and realtime provider updates remain supported.
- Existing published CMS and review request caches were retained. No long-lived sensitive cache, availability cache, speculative admin prefetch, new poller, worker, service or tracking backend was introduced.
- Existing no-store behavior, per-entry authorization, operator-scoped reads, immutable booked prices, seat/infant rules, cutoff checks and transaction/idempotency paths remain unchanged.

## Regression results and readiness

Clean offline install, final ESLint, TypeScript, production build and **518 tests pass**: components 110, identity 23, integrations 170, database 182, PostgreSQL 26, CMS 7. New/expanded tests cover request/user/operator cache isolation, revoked access, mobile deferred navigation, dirty CMS click/Back guards, page-arrival/context focus, history freshness, inbox reuse and first-image priority. Existing synthetic booking, passenger, capacity, pricing, calendar, publication/CMS, authentication, role, QR/email and map-contract suites remain passing. git diff --check passes.

A local production server confirmed 404 for both navigation benchmark modes and the Explore benchmark. These fixtures never become a production admin module. Local navigation review screenshots: `/private/tmp/performance-admin-desktop.png` and `/private/tmp/performance-admin-mobile.png`.

Remaining limits: real authenticated after-navigation timings, native screen-reader/device behavior, live subscription reconnect across deploys, production database query duration and field INP/LCP p75 are unverified. No full live checkout was run. Homepage/operational route measurement is constrained by legacy GET materialization; separating pure reads from preparation needs a separate backend decision, not an unapproved RPC/schema change here. Existing English-only booking labels and native date-picker limitations remain unchanged; this work adds no translations or new CMS fields. Font/script/image/tracking inspection found no justification for replacing fonts, degrading image quality, changing hero composition or reducing tracking cadence.

Ready for **owner review of the local changes**. A production release needs explicit authorization, integration against then-current main, normal CI and controlled authenticated acceptance. No push, merge, deployment, cloud configuration, DNS, provider change or new hosted environment was performed. Roadmap architecture and recorded business decisions are preserved.

## Modified files

- `docs/PERFORMANCE-BASELINE-2026-10-23.md`
- `docs/PERFORMANCE-OPTIMIZATION-2026-10-23.md`
- `docs/PHASE_STATUS.md`
- `docs/performance/summary-2026-10-23.json`
- `scripts/performance-bundles.mjs`
- `src/app/admin/[operatorId]/(workspace)/bookings/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/catalog/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/content/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/departures/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/email/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/layout.tsx`
- `src/app/admin/[operatorId]/(workspace)/loading.tsx`
- `src/app/admin/[operatorId]/(workspace)/notifications/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/overview/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/partners/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/reviews/page.tsx`
- `src/app/admin/[operatorId]/(workspace)/route-stops/page.tsx`
- `src/app/admin/[operatorId]/[section]/page.tsx` — replaced by explicit section pages
- `src/app/admin/admin-navigation-guard.ts`
- `src/app/admin/admin-navigation.tsx`
- `src/app/admin/admin-shell.tsx`
- `src/app/admin/admin-workspace-context.tsx`
- `src/app/admin/admin.module.css`
- `src/app/admin/layout.tsx`
- `src/app/admin/notifications.tsx`
- `src/app/admin/section-access.ts`
- `src/app/admin/session-history-guard.tsx`
- `src/app/admin/website-panel.tsx`
- `src/app/admin/website-workspace.tsx`
- `src/app/dev/performance-explore/baseline-view.tsx`
- `src/app/dev/performance-explore/page.tsx`
- `src/app/dev/performance-navigation/after/[section]/page.tsx`
- `src/app/dev/performance-navigation/after/layout.tsx`
- `src/app/dev/performance-navigation/after/loading.tsx`
- `src/app/dev/performance-navigation/baseline-navigation.tsx`
- `src/app/dev/performance-navigation/before/[section]/page.tsx`
- `src/app/dev/performance-navigation/navigation-fixture.tsx`
- `src/components/public/editorial-pages.tsx`
- `src/components/public/homepage-map-disclosure.tsx`
- `src/components/public/homepage-view.tsx`
- `src/components/public/live-map-embed.tsx`
- `src/components/public/ui.tsx`
- `src/modules/identity/require-permission.ts`
- `src/modules/identity/supabase-server.ts`
- `tests/components/admin-history-freshness.test.mjs`
- `tests/components/admin-navigation-guard.test.mjs`
- `tests/components/admin-navigation-phase-a.test.mjs`
- `tests/components/admin-section-context.test.mjs`
- `tests/components/explore-priority.test.mjs`
- `tests/components/notification-bell.test.mjs`
- `tests/integrations/request-identity-cache.test.mjs`

## Review and reproduction

Use the isolated checkout above for source review; the original IDE source is intentionally still stale/dirty. A portable patch is retained in the original workspace at `docs/review/PERFORMANCE-2026-10-23.patch`, targeting clean cd17d90-compatible source. Do not apply it blindly to the old dirty IDE source.

Run `npm run check`, `npm test`, then `node scripts/performance-bundles.mjs`. For local-only browser comparison, `npm run dev -- --port 3108` exposes `/dev/performance-navigation/before/overview`, `/dev/performance-navigation/after/overview`, and `/dev/performance-explore?before=true` versus `/dev/performance-explore`. Use Lighthouse 13.5.0 with the same mobile/desktop preset and fresh isolated profiles; do not mix development figures with production baselines. No Supabase credentials are needed for these fixtures.
