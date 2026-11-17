# Next.js security patch and description publication — 17 November 2026

Owner explicitly approved Next.js16.4.2→16.4.6, validation and publication of the already merged justified product-card descriptions. Base main91b345b contains PR95 and the scoped performance rollback. The rejected Suspense/graph-CSS changes are excluded.

Update next and eslint-config-next to exact16.4.6, with matching @next/env, SWC platform packages and ESLint plugin in the lockfile. No unrelated dependency versions change. This resolves the Production npm-audit failure for GHSA-mfr8-8qww-v76h (upstream minimum patch16.4.5). No affected use-cache/unstable_cache pattern was found, but the audit gate is retained. Local Production audit reports zero vulnerabilities. No React/Node major change, feature rewrite, CMS/data/migration, pricing, inventory, booking, map-service, DNS or Search Console change.

Release gates: local full tests, lint/types/build/audit; mobile/desktop descriptions and layout; exact-head CI and merged-tree comparison; merged-main CI; successful matching Vercel build. The feature branch security/next-patch-20261117 has Git deployments suppressed because there is no assumed isolated Preview environment. After all gates pass, explicitly promote the validated patched deployment in Vercel, which removes the prior Instant Rollback hold. Do not promote the unpatched PR95 deployment.

Live acceptance: preferred homepage descriptions compute text-align:justify at375/430/1440px without page overflow; keep carousel/menu/amenities/booking entry functional without submitting a booking/payment; no initial offscreen map frame, direct Route map activation preserved; canonicals/seasonal copy/sitemap/public redirects and protected routes pass existing read-only probes. Inspect signed-in admin read-only if available. Physical Safari toolbar behavior and real payment/notification tests remain outside this release.

Last-good active Production before promotion is7oeTGWvWxeMKjqzSfioga33zmYdf/56653a5. For a material functional regression, use scoped Vercel rollback and code rollback of this patch only; preserve published SEO/CMS/mobile and do not reintroduce rejected performance code. The old deployment is an emergency containment target using the previously installed Next version, not a security-patched long-term destination. Retain publication evidence and resolve a failed gate rather than bypass it.

Actual CI/deployment/live receipts are recorded after completion under docs/evidence/next-security-20261117. This preparation record does not claim publication.
