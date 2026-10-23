# Colorful circular Stops — 23 October 2026

Implemented locally only. No push, merge, deployment, new environment, hosted CMS write or database change.

## Presentation

Homepage SightseeingStopsExperience and Route LiveJourneyTracker reuse one StopPortrait component. Existing ordered stop numbers select the requested red #F20544, blue #0875E8, green #078B51, orange #FF8412 and purple #8200D6. Photographs retain CMS image references and alt text. Names are existing CMS names, not hardcoded replacements. Circular frames use thick colored rings, a thin white inner inset, upper-left numbered badges and overlapping rounded name labels. Full descriptions remain in existing details; compact descriptions clamp to three lines. Missing CMS descriptions stay empty, without invented copy.

The responsive layout uses one column below 480px, two from 480px, three from 760px and five from 1100px. Shared 200px maximum circles scale evenly within narrower columns. Hover enlargement and shadow transitions are disabled for reduced motion. Selected buttons retain expanded state, keyboard focus outlines, detail links and close actions. Live progress, ETA, current-van marker and map callbacks retain their existing sources and handlers; destination colors do not replace operational status.

Dark #050505 text on red, blue, green and orange and white on purple retain at least 4.5:1 contrast for label text. Exact requested backgrounds remain unchanged.

## Verification

- TypeScript, lint and production build passed locally.
- Eight existing component tests and three integration tests passed, including CMS propagation, stable IDs/order, stale/unavailable status and arrival/ETA separation.
- Local existing fixture checked at 320, 375, 390, 480, 768, 1024 and 1440px for discovery; 320, 390, 768, 1024 and 1440px for route tracker. Five square portraits and in-bounds labels; no page horizontal overflow.
- Discovery details open/close and Route details/Next stop work; authoritative live next stop and ETA unchanged by selection.
- Desktop and mobile fixture screenshots visually inspected. Fixture descriptions/status are explicitly fictional; no production content was changed. Images are existing project assets, not generated replacements.

Screenshots: docs/review/circular-stops-2026-10-23/desktop.jpg and mobile-route.jpg.

Existing unrelated dirty workspace changes, including the separately prepared admin publication repair, are preserved.

## Approved release preparation

Owner approved publication on 23 October. Release assembled from production main 3bec2f6 in a clean checkout; six presentation files and these release notes only. Earlier unshipped admin editor patch remains excluded. Next.js remains the already approved 16.4.2. Lint, typecheck, production build and all 461 tests passed in this release checkout. Embedded Postgres setup was hydrated before rerunning its 25 tests; CMS verification seven tests passed. Production dependency audit: zero vulnerabilities. No migrations or CMS/data writes are part of this release. GitHub CI and production smoke verification pending.
