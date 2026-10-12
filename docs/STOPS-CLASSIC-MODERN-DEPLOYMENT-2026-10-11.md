# Classic Modern stops redesign deployment — 11 October 2026

Published under explicit owner authorization (“publish also the stops redesign”).

- PR #8: https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/8
- Production main: `415f747371f73b7fc94e56d321ff32f55f5e6010`.
- Vercel `dpl_HPzYj41KoRTMFC7ntVyySFqTBs4P`: Ready, canonical sightseeingshkodra.app, source main/415f747.
- Preview `dpl_H8yFra2rZHiUzxNsszn6gSpJxSAG`: Ready, source caad433, 23-second build.
- GitHub CI run 38177563198: all steps successful, including production dependency audit.

Exactly six files released: shared stops component and module CSS, production-disabled development fixture, component regression tests, original redesign report and phase-status amendment. Based on the published Tour removal 6a4f9e8. Pending analytics and unrelated local changes excluded; original dirty workspace preserved.

Clean locked install, lint, TypeScript and optimized build passed. Full 385 tests passed: 39 components, 17 identity, 140 integrations, 165 database and 24 PostgreSQL concurrency; no failures/skips. No booking/backend/map/configuration/data changes.

Live Route timeline has the compact horizontal rail at 320/375/390/430/768/1024/1440px. No page-level overflow, five authoritative stops and one iframe at every width. Circles measure 68/71/74/82/84/104/104px. Phone/tablet rail scrolls; desktop fits all five. Four existing CMS photos load through Next image optimization; Start/Stop retains its pre-existing unpublished-image fallback. Some image snapshots during rapid viewport changes precede loading of a new srcset; final desktop and mobile photos are loaded. Keyboard Enter opens saved destination details; Escape closes and restores trigger focus. Existing guide and Show on map actions remain. Neutral live fallback persists while upstream tracking is unavailable; no invented completion history.

Homepage remains its existing discover presentation. Live public HTTP checks: nine main public pages 200, Tour exact GET/HEAD 301 to Route including obsolete query stripping, nine-entry sitemap without Tour, 14-route/160-link crawl with zero failures. Synthetic /dev/stops-preview correctly 404 in production. No reservation, hold, CMS publication, email, database, permission, provider, scheduler or external-map mutation. Upstream GPS accuracy and full-loop completion remain separate work; no physical-device acceptance claimed.

Evidence: /private/tmp/classic-stops-release/{geometry.json,route-mobile.png,route-desktop.png,production-smoke.json,production-crawl.json,pr.json,merge.json}; /private/tmp/classic-stops-{install,check,tests}.log. This post-deployment evidence report is local documentation and not a second deployment.
