# Mobile horizontal Stops refinement — 23 October 2026

User amendment: mobile destinations should remain horizontal with scrolling, marker names/numbers should be white, and colored rings should be thinner.

Local presentation changes only: homepage and route tracker use horizontal scroll-snap grids below 760px, with 82% card widths leaving a visible next-card preview, contained overscroll and native keyboard-focusable lists. Desktop layout is unchanged. All destination label/number foregrounds are white per the explicit user request, superseding the previous dark foreground choice. Colored rings reduced from 8px to 5px. Existing CMS content, photos, IDs, order, selection/detail actions and live status logic remain unchanged.

Validation: TypeScript, lint, production build and eight focused component tests passed. Homepage checked at 320/390/600/759/1440px: single horizontal row at every width, scrollable below 760px, no page overflow, computed white marker text/numbers and 5px rings. Route tracker verified at 390px with horizontal overflow confined to its rail; selecting last stop scrolls it into view and opens its details. Screenshot visually inspected: docs/review/mobile-horizontal-stops-2026-10-23/mobile.jpg.

No push, merge, deployment, CMS write or backend change. Existing unrelated workspace changes preserved.

## Approved release

Owner approved publication. Prepared from production main 8f1379d in a clean checkout, excluding unrelated pending local changes. Next.js remains 16.4.2. Release lint, TypeScript, production build and all 461 tests passed; production dependency audit clean. GitHub CI and live smoke verification pending.
