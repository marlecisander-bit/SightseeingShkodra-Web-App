# Focused mobile performance release — 16 November 2026

Owner authorizes a PR, merge and Production deployment after validation. Baseline main is `56653a558628463f9e3c4ab92a1b601877db49f9`; last-good Vercel Production is `7oeTGWvWxeMKjqzSfioga33zmYdf`. Preserve SEO/CMS/redirects/mobile, independent map, booking and protected flows. No CMS migration, data, DNS, Search Console or hosting setting changes.

## Fresh Production measurements

Three sequential cold Lighthouse13.6.0 CLI runs on the same Mac/Chrome, against https://www.sightseeingshkodra.com/, default mobile Moto G Power412×823/DPR1.75, simulated Slow4G150ms RTT/1638.4Kbps and4×CPU, fresh headless Chrome per run. No real booking, payment or notification. These are local lab tests **of Production**, not measurements of a local site. Compare only with matching post-release runs, not historical PSI numbers or separately throttled DevTools traces.

| Metric | Before median | Before range |
| --- | --- | --- |
| Performance |94|94–98|
| FCP |0.933s|0.932–1.283s|
| LCP |2.807s|2.053–2.813s|
| TBT |6ms|0.5–18ms|
| CLS |0|0–0|
| Speed Index |3.598s|3.397–4.026s|

Raw reports, devtools logs and filmstrip frames remain local under docs/evidence/mobile-performance-20261116. Committed baseline-summary.json/medians contain reproducible metrics. Historical PSI URL could not be retrieved by the web reader; provided historical values are not claimed as a new baseline.

## Bottlenecks and smallest changes

Current LCP is the mobile **background** image (be5c37e0), not the card van image. It is server-rendered in a picture with matching mobile/desktop hints, eager loading and high fetch priority already present. Baseline Lighthouse actual request breakdown: TTFB145ms, resource-load delay2049ms, transfer80ms, render27ms. Initiator is the HTML document; hydration/carousel code does not assign its URL. No duplicate hero candidate request observed. Three independently throttled DevTools traces390×844/DPR3,4×CPU/Slow4G show LCP6.452/6.300/6.335s and load delay1773/1721/1677ms, with large download contention; these are distinct from Lighthouse simulated metrics.

The page called preload before awaiting ancillary reads but did not return its render tree until all completed. HomepageStream now registers the same mutually exclusive responsive hints and renders a Suspense boundary around those reads, allowing the hints to flush while they are pending. A viewport-sized accessible loading surface keeps the footer below the fold. Server content, metadata and Organization markup remain server-rendered. The regression test holds ancillary data unresolved and checks hints are present before it resolves. No extra carousel hints, candidate/quality changes, animation changes or CMS caching added.

Blocking CSS included admin notification/workspace and dev fixture rules inside public shared chunks. Source mapping is visible through module selectors (reviewMarker, bell/center) from admin/dev CSS, alongside public.css and public component modules. Baseline CSS transfer is about58KiB, with37,744bytes unused at initial view. The documented Next16.4.2 Turbopack `experimental.cssChunking: 'graph'` isolates unrelated route styles without deleting rules. Local compiled homepage imports fall from about278KiB raw/four chunks to about140KiB/nine chunks, with admin/dev markers absent. More requests are the tradeoff; post-release measurements are a gate. No style declarations or ordering dependencies were intentionally changed. Desktop/admin route smoke checks remain necessary because chunking is application-wide.

Homepage background map already initializes on approach/scroll with an existing placeholder and reserved layout. Initial baseline has no map iframe, Leaflet, Supabase-client or tile request. Preserve that implementation and direct Route-page behavior. CheckoutFlow is already dynamically imported; initial unused JS is mostly the shared framework bundle (~25KiB). No compatibility/runtime changes or speculative JS rewrite are warranted. Filmstrip shows a blank interval then the complete hero by2625ms in run1; current Speed Index is3.60s rather than the historical5.4s. Hero/product motion is already disabled; retain it.

## Gates and release order

