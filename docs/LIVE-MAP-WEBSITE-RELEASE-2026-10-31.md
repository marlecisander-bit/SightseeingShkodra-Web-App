## Publication continuation — owner acceptance received

On 31 October 2026 the owner reported “tested. ok. go on publishing”. Recorded as owner-reported acceptance; device/browser details were not supplied. This supersedes the historical HOLD below and explicitly authorizes publication. Rechecked exact seven-file candidate hashes, all 121 hosted companion hashes, 665 tests, lint/typecheck/build. Authenticated Vercel UI confirms connected repository, main Production branch with automatic custom-domain assignment, and gate-false deployment CAUqNxB2ktjV5k3B3qsP2RXtWJRh Ready/current. CI has no separate deploy job; feature pushes may create Preview. No hosting configuration or database change. Publish only the scoped integration and this report; preserve unrelated dirty work.

# Website Live Map release acceptance — 31 October 2026

**HOLD publication: physical-device acceptance remains pending.** The companion deployment dependency is resolved. Independent website preparation and browser checks are complete; public and local source gates remain false. Publication is authorized by the current user request once required checks pass. No further publication authorization is requested here.

## Workspace and preservation

The only available existing website checkout is `/Users/aleksandermarleci/Desktop/Projects Dev/SightseeingShkodra-Web-App`, branch `work/permanent-folder-20261031`, HEAD `807c4f57221a5d8ff7122497eca70f4d23de211c`. The documented `-canonical` directory is absent. The companion's latest report records the external folder rename. Used the existing checkout; created no clone, worktree or source release folder. Preserved all pre-existing changes and unrelated admin work. No commit, push, deployment, database operation or cloud configuration change occurred.

Read AGENTS, roadmap V4, decisions, phase status, handoff and latest companion publication/device evidence. Read installed Next.js client-boundary and development-origin guidance. Reused embeddedDisplay v1, exact query opt-ins, capability response, origin/source checks and expiry behavior. No protocol or companion source change.

## Companion production verification

Latest release evidence: sibling `live-tracking-app/reports/companion-20261031/REVISED-PUBLICATION.md` and `revised-release-receipt.json`. The original rollback is historical; revised deployment `6ae5382f7b0f7e265b7273aa` was subsequently released.

Freshly fetched **all 121 public paths** from `https://sightseeingshkodralivetrackingapp.netlify.app`; every HTTP 200 SHA-256 equals the revised manifest, including create-map.js, public-presentation.js, journey-framing.js, app-config.js and responsive-presentation.css. Expected complete 123-file artifact tree: `762d056232356005f5173a120e334b979f72f73511aa03fcc86ea22163d22751`. The two provider-only configuration files are not public downloads; this run verifies public bytes, not a new authenticated provider inventory. Original release evidence verifies the full inventory and deployment identity. Current CSP restricts framing to the exact four approved public website origins. Evidence: `evidence/live-map-release-20261031/companion-public-hashes.json` and `companion-headers.txt`.

## Actual gate-enabled website candidate

Temporarily enabled the existing source gate and built the real Next.js application. Ran `next start` on task-owned 127.0.0.1:3011. Browser routing delivered its unmodified HTML, JS, CSS and API responses at the exact approved parent origin `https://sightseeingshkodra.app`. This preserves the companion's production CSP and parent validation without an allowlist change. It is a browser-scoped proxy, not a deployed preview or hand-built component overlay. **No child HTML/scripts, Leaflet, Turf or Supabase SDK were replaced.** Child assets came from the released service. Only GET/HEAD requests were allowed; WebSockets were closed to exercise the existing HTTP fallback.

`actual-candidate.json`: PASS, 28 recorded checks, no page exceptions:

- Actual Route at 320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 844×390 and 390×500.
- Single external status panel after handshake, hidden internal child card, no redundant Route summary. Panel above responsive iframe; toolbar inside child viewport; no horizontal overflow. Real tiles and attribution.
- Initial handshake and normal display delivery; real service reported unavailable/UNKNOWN and no operational accuracy is inferred.
- Parent stop selection persists through normal renders and offline/online tile recovery. Find Van resumes following.
- Iframe document reload and React remount recover with one panel.
- Secure iframe geolocation delegation; denied permission has usable feedback, granted synthetic visitor coordinates work.
- Actual `/your-day` compact placement at mobile/tablet/desktop/landscape/short sizes, Interact/Done and tabindex behavior.
- Actual homepage continues to mount no map. Standalone retains its internal card.

