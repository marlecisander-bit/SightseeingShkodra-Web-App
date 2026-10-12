# Tour removal deployment — 11 October 2026

Published under the owner’s explicit “publish the changes” authorization.

- PR: https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/7
- Production main: `6a4f9e88a2963432e54a210f522cdc20e3ad6dd3`.
- Vercel: `dpl_ECEb8jVRr5XjdsMqALTCxzyZm5NZ`, Ready / Production / Current, canonical domain sightseeingshkodra.app. Build duration 25 seconds.
- Preview: `dpl_FBd1seWiWJ4SuTWRCPSbBASHEfMi`, Ready, candidate `ecf284674ba4047aa0aaea49b30792062d9e41cd`.
- GitHub Project CI run 38177024687: successful lint/types/build, complete disposable tests and production dependency audit.

## Scope

Isolated from production ac26b8e. Exactly 32 files, listed below. Deleted Tour page/view/exclusive CSS/SEO and dedicated editor. Redirect-only handler returns exact HTTP 301 `/tour` → `/route`, dropping obsolete queries. Shared stored CMS keys, inclusions, FAQ and historical link validation remain compatible; no records or media removed. Legacy links resolve to Route, Booking or FAQ as appropriate. Unpublished Classic Modern timeline and analytics changes remain in the original workspace and were excluded. Booking/backend/payment/independent map files and cloud settings remain unchanged.

## Verification

Clean locked install, ESLint, TypeScript, optimized build passed. Full suite: 38 component + 17 identity + 140 integration + 165 database + 24 PostgreSQL concurrency = 384 tests, no failures/skips. Initial CI hit a Mac-only evidence-file path copied from the local workspace; restored the existing production portable temporary-directory path, retested, and final CI passed. No unresolved check failure.

Live GET and HEAD `/tour`, with and without obsolete/unsafe query values, return 301 with fixed relative Location `/route`; following ends at `/route` 200 without query or loop. Home, Route, Book, Explore, FAQ, Your-day, Credits, Privacy and Terms return 200. Sitemap returns 200 with nine URLs and no Tour; robots retains its sitemap declaration. Four destination guides remain available. Read-only crawl: 14 routes, 160 internal links/anchors, zero failures; unknown page 404.

Chrome desktop 1440px and mobile 390px: no Tour links, no horizontal overflow; mobile menu opens with Home, Route & Live Map, Explore Shkodra, FAQ and Book your day. Footer retains social/legal/staff links. Homepage renders published CMS text, stop images and ticket inclusions. Booking date/passenger/departure controls work; 12 October shows four available departures and from €10 per adult. No reservation/hold/checkout was submitted.

Authenticated Admin > Website > Public pages has nine sections and no Tour editor or Tour draft target. Shared FAQ heading/questions and published-inclusions answer source remain. Homepage > A day with possibilities retains saved inclusions heading “A simple day out.” with its existing stored key and no Tour-only eyebrow control. Unsaved changes remains No; no CMS content was saved/published. General “Tour operations” service wording is intentionally retained.

## Remaining content and limits

Historical Tour stored fields/links and historical docs/migrations remain intentionally compatible, with no public page consumer. Optional data/media retirement needs separate approval. Search-engine reindexing timing is external; redirect and sitemap are deployed. No physical device test, real booking/payment, email delivery or live GPS accuracy certification. Preview’s independent-map iframe rejects its unapproved Preview origin; no external map configuration was changed. Production map integration remains the existing iframe/bridge. The loaded production map displays its van/stops/route controls and reports “Live tracking temporarily unavailable - Last update 7 min ago”; upstream feed accuracy was not changed or certified.

Original dirty workspace preserved. No env, database, provider, scheduler, permissions, tracking service or deployment-platform reconfiguration. Prior deployment ac26b8e retained for rollback; no rollback required.

## Files

- docs/CMS-RECONCILIATION.md
- docs/DECISIONS.md
- docs/PHASE_STATUS.md
- docs/TOUR-REMOVAL-2026-10-11.md
- scripts/validate-local-site.mjs
- scripts/verify-cms-fields.mjs
- scripts/verify-public-homepage.mjs
- src/app/(public)/explore/[slug]/page.tsx
- src/app/(public)/public.css
- src/app/(public)/tour/page.tsx
- src/app/(public)/tour/route.ts
- src/app/(public)/your-day/page.tsx
- src/app/admin/[operatorId]/website-preview/page.tsx
- src/app/admin/catalog-actions.ts
- src/app/admin/website-editor.tsx
- src/app/admin/website-section-card.tsx
- src/app/admin/website-workspace.tsx
- src/app/dev/cms-reconciliation/page.tsx
- src/components/public/editorial-pages.tsx
- src/components/public/homepage-hero.tsx
- src/components/public/homepage-view.tsx
- src/modules/content/editorial-fields.ts
- src/modules/content/navigation.ts
- src/modules/content/seo.ts
- src/modules/content/sitemap.ts
- src/modules/content/website-schema.ts
- tests/components/cms-visibility.test.mjs
- tests/components/editorial-connections.test.mjs
- tests/components/global-footer.test.mjs
- tests/components/tour-removal.test.mjs
- tests/integrations/seo.test.mjs
- tests/integrations/sitemap.test.mjs

## Evidence

- /private/tmp/tour-release/{production-smoke.json,production-crawl.json,deployment.txt,admin-pages.txt,admin-home-inclusions.txt,booking.txt}
- /private/tmp/tour-release/{home-desktop.png,mobile-menu.png}
- /private/tmp/tour-release-{install,check,tests}.log

This evidence report is local documentation and was not redeployed after verification.