1. Local production build, lint/types, full test suite, streaming regression and compact/tall/desktop layout review. Raw `npm run lint` encounters the pre-existing untracked seo-audit/resources.mjs unused-variable warning; exclude only that unrelated local script for workspace lint. Exact PR CI must run unmodified repository checks and pass.
2. Verify current main still equals baseline, inspect the complete scoped diff. Push only perf/mobile-loading-20261116 with Vercel Git deployments disabled in vercel.json for this branch. No Preview environment is assumed or created. Keep the existing SEO review-branch suppression.
3. Require exact integrated-head CI, merge, then require merged-main CI and successful Production deployment with matching SHA. No CMS action.
4. Repeat three identical Lighthouse runs on Production, compare medians/ranges, raw request delay, CSS and image request counts. Verify homepage/mobile/desktop/menu/carousel/amenities/booking entry, direct Route map activation and preserved SEO/redirect/protected HTTP probes. Do not submit a booking/payment or test notification.
5. Record receipts and only declare success after live gates pass. Physical Safari toolbar behavior remains unverified without a physical device. Delayed GPS and existing cross-origin map warning are independent limitations, not a performance success claim.

## Scoped rollback

If deployed checks show a material performance or functional regression, restore only this release's source changes to baseline56653a5 through a reviewed revert and normal main deployment, or promote the recorded last-good deployment for immediate containment. That baseline already contains the mobile and SEO releases. Verify SHA/redirects/booking/maps after rollback. Do not restore the older mobile-only/pre-SEO baseline, revert CMS fields, change aliases/DNS, run migrations or touch Search Console. No rollback is indicated before live evidence is reviewed.

Completed release receipts and post-release measurements will be appended after the gates pass; this preparation record does not claim a deployed improvement.

## Release attempt failed acceptance — rolled back

PR93 merged9e96137cbd42bc0ec9135ae1050e5221a6a4ed89 after exact-head CI43902882963 passed. Merged-main CI43903925144 passed. Vercel3RAACKhQvr9npnc7D8b5QgTT9FYH / GitHub7829331028 deployed successfully at https://sightseeing-shkodra-web-c86oxfy62-aleksander-marleci.vercel.app . Deployment success did not establish acceptance.

Three matching Production runs gave medians: performance95(range93–96),FCP1.197s(1.163–1.277),LCP2.611s(2.581–2.773),TBT4.5ms(2.5–24.76),CLS0,SI3.620s(3.145–4.643). Hero request delay median918ms(737–1765), versus2049ms before. Only one matched hero image request occurs. First-party CSS transfer fell to about44KiB, but total CSS rose to about72KiB/25requests because the independent map initialized before scrolling. All three after reports include68map/Leaflet-related requests, versus zero before. FCP worsened28%; LCP improved7%; SI was broadly unchanged with worse variability. This is **not an accepted improvement**.

Observed cause: streamed server content temporarily lives in React's hidden Suspense container. Its #route target has zero dimensions/top0; the existing observer treats this as already approached. The guard was correct for the prior visible tree but not this rendering lifecycle. A future correction must explicitly reject hidden/zero-sized targets, prove no initial map requests and retest approach/scroll activation. Do not change GPS rules or the companion service. Do not assume fewer CSS bytes alone prove better rendering.

Vercel Instant Rollback restored **7oeTGWvWxeMKjqzSfioga33zmYdf /56653a558628463f9e3c4ab92a1b601877db49f9**. Dashboard confirmed all four existing domains assigned to that deployment. No CMS, DNS, Search Console, independent map or environment-variable changes. Fresh public homepage shows the original four stylesheets, zero initial iframe, preferred canonical and no horizontal overflow. Full SEO/protected-flow probes are repeated and retained locally. Vercel automatically pauses Production promotion while Instant Rollback is active; leave this safety hold until a separately validated corrected release is ready.

The scoped source rollback restores next.config/page to the SEO baseline and removes HomepageStream plus its test. Historical measurements and this failed-attempt record remain. A rollback branch has Git Preview deployment suppressed; no new infrastructure/environment. Stop at the failed release gate rather than attempting another optimization release. Overall performance task status: **NO-GO / incomplete; Production safely restored.**
