# Homepage journey source repair — 4 November 2026

Local branch: `work/homepage-journey-20261104`, based on published main `39bbf5bfedf30401788edc3af115d9fe339edd30`. No commit, push, deployment, migration, DNS or companion change. Existing unrelated local edits remain present.

## Exact cause

`e16802fa6692394b84c000277d6ce93d095470be` (30 October, “Remove homepage live service section”, PR #38) removed the Live Service section from `HomepageView`, including its sole `HomepageMapDisclosure` mount. That component owned the iframe and forwarded its validated `shkodra:journey` messages into `HomepageJourneyProvider.receive`. The provider and its status consumer survived, but the provider only initialized `{journey:null,stale:false}`; it acquired nothing by itself. A direct homepage load therefore had no iframe or journey producer. `/route` independently owns its working `LiveMapEmbed` and remained connected. The subsequent hero/booking releases did not cause this disconnection.

A second historical coupling existed in `1f87febdcb9d7f23e8c5fc180dcce195b990feeb` (25 October): the disclosure forwarded messages only on desktop (`mobile===false`). It also unmounted its iframe and cleared the provider when closed. Thus merely restoring that old section would retain visibility/viewport-dependent acquisition.

Evidence: `docs/evidence/homepage-journey-20261104/removal-history.txt`; current provider, disclosure and homepage source were inspected before edits.

## Fix

- `HomepageJourneyProvider` now owns exactly one eager `LiveMapEmbed` in background mode. Acquisition does not depend on the retired visible-map flag, disclosure state, viewport, or a prior `/route` visit. The source is omitted for saved previews and when the entire journey consumer section is disabled, avoiding work with no consumer.
- Background mode uses the existing canonical Netlify iframe URL, project binding, external-display capability handshake and `connectJourneyBridge` unchanged. Its nonzero clipped viewport avoids lazy loading and zero-size map initialization. It is inert, hidden from accessibility APIs, outside keyboard navigation, and has no visible map/recovery controls. The unused orphan `HomepageMapDisclosure` was removed so it cannot reintroduce a second iframe or conditional supplier.
- Exact origin plus current iframe `contentWindow` checks, schema/version/display validation, presentation lifetime, three-second disconnected handshake retries and timer/listener disposal remain in the shared bridge. No new GPS collector, endpoint, poller, database write or subscription implementation was added.
- When browser connectivity returns, background mode replaces its single iframe and resets the snapshot. Disposal clears background-source state, preventing reuse of a claim after its source was disabled. Visible `/route` mode retains its existing behavior and controls.
- Expired transport copy is now “Live connection interrupted. Reconnecting…”. A valid stream carrying historical/unavailable GPS retains the upstream operational message. The LIVE indicator additionally requires an upstream live confidence verdict, a recent observation and a valid nonhistorical presentation. Historical, expired or UNKNOWN GPS never lights it. No raw coordinates or route state are computed here.
- Existing mobile icons-only presentation and desktop status layout remain. No CMS ownership/controls or booking behavior changes.

## Verification

Final checks: `npm test` (673 passed, zero failures/skips), `npm run check` (zero-warning lint, generated types/TypeScript, normal Turbopack production build), standalone final TypeScript check and `git diff --check`.

Regression coverage includes one eager source with no visible map, both retired visibility values, saved-preview suppression, wrong origin/window/version/display rejection, expiry, historical GPS vs transport failure, LIVE suppression, reconnect with rejection of the previous iframe window, source disable/re-enable, listener/timer cleanup, and mobile status suppression. Existing shared bridge security/lifecycle tests and `/route` component tests remain green.

Browser evidence uses the local production Next runtime with actual public CMS content, freshly captured published destination props and the public day-planner response. The hosted Netlify iframe runs unchanged. Its strict allowed-parent policy rejects ordinary localhost. In a fresh isolated headless Chrome profile, CDP therefore fulfills only the approved parent origin's HTTP requests from local Next; nothing is uploaded or deployed. These are local candidate checks, not claims that production contains the fix. The temporary review route is archived as `.txt` and removed before final production-build validation. No production credentials were used locally.

Passed browser checks:

- Fresh direct homepage entry, without first visiting `/route`, accepts the real hosted iframe's journey.
- Both retired map visibility values preserve the same iframe window and updates.
- Client navigation between the homepage and the actual `RouteJourney` component, then back, receives updates with one iframe per page. The review harness uses local review URLs; production `/route` source is unchanged.
- Dropping incoming journey messages before app listener registration causes the existing TTL to clear claims and show connection-interrupted copy. Restoring messages recovers through the existing handshake. Offline/online emulation replaces the iframe and receives real messages again.
- Responsive checks at 360×800, 390×844, 768×1024, 1024×768, 1440×1000 and 844×390: no document overflow, one iframe, icons-only mobile and desktop status preserved.
- Child request audit captured GETs and CORS OPTIONS only: no POST/PATCH/PUT/DELETE, booking request or database mutation. No duplicate iframe or new Next tracking subscription. During this run the upstream service was finished for the day, so active child realtime socket counts were zero. The accepted message was “Service finished for today”, UNKNOWN/unavailable GPS, with LIVE unlit. An earlier real connection also displayed “At stop: Mesi Bridge”. Real streaming GPS freshness was not fabricated to make the test appear LIVE.

Screenshots and raw assertions: `docs/evidence/homepage-journey-20261104/desktop-connected.png`, `mobile-icons.png`, `route-connected.png`, `transport-expired.png`, `recovered-desktop.png`, `browser-results.json`. Final logs are in that same directory.

## Limits

Physical devices, actual mobile keyboards, Safari and Firefox were unavailable. Browser checks use Chromium viewport/touch emulation. Fresh, delayed and historical GPS boundary cases use validated protocol fixtures in automated tests; real browser acceptance reports the actual upstream service state at test time. There was no production deployment or companion code/configuration change, so post-deployment acceptance remains future work if publication is requested.


Publication update — 4 November 2026: the owner subsequently authorized publication of all completed homepage changes. This supersedes the local-only limit above. Fresh combined676-test/lint/type/build/audit validation passed; exact-head PR/main CI and live acceptance are pending. Release evidence: `docs/evidence/combined-publication-20261104/`.


Publication verified — 4 November 2026: released with the other completed homepage changes via PR #53, main `602f9432d9974b90d48121bfc5d29ca59270148a`, Vercel `Bgre5qYueujJRN5RAnKqM24yPvbV`. Fresh676 tests, lint/types/build/audit and exact-head PR/main CI pass. Live .app/www acceptance passes10 viewports and8 booking cycles per domain, real journey acquisition/navigation/expiry/online recovery, mobile swipe/details/WhatsApp and zero booking geometry delta, with zero checkout requests. No rollback needed. Local receipt/screenshots: `docs/evidence/combined-publication-20261104/`. No documentation-only redeployment. Hardware/browser verification limits above remain.
