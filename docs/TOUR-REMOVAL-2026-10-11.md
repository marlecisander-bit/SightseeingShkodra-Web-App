# Tour subpage removal — 11 October 2026

Implemented locally and prepared for deployment; **not deployed, committed or pushed**. Existing unrelated dirty-workspace changes were preserved. This is an explicit user amendment to the dedicated Tour-page roadmap requirement; original roadmap unchanged.

## Result and redirect

Deleted the public `/tour` page and its TourView renderer, page metadata, TouristTrip/breadcrumb JSON-LD, Tour-only styles . `/tour` now has only a redirect Route Handler, with an empty body and fixed relative Location `/route`, status **301**. No CMS, catalog or booking reads occur in that handler. Obsolete query parameters are dropped, including caller-supplied redirect targets; GET and automatically supported HEAD both return 301. The relative target preserves the request host. `/route` responds 200, with no return redirect or loop. Next's build route list still includes `/tour` because it contains a redirect handler, not a public page.

Existing shared images, product data, typography, controls, navigation layout, booking, map integration and other page sections remain. No exclusively Tour-owned bitmap asset or package dependency was found; shared files/media were retained.

## Navigation and links

- Both header layouts consume publicNavigation; historical bare Tour entries are omitted before target deduplication. Existing custom labels for other destinations remain supported. The old default Tour slot is now a Home target and is deduplicated with the existing Home entry, so no extra public item appears.
- Homepage hero fallback links to `/route`; timetable links to `/route#journey-departures`; ticket details links to `/book`.
- Travel companion timetable links to `/route#journey-departures`.
- Destination-guide action links to `/route` using the existing shared route action label.
- Existing footer renders social/legal/staff links, with no Tour item. Historical footer data remains stored; unused defaults now use Route.
- Historical saved Tour links are resolved without writing records: FAQ anchors go to `/faq`, inclusions to `/book`, and other Tour destinations to `/route`. Bare legacy Tour header entries are removed rather than displaying a renamed duplicate.
- General service marketing references to “tour,” including booking copy, remain unchanged.

## SEO

Removed `/tour` from published sitemap projection and removed its dedicated canonical/Open Graph metadata and structured-data function. Product publication still controls `/book`; publication/robots/origin gates and other page metadata remain unchanged. Published fixture XML has nine entries rather than ten and excludes Tour. Actual local sitemap also excludes Tour, with local indexing disabled.

## CMS and stored data

Removed the Tour section/card, preview navigation target and Tour-only action-label editor. Old private `page=tour` preview URLs redirect to the existing Route preview after authorization. Link selectors offer active destinations; historical current Tour values display their resolved target instead of an obsolete option. Catalog invalidation no longer revalidates the removed page.

Shared `tourPage.includedTitle` remains under Homepage > A day with possibilities, with its persisted key/value preserved and exactly one logical editor. The dedicated FAQ keeps `tourPage.faqTitle`, `faq.items`, and legacy-question fallback behavior. Tour-only `tourPage.eyebrow`, `labels.tour`, `how.*` and historical navigation/footer/intro values remain in the stored schema for compatibility. Full-document validation still accepts historical `/tour` values so unrelated CMS saves do not break. These are compatibility references, not advertised links.

No records, uploaded media, database tables, permissions, migrations, environment settings or Supabase writes were changed. Future removal of unused stored keys/media requires separate approval and a versioned retention/compatibility plan. Historical docs, field inventories, fixtures and SQL migrations retain earlier Tour references as evidence and must not be rewritten as if Tour never existed.

## Files modified/deleted

Deleted:
- src/app/(public)/tour/page.tsx

Added:
- src/app/(public)/tour/route.ts
- tests/components/tour-removal.test.mjs
- docs/TOUR-REMOVAL-2026-10-11.md

Application changes:
- src/components/public/editorial-pages.tsx
- src/components/public/homepage-hero.tsx
- src/components/public/homepage-view.tsx
- src/app/(public)/public.css
- src/app/(public)/your-day/page.tsx
- src/app/(public)/explore/[slug]/page.tsx
- src/modules/content/seo.ts
- src/modules/content/sitemap.ts
- src/modules/content/website-schema.ts
- src/modules/content/navigation.ts
- src/modules/content/editorial-fields.ts
- src/app/admin/[operatorId]/website-preview/page.tsx
- src/app/admin/catalog-actions.ts
- src/app/admin/website-editor.tsx
- src/app/admin/website-section-card.tsx
- src/app/admin/website-workspace.tsx
- src/app/dev/cms-reconciliation/page.tsx

