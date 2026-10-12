# Production sitemap investigation — 9 October 2026

Read-only production checks at 20:14 Europe/Tirane (18:14 UTC). No production settings, deployment, DNS, database or Google account changes. Local HEAD is ffd26dd on main, matching the local origin/main reference; no remote fetch performed. Exact current Vercel deployment SHA was not retrieved from authenticated deployment metadata. The 8 October audit's 18c48d0 is historical, not asserted to be current.

## Findings

| Check | Observed production evidence |
| --- | --- |
| Sitemap exists | GET https://sightseeingshkodra.app/sitemap.xml returns HTTP 200, Vercel x-matched-path /sitemap.xml, no redirect |
| XML | Content-Type application/xml; XML declaration and correct sitemap namespace; Python ElementTree parses it; **zero URL elements**. Well-formed XML, not a useful populated sitemap; schema validity for an empty urlset is not claimed. |
| Canonical/public URLs | Sitemap contains none. Separately checked /, /tour, /book, /faq, /route, /explore: all HTTP 200 without redirects, canonical links match their exact HTTPS production URLs, all have noindex,nofollow. |
| Robots | HTTP 200 text/plain; User-Agent: * followed by Disallow: /. No Sitemap directive. This also blocks /sitemap.xml. |
| Googlebot access | Repeated sitemap/robots/public-page GETs using Googlebot user agent returned 200 without login, CAPTCHA or redirect. This is a user-agent simulation, not a verified Google IP or Search Console live test. |
| App authentication | src/proxy.ts matcher covers only /admin, /auth and /api/admin. Sitemap, robots and public pages bypass it. No relevant redirects/rewrites or access restrictions in next.config.ts; no active root vercel.json. No external WAF/dashboard configuration was retrieved; no challenge observed in HTTP responses. |
| Pending SEO | robots.ts, seo.ts, metadata/schema and GA additions remain local uncommitted work. Live /tour has no new TouristTrip schema; live homepage/tour have no measurement ID or consent UI. Analytics absence alone cannot prove deployment absence because it is gated. No commit/push/deployment occurred in these tasks. |

## Cause

The deployed application's indexing gate is closed. The exact combination of empty sitemap, blanket robots block and noindex public metadata matches seoConfig().index=false. Correct live canonical URLs show NEXT_PUBLIC_SITE_URL resolves to the canonical HTTPS origin. Either SITE_INDEXING_ENABLED is absent/not exactly true, APP_ENV is not exactly production, or the deployed configuration differs from the reviewed source. The actual hosted variable values were not read, so the particular variable is not claimed as verified.

Google's [Sitemaps report documentation](https://support.google.com/webmasters/answer/7451001?hl=en-GB) states that Google respects robots.txt when fetching sitemaps. The current blanket robots rule is a concrete fetch blocker for Google even though a direct HTTP client receives 200. The empty sitemap and noindex pages are additional indexing defects. Search Console's last attempt/error timestamp was not accessed; after fixing these confirmed defects, its live test is required to exclude historical or Google-specific network problems.

## Local correction and tests

Added an explicit VERCEL_ENV gate in src/modules/content/seo.ts: when Vercel supplies an environment, only production can index. Local simulations without VERCEL_ENV retain the existing behavior. Preview and Vercel Development remain blocked even if APP_ENV and SITE_INDEXING_ENABLED are accidentally production/true. Added preview/development-denied and production-allowed regression assertions to tests/integrations/seo.test.mjs.

The existing local public /book inclusion and robots correction from the preceding task remain pending; no bypass of the production release gate was introduced. Disabled local/Preview behavior is intentional, not a defect to remove.

Checks completed: four focused SEO tests passed using node --import tsx --conditions=react-server; full lint passed; next typegen/tsc passed; optimized next build passed, listing both /sitemap.xml and /robots.txt as dynamic routes. XML parsing and all eight live endpoints passed HTTP transport checks. No hosted fixture script was run: scripts/verify-public-seo.mjs creates database records and requires isolated development data. No production content mutation or booking performed.

## Exact release requirement

For a narrowly scoped sitemap/indexing release, include these current changes:

1. src/app/robots.ts — remove the obsolete /book exclusion; retain /booking/, /dev/, /admin, /auth/, /api/ and /your-day exclusions; enabled branch already emits the canonical sitemap reference.
2. src/modules/content/seo.ts — include /book alongside the published tour and enforce the Vercel production-only indexing guard. Its current diff also contains the preceding tourStructuredData helper; including that helper is harmless but publishing tour JSON-LD additionally requires src/app/(public)/tour/page.tsx.
3. tests/integrations/seo.test.mjs — corresponding sitemap, environment and schema expectations (test source, not runtime configuration).
4. This audit report and the updated phase status/SEO report for the release record.

src/app/sitemap.ts already exists in the committed application and needs no replacement/static XML file or database migration. It will generate URLs from existing published authoritative content once the gate is open. No GA4, consent, booking-event, stylesheet or verification changes are required to repair sitemap fetching. Do not accidentally include all unrelated pending work when preparing a narrow release; the full prior SEO/GA4 package is separately listed in GOOGLE-ANALYTICS-SEO.md and is still awaiting release.

With separate owner approval, verify/set **Production only**:

- NEXT_PUBLIC_SITE_URL=https://sightseeingshkodra.app
- APP_ENV=production
- SITE_INDEXING_ENABLED=true

Leave Preview/Development indexing false. Do not modify communications, scheduler or backend credentials. A new approved Vercel Production deployment must use the reviewed source and these values. Deployment without enabling the gate will continue returning an empty sitemap; enabling the gate on older source still leaves /book excluded.

