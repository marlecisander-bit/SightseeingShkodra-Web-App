# Journey, Route stops and WhatsApp release candidate — 23 October 2026

Publication authorized for the session UI changes. Candidate assembled at `/private/tmp/shkodra-journey-release-20261023` from remote main `5041261e11afddf278a620e47c3976796c9a7648`. The original dirty workspace is preserved. Current successful production deployment before this candidate: `https://sightseeing-shkodra-web-e60yd13ep-aleksander-marleci.vercel.app` (GitHub deployment 7120687692). Existing main-to-Vercel Git integration remains the release path.

Included UI: Route-only live status, desktop/mobile stop timeline, CMS destination preview, exact tracking-app van SVG with transparent wrappers, dedicated Route stops admin entry using canonical destination records and existing save/upload actions, and fixed WhatsApp positioning with sticky-booking/footer clearance. Live-map source/bridge, GPS processing, booking rules, credentials, infrastructure, communications flags and database schema/data remain untouched.

Newer remote CMS completion and admin navigation were retained. The Route stops item is added to the current Website task group rather than replacing the current admin shell. Current destination association guidance and primary/secondary action styling are retained. A release regression exposed six CMS WhatsApp server-render probes returning no anchor after the new body portal; the component now retains its configured anchor in server HTML and moves it to the body after hydration. No duplicate instance is created.

## Additional security prerequisite — approval pending

The unchanged production Next.js 16.3.8 dependency fails the existing `npm audit --omit=dev --audit-level=low` release gate with critical advisories. Reviewed upstream advisories report fixed Next.js versions starting at 16.4.1:

- https://github.com/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/advisories/GHSA-p3m5-59mp-jv5r
- https://github.com/advisories/GHSA-673q-mjm6-r5xr

Prepared candidate pins Next.js and eslint-config-next to 16.4.2 with their lockfile updates, the registry-reported fixed release. This is a framework dependency change beyond the original UI edits. Production publication of this additional change requires owner approval; no push or merge has occurred. The candidate production dependency audit reports zero vulnerabilities. Development-only advisories remain outside the existing production audit gate; no forced unrelated dependency upgrades or gate bypasses were introduced.

Validation complete: lint/typecheck/optimized build passed; all 461 tests passed (79 component, 23 identity, 145 integration, 182 database/domain, 25 local PostgreSQL concurrency, seven CMS verification). Production dependency audit: zero vulnerabilities. Git diff whitespace check passed. Hosted Preview remains a credential-free shell unless an isolated backend is configured; no production credentials are copied into it. No migrations or hosted writes are part of this candidate.
