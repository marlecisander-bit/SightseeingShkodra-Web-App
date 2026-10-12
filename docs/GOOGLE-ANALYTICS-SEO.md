# Google Analytics, Search Console and SEO integration — 9 October 2026

Local implementation only. No commit, push, deployment, Google account change or production mutation performed. Existing booking rules, database and external live map are preserved.

## Audit

The project uses Next.js 16.3.8 App Router. Existing SEO includes CMS-owned page titles/descriptions/social images, absolute canonicals from NEXT_PUBLIC_SITE_URL, gated indexing, dynamic published-content sitemap, robots.txt, destination WebPage/BreadcrumbList JSON-LD, server-rendered editorial content, heading and image-alt components. No GA/GTM installation, analytics events or consent mechanism was found. Private routes inherit root noindex; booking management explicitly sets noindex and no-referrer. /live redirects to /route. Booking is a public acquisition page and was incorrectly disallowed/omitted from sitemap; it is now eligible when a published product exists.

## Implementation and files

- src/modules/analytics/browser.ts: fixed measurement ID G-TYPP062HC7, explicit event allowlist, safe page paths, query/hash/referrer removal, advertising signals disabled, SHA-256 opaque transaction identity, cents-to-currency conversion and persistent event retry protection.
- src/components/public/analytics.tsx: consent controls, optional tag loaded with next/script afterInteractive, manual App Router page views, session-deduplicated ticket views/checkout entry. Decline loads no tag; withdrawal reloads to remove the running tag. Local storage failure fails closed. Consent is browser-specific and settings remain available.
- src/app/(public)/layout.tsx and public.css: production-only integration and responsive consent panel. GA4_ENABLED=true, APP_ENV=production, canonical site URL and non-Preview environment are required. No admin/auth layout tag.
- booking.tsx: dialog checkout entry; checkout-flow.tsx: confirmed reservation purchase, including recovery after response loss/tag readiness; customer-booking.tsx: successful customer cancellation/modification with per-action deduplication. No customer fields, references, management credentials, dates, QR or payment details sent. Purchase measures reservation value payable at meeting point, not collected revenue.
- src/app/layout.tsx: optional GOOGLE_SITE_VERIFICATION content; no invented token.
- robots.ts and modules/content/seo.ts: public /book sitemap eligibility; exclude booking management/development routes. Robots is not an access-control mechanism.
- src/app/(public)/tour/page.tsx and seo.ts: published product TouristTrip, Organization and BreadcrumbList, no invented address, price, rating or offer.
- .env.example: optional verification and disabled-by-default analytics gate.
- tests/components/analytics.test.mjs and tests/integrations/seo.test.mjs: consent/privacy/conversion deduplication, indexable booking expectations and factual schema checks.

No new CMS owner, dependency or migration. Existing CMS metadata remains authoritative. Public content and publication changes feed the existing dynamic sitemap on request; no fabricated last-modified dates.

## Verification

Final lint, TypeScript and optimized build passed. Component tests: 33 passed. Integration tests: 136 passed (including revised sitemap expectations and schema regression). npm test's tsx CLI initially hit sandbox IPC EPERM; equivalent node --import tsx invocations worked. Full database/PostgreSQL suites were not run: no booking/domain/database changes.

Production HTTP inspection through the web tool failed to access homepage, sitemap and robots, so hosted indexability and existing hosted tags are unverified. No live booking was made. No GA DebugView delivery, Google Rich Results Test/Schema.org validator, mobile browser QA, Lighthouse or field Core Web Vitals measurement claimed. Existing responsive design and server-rendered content were inspected in source; no redesign or performance score claim.

## Owner setup before release

1. In Google Analytics, select the web stream for sightseeingshkodra.app. Disable **all Enhanced Measurement** (including history page views, forms and outbound clicks). Manual page views alone cannot suppress these account-side events. This is required to avoid duplicate page views and unintended form/URL collection. Disable unwanted cross-domain measurement/Google signals and review any other connected Google tags.
2. Review/update the published privacy notice to describe optional Google Analytics, consent, reservation-value measurement and retention. No legal content was silently overwritten. Select appropriate retention/account privacy settings. Then configure GA4_ENABLED=true in Vercel Production for the future approved release. Keep it false in Preview/development.
3. Confirm Production NEXT_PUBLIC_SITE_URL=https://sightseeingshkodra.app, APP_ENV=production and SITE_INDEXING_ENABLED=true if indexing is intended. No hosted values were changed here.
4. In Search Console, add sightseeingshkodra.app. Domain verification uses the DNS TXT value Google gives you. Alternatively choose URL-prefix verification and copy only the HTML tag's content value into GOOGLE_SITE_VERIFICATION. No token has been supplied yet.
5. After separately approving deployment, verify the canonical homepage, /tour, /book, /faq, /route, published guides, sitemap.xml and robots.txt. Submit https://sightseeingshkodra.app/sitemap.xml in Search Console and inspect representative URLs.
6. Test decline (no Google requests), allow (one page view per route), navigation, withdrawal and admin exclusion. Use GA DebugView/Realtime with a controlled approved reservation to verify purchase value/currency, refresh/retry deduplication, modification and cancellation. Booking remains functional without analytics consent.
7. Run Google Rich Results Test and Schema.org validator on /tour and a published guide; TouristTrip is not a promise of Google rich-result eligibility. Run mobile Lighthouse/PageSpeed and inspect field metrics when traffic is sufficient.

References: [Google page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [SPA measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [consent modes](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Limits

Client analytics is best-effort: consent rejection, blockers, cleared storage, different browsers/devices or lost requests affect totals. Persisted deduplication prevents normal same-browser refresh/retry duplication; it cannot guarantee global exactly-once delivery. GA transaction IDs additionally deduplicate purchases. Events rejected without consent are not replayed, apart from the current confirmed booking displayed after tag readiness. Customer management events are tracked only from acknowledged successful actions; staff admin activity is excluded. Privacy controls do not replace account-side Enhanced Measurement configuration. Public page titles sent to GA are deliberately generic to avoid leaking CMS or utility details; canonical path differentiates pages.

Status: local implementation verified; Google configuration, privacy notice, external schema/browser/performance validation and production acceptance remain pending. No roadmap architecture deviation; this user request authorizes the scoped SEO/analytics extension, not launch.

9 October follow-up: direct read-only production HTTP checks now succeeded after the earlier web-tool limitation. Sitemap returns 200 but contains zero URLs; robots blocks all paths without a Sitemap reference, and six checked public pages are noindex. The production indexing gate is closed; prior local changes remain unpublished. Added explicit Vercel Preview/Development indexing denial. See SITEMAP-PRODUCTION-AUDIT-2026-10-09.md for evidence and the narrow release/configuration requirements. Production remains unchanged.
