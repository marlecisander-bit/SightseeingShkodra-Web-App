# Final SEO production release — 9 October 2026

Recommendation: **GO for the isolated SEO release after explicit deployment approval.** No deployment, commit, push, production configuration or database change performed. Owner confirms the three Production values manually checked: APP_ENV=production, SITE_INDEXING_ENABLED=true, NEXT_PUBLIC_SITE_URL=https://sightseeingshkodra.app. With Vercel's production environment these values open seoConfig().index; Preview/Development remain closed. Earlier NO-GO for unverified variables is superseded by this owner confirmation and isolated candidate verification. This is an SEO release recommendation, not a renewed full operational launch audit.

## Review and isolation

Baseline: local main HEAD ffd26dd (full SHA in the patch manifest). A separate copy was assembled from git archive HEAD plus only the reviewed release files. No .env.local or private credentials copied. No node_modules/build output will be part of the patch. The original workspace, including unfinished GA4 work, remains intact.

Runtime release files:

- src/app/robots.ts
- src/app/sitemap.ts
- src/app/layout.tsx (optional supplied Search Console token support)
- src/app/(public)/book/page.tsx
- src/app/(public)/explore/page.tsx
- src/app/(public)/route/page.tsx
- src/app/(public)/tour/page.tsx (factual tour JSON-LD)
- src/modules/content/seo.ts
- src/modules/content/website-server.ts
- src/modules/content/sitemap.ts (new)
- src/modules/content/sitemap-server.ts (new)

Tests: tests/integrations/seo.test.mjs, sitemap.test.mjs (new), website-publication.test.mjs. Configuration example: .env.example contains only optional GOOGLE_SITE_VERIFICATION and disabled GA4 note. This release report accompanies the patch; historical audit/phase docs are retained in the main workspace and not swept into the release automatically.

Excluded: analytics component/module/test, public layout analytics mount, public stylesheet consent changes, booking.tsx, checkout-flow.tsx and customer-booking.tsx analytics hooks. Therefore the candidate has **no Google tag loader or event sender** regardless of an accidental GA4 flag. Keep GA4_ENABLED=false; activation requires separate approval and the consent/account/privacy prerequisites in GOOGLE-ANALYTICS-SEO.md. Consent implementation was reviewed as deferred work, not enabled or certified through this SEO release.

Candidate changes no booking-domain, payment, pricing, availability, tracking, migration, package/lockfile, provider, scheduler or authentication implementation. Booking page changes concern only metadata/publication eligibility. Operator-scoped read-only publication/catalog projections are preserved; sitemap no longer invokes operational availability and cannot create departures. Temporary publication failures produce server errors rather than empty successful responses or stale archived URLs.

## Expected URLs and metadata

Eligible when currently published authoritative projections are loaded and the gate is open:

- https://sightseeingshkodra.app/
- https://sightseeingshkodra.app/tour
- https://sightseeingshkodra.app/book
- https://sightseeingshkodra.app/faq
- https://sightseeingshkodra.app/route
- https://sightseeingshkodra.app/explore
- https://sightseeingshkodra.app/explore/bridge
- https://sightseeingshkodra.app/explore/castle
- https://sightseeingshkodra.app/explore/centre
- https://sightseeingshkodra.app/explore/lake

Earlier read-only live checks confirmed HTTP 200 and exact canonical URLs for all ten. Home and FAQ publication checks already existed; Route/Explore/Booking now also require their authoritative publication state. Tour metadata uses the published product; guides require guidePublished and canonical slug. Titles/descriptions/social metadata remain owned by existing CMS/catalog, not a second content source. Private pages retain root or explicit noindex: admin, staff auth, booking management, dev and utility pages. APIs are not sitemap entries. Credits and sample /your-day are intentionally noindex. /live is a redirect and excluded. Legal pages were confirmed unpublished and remain excluded until explicitly published with nonempty text. Future guide publication/archival updates the request-time sitemap without rebuilding.

## Actual validation

Run against the isolated candidate:

