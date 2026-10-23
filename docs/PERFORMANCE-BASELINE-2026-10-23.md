# Performance baseline — 23 October 2026

Baseline before application changes. Source: production main cd17d901b315f4785e9497ceee9b2a1a4004bff4; isolated local checkout `/private/tmp/shkodra-performance-20261023`. No deployment authorized.

## Conditions and coverage

Read-only source/build analysis, isolated-profile Lighthouse 13.5.0, public HTTP timings from this Mac, and existing authenticated Chrome UI navigation. Browser wall timings include automation round trips and 100ms readiness sampling; they are single observations, not field percentiles. Browser cache was not cleared for authenticated admin. Cold HTTP means first observed request, not proven cold Vercel/Supabase caches. No private response bodies, names, addresses or booking credentials are exported.

Lighthouse mobile uses simulated 150ms RTT/1638.4kbps and 4x CPU slowdown, 412×823px emulation, temporary profile, no customer account. FAQ result:
- first-contentful-paint: 1222.402
- largest-contentful-paint: 1222.402
- cumulative-layout-shift: 0
- total-blocking-time: 0
- server-response-time: 34
- total-byte-weight: 281013
- Network requests: 36; script transfer bytes: 179104; image transfer bytes: 28538

INP/p75 and server-side database query durations were not collected. TBT is a lab diagnostic, not INP. No performance-target claim is made.

## Public HTTP baseline

Three sequential urllib samples per route, fresh HTTP connections; TTFB includes network/TLS/headers, unlike Lighthouse server-response diagnostic. Values are milliseconds:

/route: 1991.8, 1547.4, 5498.7

/explore: 750.8, 543.3, 686.7

/faq: 662.2, 716.0, 557.7

/book: 500.6, 819.2, 842.0

Safety correction: initial /route probes were made before tracing getDayPlanner → getHomepage → read_availability_v1 → ensure_schedule_date_v1. This GET can materialize dated departures; probing stopped after discovery. No booking, checkout or direct database mutation was submitted, but zero incidental departure writes cannot be asserted. Homepage, route/live operational polling and reservations are excluded from further live profiling. /book measurements above are HTML-only, without executing checkout JavaScript.

## Authenticated admin visible-panel baseline

No admin forms were submitted. Calendar was opened without a date query to avoid departure preparation. These labels share existing routes: Calendar, Prices and Schedule use /departures; Page Editor and Business Settings use /content. Reservations is excluded because BookingsPanel invokes prepareServiceDate. These are first observed full-page goto → h1/h2 visible timings, not browser rendering milestones:
- overview: 960ms
- departures: 1005ms
- content: 1705ms
- route-stops: 877ms
- reviews: 600ms
- partners: 1203ms
- email: 674ms

Warm sidebar Overview → Route stops (actual click): 1336ms until destination heading. Existing links are ordinary anchors; mobile task-menu completion uses location.assign. Both recreate the page and notification provider. This is the highest-confidence navigation bottleneck.

## Build and query evidence

The single dynamic /admin/[operatorId]/[section] route statically imports every panel. Its client-reference manifest includes 8 unique chunks / 466,155 raw bytes / 134,633 gzip bytes and 29 client modules, regardless of section. This is referenced-chunk accounting, not total wire bytes or parsed JS. Public homepage: 6 chunks / 124,723 raw / 42,815 gzip; FAQ: 5 / 98,481 raw / 34,048 gzip. Existing versioned build artifacts were used before modifications.

Each requirePermission creates a session client, verifies the user and reads membership. Page guards and nested withOperatorService callers repeat these reads; CMS does multiple such calls plus avoidable sequential rounds. Actual database execution time is unavailable without production instrumentation; no SQL profiling or index changes are authorized.

The published website and public reviews already use request-local React cache. There is no reason to add persistent booking caches. Hero has responsive next/image sources and eager high priority, below-fold images already lazy-load, homepage map mounts only on explicit disclosure, and the independent tracker cadence must remain unchanged. Public first-render bundle still includes map iframe controls even while disclosure is closed.

## Prioritized changes supported by evidence

1. Client navigation plus a persistent workspace shell and panel-only loading states; preserve all per-page/action permission checks.
2. Split admin route entrypoints so Overview does not reference every editor/calendar client module.
3. Request-local verified identity/membership reuse; preserve per-call permission policy and no persistent/private cross-account cache.
4. Parallelize independent CMS reads and deduplicate identical map-stop reads within one request.
5. Defer closed homepage map controls; consider image changes only after the pending Explore audit, preserving hero quality/crop.
