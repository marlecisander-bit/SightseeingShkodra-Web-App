# Phase 4E: published Explore guides and SEO

Implemented and verified on 2026-09-22. Local/development delivery only.

Explore now links published CMS guide slots to `/explore/centre`, `/explore/castle`, `/explore/lake`, and `/explore/bridge`. Each page uses its published title, plain-text body and metadata alongside the established local destination photograph. Draft, missing and withdrawn guides return 404; provider failures remain errors instead of falsely reporting missing content. Unpublished cards remain inspiration previews without guide links. No legacy content was imported.

Home, tour and guide metadata use the configured site origin for canonical URLs. Search indexing requires all three settings: production APP_ENV, explicit SITE_INDEXING_ENABLED=true and a valid HTTPS origin excluding localhost. The new setting defaults to false in `.env.example`; local secrets and deployment settings were not changed. Local robots disallows crawling and the sitemap is empty. Production sitemap entries derive from published content on each request and exclude booking, auth and admin routes. Robots is crawler guidance, not access control.

Guide structured data contains only WebPage and BreadcrumbList facts visible on the page. JSON serialization escapes less-than signs; CMS text remains plain text. No offers, reviews, authors or opening hours are invented.

## Verification

- Lint and typecheck passed; all 20 integration tests passed.
- Production build passed using the isolated ignored `private/build-phase-4e` output. Temporary build configuration was restored. The previously recorded OneDrive/default `.next` cleanup problem remains unresolved; its artifact was left untouched.
- `scripts/verify-public-seo.mjs` passed against the development Supabase project and an isolated loopback server. Checks covered published HTML, canonical metadata, safe structured data, draft and cross-operator isolation, robots/sitemap output, unknown routes and immediate withdrawal after archiving.
- The loopback test simulated production metadata settings with `https://seo.example.invalid`; no public deployment or DNS change occurred.
- Chrome rendered the published guide and literal script-like body text. Full desktop/mobile visual acceptance remains part of Phase 4F.
- Exact temporary content/operator fixtures were removed. No owner content was changed.
- Final localhost checks: `/explore` 200, unpublished `/explore/castle` 404, robots `Disallow: /`, and sitemap with zero locations.

## Remaining

The owner must enter and publish real guide/product content. Guide reads currently reuse the homepage projection, including its quote lookup when a product exists; performance should be considered during Phase 4F. Full public QA, accessibility/performance review and the Phase 4 checkpoint remain pending. Next scope: Phase 4F, not payments or production deployment.