- npm run lint: PASS.
- npm run typecheck: PASS.
- npm run build: PASS, dynamic sitemap and robots routes confirmed.
- node --import tsx --conditions=react-server --test tests/integrations/*.test.mjs: 138 passed.
- node --import tsx --test tests/components/*.test.mjs: 31 passed; excluded analytics tests are intentionally not part of this candidate.
- Next.js XML serializer/metadata tests: ten canonical production loc entries; normal publication/outage distinction; draft/utility exclusions; Preview/Development deny indexing. Prior Python XML parse passed.
- Built local Next server, production variables supplied, no backend credentials: /robots.txt HTTP 200 text/plain, Allow /, correct Sitemap reference and /admin, /auth/, /api/, /booking/, /dev/, /your-day exclusions.
- Scope comparison: only allowlisted files differ from baseline; no runtime analytics loader or events in candidate source; domain/database/tracking/package files unchanged.

One initial build failed because Turbopack rejects a symlinked node_modules outside its filesystem root; copying the existing dependencies into the candidate resolved it without changing source/configuration. One sandbox loopback start was denied; the authorized isolated loopback check succeeded. These are resolved local environment issues.

No production-mode CMS database end-to-end run or actual Googlebot-IP fetch claimed. Actual enabled production XML and page metadata must be checked after deployment; publication changes or provider outages can change the URL count. No Rich Results eligibility or indexing time promised.

## Exact deployment workflow — only after approval

Use the prepared SEO patch/manifest, not the dirty working directory's full diff. The patch is based on ffd26dd. In a clean isolated Git worktree/branch based on the reviewed baseline, run git apply --check on the patch, apply it, then inspect git diff --stat and the file list against this report. If main has advanced, reconcile the scoped patch and rerun checks before proceeding. Never use git add . on the original workspace.

Commit only this patch's files on a dedicated SEO branch and open the normal GitHub PR. Vercel Preview must keep indexing/communications disabled and cannot use production Supabase bindings. This credential-free local candidate already passed checks; a Preview without isolated data is only a shell check, not a booking test. Do not provision resources or bind Preview to production for this release.

After explicit approval, merge the reviewed PR into main through the existing Git integration so Vercel creates a **new Production deployment** of the reviewed source using the owner-confirmed Production variables. Redeploying the old source alone does not include these fixes. Use the normal Next.js preset/Node 24/npm run build configuration. No manual database migration, provider activation, DNS change or new hosting configuration is required. Keep current communications settings and the external map unchanged. Optional GOOGLE_SITE_VERIFICATION remains unset until Google provides the token; it is not required for sitemap generation.

## Post-deployment acceptance

1. Confirm Vercel Production is Ready at the approved commit and sightseeingshkodra.app points to it. Record the actual deployment SHA and retain the preceding deployment for rollback.
2. Open /sitemap.xml: HTTP 200 application/xml, valid populated XML, ten expected canonical URLs if publication is unchanged, no private routes, aliases, fragments or Preview/localhost domains. Check every emitted URL returns 200 and its canonical equals its loc.
3. Open /robots.txt: HTTP 200 text/plain, Allow /, Sitemap: https://sightseeingshkodra.app/sitemap.xml, private exclusions, no blanket Disallow /.
4. Inspect public page source: useful existing title/description, absolute HTTPS canonical, robots index/follow. Check /admin, auth, /booking/manage and utility pages still noindex; do not sign in, submit bookings or mutate records for this SEO check.
5. Confirm no Google Analytics network requests or tag script from this candidate. Run Google's structured-data validators on /tour and a guide as external acceptance; rich results are not guaranteed.
6. In the verified Search Console property for this exact domain/origin, submit sitemap.xml (or its full canonical URL), run the live sitemap fetch if the report remains stale, and use URL Inspection on Home/Tour/a guide to confirm crawl access and index permission. Request indexing for key pages where appropriate. Google may take time to retry; submission does not guarantee indexing.
7. If sitemap returns a server error, investigate publication/provider configuration and retry; do not force-index unpublished content. If production fails acceptance, use the preceding Vercel deployment according to the existing rollback procedure and record the failure. Do not change database or communications to repair SEO.

STOP: deployment remains pending explicit approval.
