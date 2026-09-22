# Phase 6 audit: independent tracking embed

2026-09-22. **PASS for the approved local website-embed scope.** This is not certification of the independent tracking backend, device or production uptime. The user superseded shared database/admin development with an independently maintained public map embedded in this website; see DECISIONS.md.

| Requirement | Result | Evidence |
| --- | --- | --- |
| One tracking source for public pages | PASS | Homepage, tour, live and companion pages import `components/public/live-map-embed.tsx`, with one fixed hosted project URL. No public imports of `readPositions`, `SharedMap` or the experimental source adapter. |
| No duplicate GPS writes or processing | PASS for this site | Embed component only renders the hosted page and remounts it on user request. It creates no database client, writes, timers or ETA calculations. Existing prototype modules are limited to development/tests and are not the connected map. |
| Consistent connected-map presentation | PASS | All four HTTP routes returned 200 with exactly one correctly addressed, titled, lazy iframe; no obsolete unconnected/coming-soon map copy. FAQ and route links were verified in the preceding site-wide connection check. |
| Recovery and accessibility | PASS for tested controls | Chrome keyboard activation of Reload map remounted the iframe; hosted stop/route controls returned. Direct-open link resolves to the same project, with new-tab isolation. Descriptive iframe title retained. |
| Responsive host layout | PASS for tested viewport | Companion page at 390px: iframe width 331px, no horizontal document overflow. Viewport restored after test. Desktop/public and narrow map rendering were also checked during embed implementation. |
| Independent admin retained | NOT APPLICABLE to merge | User explicitly kept original admin. No database/authentication merge, device changes or external deployment performed. |
| GPS/ETA and tile reliability | EXTERNAL / NOT CERTIFIED | Hosted UI showed route updating with ETA withheld. Previous inspection saw tiles recover, but the intermittent grey-background cause remains unconfirmed. Parent cannot diagnose cross-origin map internals. |
| Published-map propagation | EXTERNAL / NOT EXERCISED | Existing app owns refresh. No production map was republished for this audit. |

## Checks run

Full automated suite: **139 passed, 0 failed** (15 identity, 32 integration, 74 database, 18 native PostgreSQL). Lint, TypeScript checks and isolated production build passed. Isolated build output avoids the existing Windows cleanup problem in the default output folder. HTTP placement checks and read-only Chrome checks are described above. No booking was submitted and no user geolocation permission was requested.

No implementation defect was confirmed within the website embed during this audit. Corrected the tracking-module README to identify its old reader as inactive experimental work. User edits to AGENTS.md and root README.md remain untouched.

## Remaining work and next phase

Proceed to Phase 7B site validation, starting locally; staging-specific results require a staging deployment. Phase 7A legacy URL migration remains excluded. Before launch, complete real tour content/prices/departures, decide live notification activation, and perform readiness/security/backup/rollback checks.

Record for Phase 7B: `/your-day` is explicitly a sample, but its QR placeholder still says "after confirmed payment" despite the pay-at-meeting-point amendment. Correct that wording during the site content/booking-flow review; no real ticket behavior is inferred from this placeholder.

`checkpoint-phase-6-live-map` marks this local embed acceptance only. The original roadmap remains unchanged; deeper tracking integration and full upstream regression are superseded/outside scope, not silently claimed complete.
