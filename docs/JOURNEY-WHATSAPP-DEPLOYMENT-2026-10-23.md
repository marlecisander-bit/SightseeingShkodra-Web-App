# Journey and WhatsApp published — 23 October 2026

Published successfully through the existing GitHub → Vercel integration following explicit owner approval, including the Next.js security prerequisite.

- PR: https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/23
- Release branch head: `041d89088427e5c5442fd507eb61bbad477cc532`
- Production merge: `3bec2f68bf0bf82b992a3b894d5c8010a0fea185`
- Vercel deployment: `3BZpHUdyhLXtLqDSPybhirPS6tht`, completed successfully.
- Production deployment URL: https://sightseeing-shkodra-web-ar10mwew7-aleksander-marleci.vercel.app
- Live domain verified: https://sightseeingshkodra.app/route
- Previous successful production retained as rollback reference: https://sightseeing-shkodra-web-e60yd13ep-aleksander-marleci.vercel.app (source `5041261`). No rollback invoked.

## Scope

Route status/progression, desktop/mobile photographic timeline and CMS destination cards; exact original transparent tracking-app van asset; Admin → Website → Route stops using canonical destination records; fixed viewport WhatsApp positioning and footer/sticky-booking clearance. Explicitly approved Next.js/eslint-config-next 16.4.2 and lockfile security update. Newer remote CMS completion, admin task menus, association guidance and action styling were preserved when preparing this release from current remote main.

The original dirty working tree was preserved. Release assembled in `/private/tmp/shkodra-journey-release-20261023`; unrelated old local differences were not published. No database migration, hosted CMS write, booking submission, GPS/map application change, cloud configuration change, communications change or sent message.

## Validation

Lint, TypeScript, optimized build and all 461 tests passed in the release checkout, including the newer production CMS verification suite. PR GitHub CI passed its build/test/security steps before merge. Production dependency audit reports zero vulnerabilities. Vercel preview was skipped by the existing ignored-build step; no preview setting was changed. Vercel main Production built successfully after merge.

Live read-only HTTP checks returned 200 for Home, Route, Explore, Book, FAQ, Your day, Privacy and Terms. Route contains the new status panel and five operational stops. Original van SVG returned 200 and SHA-256 `888f450c3f4360fa93112770e4d36e174d7942e0de1d501e57016eb6be525dd2`, identical to the tracking app asset.

The protected Route stops URL returns a streamed Next.js sign-in redirect for an unauthenticated request (HTTP 200 stream with NEXT_REDIRECT and meta refresh); no stop editor is exposed. A raw HTTP status alone was not treated as authorization evidence. Authenticated admin save/upload was not performed.

Live browser checks: authoritative current/next state rendered from the unchanged iframe; all five CMS/operational destination nodes rendered; Castle selection showed its actual published photo/description; Next stop changed selected destination to Historic Centre without changing the live journey state. Show on map opened the iframe popup for Stop 4 / St Stephen’s Cathedral, confirming the existing selection API works. Existing 09:00/11:00/13:00/15:00 schedule loaded after hydration. No ETA was fabricated while the van was at its starting stop. Missing Start/Stop editorial photo remains a pre-existing content gap, now editable via the new panel.

At 320/375/390/430/768/1024/1440px: no page overflow, five stop nodes, loaded original van images with transparent/borderless wrappers, exactly one WhatsApp link, fixed positioning, 16px mobile and 24px desktop bottom/right offsets. The real WhatsApp href matched the pre-release destination exactly. No conversation message or external app handoff was performed.

DOM/layout measurements are retained in `docs/review/production-2026-10-23/`. Live browser screenshot capture repeatedly timed out, including its documented accessibility screenshot alternative. No live screenshot is claimed; earlier local fixture screenshots remain labeled as such. Physical-device GPS transitions, safe-area hardware and real admin upload/publication are not newly certified.
