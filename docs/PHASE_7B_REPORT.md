# Phase 7B — local site validation

Date: 2026-09-23. Result: local checks PASS; staging acceptance PENDING.

Scope follows Roadmap V4 and the fresh-project, independent-map and pay-at-meeting-point amendments. No legacy URL migration, external deployment, database changes or messages sent.

## Changes

- Corrected `/your-day` sample ticket text: payment is due at the meeting point. Removed the unsupported promise that a real QR ticket appears after payment. The page remains explicitly a sample, not a valid ticket.
- Added `scripts/validate-local-site.mjs`, a read-only HTTP crawl for the local server at `http://127.0.0.1:3000`. Run with `node scripts/validate-local-site.mjs` while the app is running. It checks public linked pages and anchors, titles, local noindex, duplicate canonicals, JSON-LD syntax when present, robots, empty local sitemap and unknown-page 404. Auth/admin/API/dev and external URLs are excluded.

## Verification

- Seven public pages returned 200: `/`, `/tour`, `/explore`, `/live`, `/your-day`, `/credits`, `/book`.
- 141 internal link occurrences resolved, including fragment targets; zero crawl failures.
- All seven pages had titles and noindex. No duplicate canonical tags. No JSON-LD was rendered in this empty-catalog crawl, so this is not a published structured-data validation.
- Local robots disallows crawling; sitemap returned 200 with no URLs; an unknown page returned 404.
- 32 integration tests passed, including existing SEO gates and published-path coverage.
- Lint and TypeScript checks passed. No new production build or browser visual audit was run for this text-and-audit-script change; the preceding Phase 6 build evidence remains in PHASE_6_AUDIT.md.

## Remaining acceptance

Phase 7B is not fully complete. No staging deployment is linked. Repeat validation against staging with approved published products, guides, images, prices and departures; verify canonical domain, metadata and structured data for that content. The local script deliberately expects noindex and an empty sitemap and is not a production crawl tool. External links, asset loading, rendered interaction, physical devices and live booking submission are not covered by this crawl.

Owner content entry, complete admin acceptance, live notification delivery and upstream tracking reliability remain subject to the existing phase reports. No launch-readiness or cutover claim is made. The next Phase 7B acceptance step is staging validation once a deployment and approved content are available.
