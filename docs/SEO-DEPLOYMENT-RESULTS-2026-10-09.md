# Approved SEO deployment results — 9 October 2026

**Deployment status: SUCCESS. Search Console sitemap submission can proceed.**

Owner explicitly authorized the isolated SEO release. Approved patch SHA-256 verified: 92cbdfaef1cade2c71be3b80110244805e7164738d3f98ac3fcd28b3cfef2e3e. Fresh origin/main equalled ffd26dd48a0227bca38969c8aa7433838a137e2e. Created clean release/seo-2026-10-09 worktree from that baseline; applied only the approved 16-file patch, verified exact file set and committed as edbff49a49b5c9e788343148acb4284ac72c94fe.

One necessary test-only portability correction followed: sitemap.test.mjs now uses node:os tmpdir()/node:path join() rather than macOS /private/tmp. Committed as 957e46c; runtime code unchanged, file scope remains exactly the same 16 approved files. This corrective commit is the only deviation from the patch's exact bytes and was disclosed before merging.

PR: https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/3

Production merge commit: **27168ae64b526b2b0a4a627a06bb07ece2029227**.

Vercel Production deployment: **dpl_DbVsqvZp994nNA96Di56fqXt8rPu**.

Dashboard: https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/DbVsqvZp994nNA96Di56fqXt8rPu

Deployment host: sightseeing-shkodra-web-b8z9cg7et-aleksander-marleci.vercel.app. Vercel displayed Ready, Production, Current Domains sightseeingshkodra.app, source main/27168ae. Build duration 28 seconds; completion shown 9 October 2026 20:41:36 Europe/Tirane.

Prior rollback target preserved: dpl_J7qJDwwDETPaUj9uGGnZ7kcAd9Yf, source ffd26dd, host sightseeing-shkodra-web-fetyeug4z-aleksander-marleci.vercel.app. No critical verification failed; no rollback invoked.

## Validation before merge

Clean release worktree: lint, TypeScript and optimized build passed; 138 integration and 31 component tests passed. The portability change was followed by lint/typecheck/build and all 138 integrations again. GitHub Project CI passed, including locked dependency install, lint/types/build, npm test with disposable database/PostgreSQL tests and production dependency audit. Vercel Preview passed at final PR head. Mergeability clean; merged normally using GitHub's PR merge API without bypassing branch protections. GitHub/Vercel Production workflow triggered from main; no alternate CLI deployment.

## Live production acceptance

Read-only HTTP checks using Googlebot user agent and browser inspection:

- /sitemap.xml: HTTP 200 application/xml, parsed XML, exactly ten canonical URLs below.
- Every emitted URL: HTTP 200 without redirect, canonical exactly matches loc, robots index, follow; expected H1 and no Google tag loader in HTML.
- /robots.txt: HTTP 200; Allow /, canonical Sitemap directive; exclusions /admin, /auth/, /api/, /booking/, /dev/, /your-day; no blanket Disallow /.
- Admin, staff sign-in, booking management, photography credits, sample /your-day, unpublished Privacy Policy and Terms: noindex,nofollow. Private pages absent from sitemap; root/explicit private noindex remains intact.
- Homepage renders “Discover Shkodra. Your way.”, no alert. Tour renders published Daily Ticket title and new TouristTrip JSON-LD, no alert. Booking page shows date/passenger/departure controls and progression; no reservation submitted.
- Route page loads the unchanged independent Netlify map with van marker, five stops, next-stop card and interactive map controls. External map reported location update approximately three minutes old and ETA calculating; physical tracking accuracy/fresh ETA was not certified. Parent initially displayed its temporary live-status fallback while iframe loaded; this does not establish an SEO-release regression. No map source/service was changed.
- No Google tag script in inspected homepage/route/browser or any public HTML response. Runtime analytics component/event hooks are absent from the shipped release.

Expected and verified URLs:

1. https://sightseeingshkodra.app/
2. https://sightseeingshkodra.app/tour
3. https://sightseeingshkodra.app/book
4. https://sightseeingshkodra.app/faq
5. https://sightseeingshkodra.app/route
6. https://sightseeingshkodra.app/explore
7. https://sightseeingshkodra.app/explore/bridge
8. https://sightseeingshkodra.app/explore/castle
9. https://sightseeingshkodra.app/explore/centre
10. https://sightseeingshkodra.app/explore/lake

Machine-readable acceptance evidence: /private/tmp/ss-seo-production-results.json.

No production database record/schema operation, booking submission, payment, pricing, email or tracking configuration change. Booking integration verification is read-only UI/rendering plus unchanged code and passing disposable CI business tests; live capacity/confirmation/cancellation and delivery tests were not performed because they would mutate production records or send messages. No production variables changed in this deployment; owner's configured values took effect with the new release.

## Remaining actions

Submit https://sightseeingshkodra.app/sitemap.xml in the existing verified Search Console domain property (or sitemap.xml in the exact HTTPS URL-prefix property). If its prior “Couldn't fetch” remains, run a live fetch/URL inspection and allow Google to retry. Inspect Home, Tour and a guide and request indexing where desired. Actual Google-IP access, Search Console submission/indexing, external rich-results validation and ranking are not claimed.

Analytics remains deferred; legal pages remain unpublished and excluded. These do not block this sitemap release. Review them through their separately authorized tasks.

The original main workspace still contains uncommitted deferred analytics/documentation work and remains at its original local HEAD, while origin/main now includes this approved SEO merge. It was deliberately not reset or pulled over the dirty tree. Clean release worktree remains at the tested release branch. This report and phase update are local evidence only and were not pushed as an additional deployment.