Verification and documentation:
- scripts/validate-local-site.mjs
- scripts/verify-cms-fields.mjs
- scripts/verify-public-homepage.mjs
- tests/components/cms-visibility.test.mjs
- tests/components/editorial-connections.test.mjs
- tests/components/global-footer.test.mjs
- tests/integrations/seo.test.mjs
- tests/integrations/sitemap.test.mjs
- docs/DECISIONS.md
- docs/PHASE_STATUS.md
- docs/CMS-RECONCILIATION.md

This list describes this task only. Git status also contains earlier pending changes; those are not attributed to Tour removal.

## Validation

Final results:
- ESLint: PASS.
- TypeScript: PASS.
- Optimized production build: PASS.
- Component tests: 41 passed, 0 failed/skipped.
- Integration tests: 140 passed, 0 failed/skipped.
- Disposable database regressions: 165 passed, 0 failed/skipped, including booking/capacity/CMS behavior.
- Read-only local public crawl: 83 internal links, zero failures.
- Compiled-production HTTP smoke: GET/HEAD `/tour` with and without queries returned 301 `/route`; following it ended at `/route` 200 without a query or loop. Homepage, Route, Booking, Explore, FAQ, Your-day, Credits, Privacy and Terms returned 200 with no Tour anchor links. Local sitemap returned 200 and excluded Tour.
- Chrome 1440px desktop and 390px mobile: shared menu displays Home, Route & Live Map, Explore Shkodra, FAQ and booking action, with no Tour item and no measured desktop overflow. Mobile menu opens normally. Browser navigation through Tour lands at Route. Booking form loads its existing date/passenger/departure controls; no reservation was submitted.
- Automated CMS tests verify Tour controls are absent and shared inclusions/FAQ have exactly one active owner. Authenticated hosted CMS editing was not performed.

An initial TypeScript run hit stale generated `.next/dev/types` referencing the removed page; only generated types were cleared and the rerun passed. A new Header SSR test initially lacked Next's pathname context; its harness now provides the real context. A navigation regression caught an unnecessary default Route duplicate; the unused default slot now deduplicates with Home, preserving existing Route labels. All final runs pass.

Evidence:
- /private/tmp/tour-removal-{components,integrations,database,build,crawl}.log
- /private/tmp/tour-removal/production-smoke.json
- /private/tmp/tour-removal/header-desktop.jpg
- /private/tmp/tour-removal/header-mobile.jpg
- /private/tmp/tour-removal/navigation-mobile.jpg (final production-build menu)

The hosted-data test scripts were updated for the removed page but not executed; they can mutate synthetic hosted fixtures. Current validation uses disposable automated data and read-only localhost checks only.

## Release limits and next action

Ready for review and a separately authorized deployment. This local clone lacks PUBLIC_OPERATOR_ID, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, so the homepage reports content temporarily unavailable and the local Route has no published-stop content. This pre-existing configuration limitation does not establish a production content defect; actual published homepage/destination/admin parity requires a hosted smoke check after approval. Product and CMS rendering/retention were tested with isolated fixtures. No actual booking, production CMS edit, live GPS change, map repository change, email or external deployment occurred.

Before approving release, review the diff and separate this task from earlier pending workspace changes. After the authorized deployment, verify the real domain's 301, published menu, sitemap and shared homepage/FAQ editing. Stored Tour-content cleanup remains optional and separately approved.

## Authorized release candidate

User subsequently authorized publication. Candidate based on production ac26b8e excludes unpublished analytics and Classic Modern timeline changes. The validation counts above describe the original workspace; clean release verification is recorded separately.

Clean authorized release validation: locked install, ESLint, TypeScript and optimized build passed. Full suite: 38 components, 17 identity, 140 integrations, 165 database, 24 PostgreSQL concurrency tests; 384 total, no failures or skips. No hosted data writes.
