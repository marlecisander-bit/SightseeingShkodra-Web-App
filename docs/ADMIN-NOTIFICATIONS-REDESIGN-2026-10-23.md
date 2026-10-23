# Admin notification redesign — 23 October 2026

Implemented locally in `/private/tmp/shkodra-notifications-ui-20261023`. Not pushed, merged or deployed. Based on the published application's equivalent local source snapshot; separate email and hero redesigns remain separate unpublished work.

## Presentation and interactions

The header bell now has a 44px target, 22px icon, neutral/pink background, visible keyboard focus and a red #DC3545 unread badge capped at 9+. Its accessible name retains the actual unread count.

The 390px dropdown shows the five newest distinct notifications, contextual calendar icons, safe booking summaries, references, relevant amounts and relative timestamps. Unread rows use #FFF1F2 and a dot plus accessible text. Long references wrap/truncate within their column. Mobile uses a viewport-contained panel with a scrollable list and fixed close/header controls. Opening does not mark anything read. Existing history, filters, settings and device controls remain available on the history page.

Mark all uses the existing authorized mutation and preserves records. Individual navigation awaits its read update; failures stay visible without pretending success. Invalid destinations display an unavailable message. Valid destinations retain the existing booking page's missing-booking handling. Escape restores focus to the bell; outside click dismisses; Tab and arrow/Home/End navigation work. No focus trap is imposed on the nonmodal dialog. Loading, failure and reconnect states are explicit; no continuous animation is added.

## Infrastructure audit and reuse

The existing `/api/admin/notifications` endpoint remains authoritative. Operator/user-scoped reads, persisted receipt state, exact unread count, booking event projection, Supabase receipt subscription, refresh debounce, visibility/online refresh and authentication cleanup remain in place. No new tables, migrations, workers, notification generation or permissions were added. The actual header has no account control to reorder; its existing bell location and other navigation are preserved.

The current projection supplies guest totals rather than adult/child breakdown. The compact summary therefore says “guests”; it never invents passenger categories. Only the known structured message format is parsed. Unknown formats show “Open booking for details” rather than exposing arbitrary message text or contact information.

## Changed files

- `src/app/admin/notifications.tsx`
- `src/app/admin/notifications.module.css`
- `src/app/admin/notification-presentation.ts`
- `src/app/dev/admin-notifications/fixture.tsx`
- `tests/components/notification-bell.test.mjs`
- `tests/components/notification-presentation.test.mjs`
- This report and `docs/PHASE_STATUS.md`

## Verification

All 496 tests passed: components 100, identity 23, integrations 158, database 182, PostgreSQL 26 and CMS 7. Lint, TypeScript and production build passed. After the final decorative-dot accessibility adjustment, all 9 focused notification tests and lint passed again. `git diff --check` passed.

Synthetic tests cover zero/one/many/9+ counts, opening without mutations, incoming notifications while open, deduplication, individual/all read success and failure, safe navigation, unavailable destinations, dismissal/focus, empty state, summary privacy and relative timestamps. Browser layout measurements at 320, 393, 768, 1024 and 1440px showed a 44px bell and no horizontal overflow. No real bookings, email sends, production writes or hosted login/logout were used.

Desktop review: `/private/tmp/shkodra-notifications-desktop.png`

Mobile review: `/private/tmp/shkodra-notifications-mobile-review.png` (top viewport crop of full-page browser capture at mobile width).

## Limits and readiness

Ready for owner review of the local implementation, not deployed. Native screen-reader testing, real account logout/login, production realtime delivery and actual deleted-booking navigation were not exercised. Persisted per-user receipt behavior is covered by existing backend tests and preserved code. Long references are constrained by CSS; translated copy still needs native-language owner review. The text brief supplied no separate image mockup. A production release requires reconciliation with the other unpublished local branches and the normal deployment checks.