After approved deployment: verify 200 application/xml with at least one canonical URL; check every emitted URL returns 200 and is indexable/canonical; verify robots has Allow: / plus Sitemap: https://sightseeingshkodra.app/sitemap.xml and private exclusions; verify public metadata permits indexing and private pages remain noindex. In Search Console run a live inspection of the sitemap and resubmit sitemap.xml for the correct domain/URL-prefix property. No Search Console verification token or GA4 setting is needed to repair the sitemap endpoint itself.

## Empty-sitemap correction follow-up

This section supersedes the earlier narrow release list for the expanded empty-sitemap task.

### Exact root cause and contributing factors

The committed sitemap returns [] **before running any CMS/catalog queries** when seoConfig().index is false. The observed empty urlset, Disallow / and public noindex responses all follow that closed gate. Correct HTTPS canonical URLs rule out a malformed canonical origin in the observed responses. Exact hosted APP_ENV/SITE_INDEXING_ENABLED values have not been retrieved; verify them rather than assuming which one is wrong. Unpublished SEO code is also pending but deploying it alone cannot open the explicit gate.

The earlier sitemap unnecessarily called getHomepage(), which invokes availability/next-service-date lookups, and used that operational state to decide editorial route eligibility. Its Promise.all also let a destination failure abort the entire response; website publication failures were indistinguishable from deliberate non-publication. These are resilience/consistency weaknesses, not evidence that production database queries caused the current empty response. No build-time empty snapshot: connection() makes the route dynamic, confirmed by the Next build output.

### Local changes in this task

- src/modules/content/sitemap.ts: central pure publication eligibility. Website publication governs Home/Route/Explore/FAQ; published van-tour catalog governs Tour; Booking requires both. Legal text requires explicit publication and nonempty content. Only canonical published guide slugs, deduplicated, no aliases/fragments.
- src/modules/content/sitemap-server.ts: bounded, operator/slug-scoped read-only product existence query; existing website/destination projections reused. No pricing, holds, availability, schedule materialization, GPS, reviews or map calls. Source injection supports isolated tests.
- src/app/sitemap.ts: uses the lightweight publication loader, no getHomepage(). Dependency failures or an enabled site with no published URLs throw an HTTP server error instead of a misleading empty 200. No stale cache resurrects an archived page. Disabled development/Preview retains intentional empty sitemap.
- src/modules/content/website-server.ts: distinguishes not-published from configuration/provider/invalid-publication failures with an internal unavailable flag; public content and logging unchanged.
- src/app/(public)/route/page.tsx, explore/page.tsx and book/page.tsx: explicit publication-aware metadata; Booking also checks published tour eligibility. This closes accidental index permission for unpublished content without changing rendered designs or booking rules.
- Existing pending src/app/robots.ts corrections and src/modules/content/seo.ts Preview/Development guard remain required.
- tests/integrations/seo.test.mjs, sitemap.test.mjs and website-publication.test.mjs: eligibility, publication/outage distinction, no stale fallback, canonical metadata and Next XML serialization.

### Complete expected production URL set after approved indexing activation

Read-only live discovery found these four linked guides; all returned HTTP 200 and matching canonicals. Home/Tour/Booking/FAQ/Route/Explore were also confirmed 200/canonical in the preceding audit. Expected URLs, subject to current authoritative publication state at release:

1. https://sightseeingshkodra.app/
2. https://sightseeingshkodra.app/tour
3. https://sightseeingshkodra.app/book
4. https://sightseeingshkodra.app/faq
5. https://sightseeingshkodra.app/route
6. https://sightseeingshkodra.app/explore
7. https://sightseeingshkodra.app/explore/bridge
8. https://sightseeingshkodra.app/explore/castle
9. https://sightseeingshkodra.app/explore/centre
10. https://sightseeingshkodra.app/explore/lake

No URLs are currently indexable while the production gate is closed. Live Privacy Policy and Terms both display “This page has not been published yet”; they remain excluded, but are added dynamically if explicitly published with text. Photography credits inherits intentional root noindex and is an attribution utility; excluded. /your-day, /booking/manage, /dev/*, admin/auth/API and /live redirect excluded. Any additional published guide absent from the listing but with guidePublished=true is still included automatically; a listing inspection cannot prove a complete database inventory, so the generated production sitemap is the final authoritative list after release.

### Verification and recommendation

138 integration tests passed. Lint, TypeScript and optimized build passed. The test generated XML using the installed Next.js serializer with isolated publication fixtures corresponding to these ten URLs; Python ElementTree parsed it and verified ten canonical HTTPS loc entries. This is local serializer/metadata verification, not a claimed live enabled HTTP sitemap or isolated database end-to-end run. The real production sitemap was rechecked read-only and remains empty.

No new migration, dependency or database record change. Editorial/catalog publication queries remain necessary to exclude intentionally unpublished content. Temporary backend failures produce a server error that Google can retry; the application does not invent URLs or cache withdrawn content. This deliberate tradeoff preserves immediate publication truth while eliminating operational availability dependencies.

**Deployment required: YES. Recommendation: NO-GO for immediate production deployment**, pending verification/approval of Production APP_ENV=production, SITE_INDEXING_ENABLED=true, canonical NEXT_PUBLIC_SITE_URL and the exact scoped release. All sitemap/publication files listed above plus existing robots/SEO changes, tests and documentation must be included. Prior optional GA4/consent/booking-event changes need not be included; keep GA4_ENABLED=false unless their separate prerequisites are met. Do not merge all outstanding work implicitly.

After approval, rebuild/deploy the reviewed main release using Production settings, then verify emitted XML, robots reference, every actual URL/canonical/index metadata and private noindex. Run Search Console live fetch and resubmit sitemap.xml. Production settings, exact current deployment SHA and Google's actual last fetch were not inspected through authenticated dashboards; these remain release acceptance checks, not fabricated evidence.
