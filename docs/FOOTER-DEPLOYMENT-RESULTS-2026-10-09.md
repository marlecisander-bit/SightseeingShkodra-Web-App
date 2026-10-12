# Footer deployment results — 9 October 2026

**Published successfully at https://sightseeingshkodra.app.** The owner explicitly approved publishing the footer refinement.

## Release and scope

Isolated release worktree: `/private/tmp/sightseeing-footer-approved-release`, based on production main `27168ae64b526b2b0a4a627a06bb07ece2029227`. Original dirty workspace preserved; unrelated analytics and deferred work excluded.

- [PR #4](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/4), footer component/CSS and CMS visibility assertion. Release commit `6ca801ea7086f5dcc76651c5c2138f6d454b6444`; production merge `3a81b6959ba953ff2f99f780c626342c1450b7e1`.
- [PR #5](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/5), one CSS rule correction after live validation exposed legal-link wrapping at 768 px with a classic vertical scrollbar. Tablet legal text now uses the existing mobile 12 px size and 12 px gap; 44 px targets remain. Release commit `c019f0cfa02f94feb1cbc224948e7f7459c6ea94`; final production merge **`9a50a5371b9ae3cc88ffc93c075a8852770f43d3`**.

Combined published diff: exactly `src/components/public/ui.tsx`, `src/app/(public)/public.css`, `tests/components/cms-visibility.test.mjs`. The test now asserts one persistent footer, VAT and both legal destinations instead of a removed layout-wrapper class. Existing CMS publication assertions remain.

Final Vercel deployment **`dpl_2dVe4sSWjxobGqPA53ioCAEQwDeq`**, Ready, Production, main/9a50a53, current canonical domain confirmed in the authenticated dashboard. [Deployment details](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/2dVe4sSWjxobGqPA53ioCAEQwDeq). Host: `sightseeing-shkodra-web-f0ohbz3k2-aleksander-marleci.vercel.app`.

Preserved rollback targets: pre-footer `dpl_DbVsqvZp994nNA96Di56fqXt8rPu` / 27168ae, plus first footer deployment `dpl_EKLZkwecgGpqNgdyHj2R38zLRKLa` / 3a81b69. No rollback invoked.

## Checks and actual outcomes

Clean install, lint, typecheck and optimized build passed. Full local suite: **375 passed, zero failures/skips** (31 components, 17 identity, 138 integrations, 165 database, 24 PostgreSQL). Initial full-suite failure was an outdated `p-footer-info` assertion, corrected before release. Sandbox test IPC denial resolved by running the existing suite with permission for local sockets. Both PRs passed complete GitHub Project CI, including install/check/full tests/production dependency audit, and Vercel Preview. The correction also passed local check and eight focused footer/CMS tests; its five-icon scrollbar fixture measured 133.7 px at 768 px viewport / 753 px usable width.

Final live browser matrix: **128 checks** covering 16 route contexts and 320, 375, 390, 430, 768, 1024, 1440, 1920 px. Every completed public render had one footer, no horizontal scrolling and minimum 44 px target height. Height: **138 px at mobile widths; 133.7 px at tablet/desktop widths**, including pages with classic scrollbars. Routes: Home, Tour, Book, FAQ, Route, Explore, four published guides, Privacy Policy, Terms, Credits, Your Day, booking management and `/live` redirect.

Read-only HTTP checks: fifteen public page destinations return 200 with the refined footer; `/admin` returns 200, and the authenticated browser reaches the existing workspace chooser. `/live` retains 308 redirect. Sitemap XML remains valid with ten URLs; robots remains Allow / with private exclusions and canonical Sitemap reference. Exact footer href list matches the pre-release baseline.

All six footer assets load. Keyboard focus retains a 3 px yellow ring. WhatsApp does not intersect the footer at four mobile widths; on the homepage ending it docks 12 px above it. No bookings, CMS edits, authentication changes, database/schema operations, configuration changes, delivery activation or external-map changes were performed.

## Evidence and limits

- [Published desktop screenshot](/private/tmp/shkodra-footer-refinement/production-after-desktop.jpg)
- [Published mobile screenshot](/private/tmp/shkodra-footer-refinement/production-after-mobile.jpg)
- Raw browser matrix: `/private/tmp/shkodra-footer-refinement/production-routes-final.json`.
- HTTP, link, docking and release logs: `/private/tmp/shkodra-footer-refinement/`.

Local missing-CMS/staff-503 limits from the earlier implementation report are superseded for the read-only production checks above. Instagram, Facebook and Google destinations return HTTP 200; GetYourGuide and Tripadvisor return 403 to automated HTTP requests, so their full third-party interactive acceptance is not certified. URLs were preserved exactly. Legal content remains governed by existing publication settings. Physical-device Safari/Android, CMS save/publish mutations and live booking/delivery tests were not part of this footer deployment. Longer text, larger accessibility text and safe-area insets can increase footer height without clipping.

This report and phase evidence are local documentation, not another production release. The original main workspace was neither reset nor pulled over its unrelated changes.
