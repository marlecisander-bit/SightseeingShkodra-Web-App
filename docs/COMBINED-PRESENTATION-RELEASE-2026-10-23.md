# Combined presentation release — 23 October 2026

Owner authorized publishing all unpublished changes. Candidate assembled in `/private/tmp/shkodra-combined-release-20261023` from actual production main `7c7f15c71ccac2122aba972ac940c5b73254a73a`. Original dirty IDE workspace preserved; stale already-published copies were not republished.

## Release contents

- Compact customer booking confirmation ticket, canonical QR and secure management link, owner-approved 10-minute arrival instruction. New customer-created envelope marker preserves historical retry bodies and other email variants.
- CMS-bound responsive hero typography with white/yellow/white hierarchy and headline underline; original photograph/focal configuration retained.
- Admin notification bell, unread badge and compact five-item dropdown, reusing existing scoped API, persisted read state and realtime subscription.
- Compact mobile booking card with authoritative starting fare, side-by-side selectors, existing category controls and single booking CTA. Mobile price underline removed per final owner instruction; headline underline retained.

No database migration, production data deletion, sender/DNS/configuration change or scheduler activation is part of this release. Existing communications infrastructure remains unchanged. Publication of the customer template means future eligible automatic customer confirmations use the new presentation; no email was manually sent for validation.

## Validation before publication

Clean offline install; lint, TypeScript, production build and all 510 tests passed (components 105, identity 23, integrations 167, database 182, PostgreSQL 26, CMS 7). Production dependency audit: zero vulnerabilities. Combined local preview checked at 320/360/375/390/430/768/1024/1440px without overflow. Mobile card approximately 229px, mobile price pseudo-element absent; desktop arrangement retained. Screenshots: `/private/tmp/combined-mobile.png` and `/private/tmp/combined-desktop.png`.

Original scoped reports remain historical local implementation evidence; this report records their combined release. English-only booking labels, native date picker lacking availability colors, and native email/device/screen-reader acceptance limits remain documented in those reports. Local validation uses synthetic data, never production booking writes or live email tests.

## Publication

Remote CI, pull request, merge revision, Vercel outcome and live read-only acceptance are recorded in the post-release update. Rollback application reference: existing Ready production deployment `H3upXGd26EDFWVPqkymLW5aRz2oo` at `7c7f15c`. Rollback must retain current database/configuration and existing sender secrets.