`actual-candidate-controlled.json`: PASS, five recorded checks, no page exceptions. Same actual Next production build and unmodified hosted scripts/SDK. Only map_versions and tracking_live_snapshots HTTP read responses used coherent synthetic map/version/observations; real tiles retained. Verified PARKED projection, stop popup through three fresh HTTP observations, intentional Find Van resume, stale observation becoming neutral UNKNOWN, message-transport expiry removing claims and delivery recovering. The first fixture attempt mismatched the current published map version; corrected the HTTP fixture, without changing application code. A recovery assertion initially matched both “Location temporarily unavailable” and the transport-expired copy; corrected it to the exact transport-expired text. Final checks retain the required behavior.

Screenshots in the evidence directory were inspected for mobile Route. Desktop emulation does not establish phone gestures/safe areas. Local CMS/Supabase website bindings are absent: the actual Next routes use their existing safe content/schedule fallbacks. This is not configured production CMS parity evidence.

## Validation and candidate preservation

Gate-true candidate: **665 tests pass**, lint, typecheck and production build pass. Tests now validate the chosen release gate's panel/query behavior in either state and retain the independent assertion that the local preview flag cannot enable production loopback. Existing lifecycle/security tests retained.

`gate-true-source-hashes.json` identifies the tested application/test files. `gate-true-candidate.patch` is the scoped delta against HEAD, excluding unrelated documentation/admin changes. It contains the activation gate and existing pending integration fixes; it is evidence, not an applied release. Restore/review against the current tree before a future release rather than blindly applying it over dirty files.

After acceptance, stopped the task-owned server and restored source gate=false. Rechecked lint/types/build and focused display/bridge tests. No source folder remains running the gate-true candidate. Generated Next type-import changes are restored to their original bytes after checks.

## Public website, deployment behavior and rollback

Fresh `git ls-remote` confirms origin/main remains `807c4f57221a5d8ff7122497eca70f4d23de211c`; its GitHub Verify project check is successful. CI runs on main pushes/PRs and has no deployment step. Existing deployment documentation records Vercel Git integration: feature push can deploy Preview; main can deploy Production. No push was attempted. A live authenticated Vercel settings audit remains necessary immediately before eventual publication.

Public Route: https://sightseeingshkodra.app/route — HTTP 200, **gate=false**, iframe has embed=1/presentation=full and no websiteStatus opt-in. Current published commit remains `807c4f5`; this task released no new commit. Fresh public-baseline browser smoke also passed: standalone at four sizes, both public Route origins, real tiles/attribution, permission denial/grant, automatic offline/online tile recovery and existing iframe policy. Evidence: `deployed-live-smoke-website-final-baseline.json`.

Retained gate-false Vercel deployment: `CAUqNxB2ktjV5k3B3qsP2RXtWJRh`, URL https://sightseeing-shkodra-web-9b9itomiv-aleksander-marleci.vercel.app . Its immutable URL still enters the existing Vercel login protection; no bypass or policy change was attempted. Publication receipt and current public baseline are retained. Do not describe this unauthenticated redirect as a fresh provider-restorability verification. Before eventual activation, verify its authenticated Ready state/restoration availability and current project settings. If activation fails, restore the gate-false website before reverting the companion. Companion's recorded independent rollback deployment is `6ae4ba0b2d9172e2c14cb006`.

## Remaining owner participation and exact URLs

Latest companion release receipt explicitly says `physicalDeviceAcceptance: PENDING — user participation`. User's “ok” acknowledges the checklist; it supplies no device/result evidence.

Test standalone on iPhone/Safari and Android/Chrome:
https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra

1. Portrait/landscape: controls and attribution visible, safe areas/browser bars usable.
2. Select a stop; offline/online after zooming: tiles recover and popup remains. Find Van resumes following.
3. Find Me denied then allowed; actual location sensible. Pan/pinch, page scroll and background/foreground.
4. Report device/OS/browser and pass/fail for each step.

Existing public iframe baseline: https://sightseeingshkodra.app/route . It can establish current touch/location behavior, **but its gate is false and it cannot accept the proposed external-panel layout**.

Final gate-enabled Route/compact physical acceptance still requires an approved-origin candidate session on those devices. The tested session is browser-local, not a shareable URL; ordinary Vercel preview domains are intentionally absent from the child CSP/origin allowlist. No gate-true public URL was fabricated or published. Arrange an owner-controlled approved-origin test session before activation; verify one panel, parent/iframe touch arbitration, compact Interact/Done, safe areas, popup/reconnect and Find Van on that session. This unresolved device acceptance prevents satisfying the user's conditional publication gate. Natural live vehicle/GPS/parking/ETA accuracy is also unclaimed.
