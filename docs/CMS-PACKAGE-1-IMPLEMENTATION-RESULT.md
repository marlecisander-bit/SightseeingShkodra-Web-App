# CMS Package 1 implementation result

16 October 2026, Europe/Tirane. Local implementation only. **Production readiness: GO for a separately authorized release. No deployment, push, merge, production data write or cloud configuration change was performed.**

## Baseline and isolation

Read the five 15 October audit reports, Roadmap V4, Decisions and Phase Status. GitHub `refs/heads/main` was verified read-only as `2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd`, matching the audited production baseline. The original IDE checkout is still on the older `ffd26dd` baseline with extensive modified/untracked files from earlier work; those files were not reset, staged or used as this package's baseline.

Implementation checkout: `/private/tmp/shkodra-cms-package1-20261016`.
Branch: `implementation/cms-package-1-2026-10-16`, created directly from the verified main SHA. No production deployment status was changed. The remote-main check establishes source baseline, not a new live production acceptance test.

## Completed changes and before/after

| Finding | Before | After |
|---|---|---|
| F01 | Hero widget ignored saved `hero.book` and displayed a literal label | HomepageHero passes the existing CMS label as the widget's required `bookingLabel` prop. Only button text changes; form submission, date/passengers, quote eligibility, prices and dialog remain the existing implementation |
| F02 | Three unused controls invited meaningless edits | `route.text`, `labels.ticket`, `labels.faq` are excluded only from active editor projections. All remain in the retained schema/defaults and saved documents |
| F05 | Compact amenity editor offered an unused Description input | Description input removed; helper explains icons/short titles and five-item presentation. Existing description properties survive title/icon/order updates and persistence. No public-row styling or stored shape changes |
| F06 | Move later was enabled for draft-only editors | Both move directions require `canPublish`, with existing pending and first/last boundaries preserved. Server action, SQL role checks and operator authorization remain unchanged |
| F12 | Partners sorted before every known module and had blank explanatory text | Partners follows Website content in Overview; its description is reused from existing navigation metadata. Other descriptions/order and role filtering remain intact |

## Changed files

Application (six files):

- `src/components/public/homepage-hero.tsx` — pass canonical CMS booking label.
- `src/components/public/hero-booking-widget.tsx` — accept/render label without changing booking behavior.
- `src/modules/content/website-schema.ts` — retire three editor controls, retaining compatibility keys.
- `src/app/admin/hero-amenities-input.tsx` — remove Description input and clarify compact presentation.
- `src/app/admin/destinations-editor.tsx` — match Move later permission condition to Move earlier.
- `src/app/admin/overview-panel.tsx` — Partners position and existing navigation-description fallback.

Regression coverage (four files):

- `tests/components/homepage-hero.test.mjs` — reverse the old regression assertion that expected the saved label to be absent.
- `tests/components/cms-package1.test.mjs` — Overview description/order for owner/admin/editor, operations exclusion, absent Description control with retained submitted value.
- `tests/integrations/website-editor-contract.test.mjs` — retired controls absent, historical custom values accepted, 210 schema keys retained.
- `tests/database/public-admin-connections.test.mjs` — both reorder directions denied to editors and accepted for owner/admin; historical copy/amenity description and custom booking label survive editor draft and publisher publication in disposable local data.

Documentation: `docs/CMS-PACKAGE-1-IMPLEMENTATION-RESULT.md` (this report). No migrations, dependency, CSS, architecture or operational-map changes.

## Validation

| Check | Result |
|---|---|
| `npm run lint` | PASS, zero warnings |
| `npm run typecheck` | PASS on final clean generated types |
| `npm run build` | PASS on final tree, temporary preview route removed |
| `node --import tsx --test tests/components/*.test.mjs tests/identity/*.test.mjs tests/database/*.test.mjs` | PASS: 246 tests, zero failures/skips |
| `node --conditions=react-server --import tsx --test tests/integrations/*.test.mjs` | PASS: 144 tests, zero failures/skips |
| `git diff --check` | PASS |
| Owner / content_editor / admin publisher browser UI | PASS on isolated synthetic component fixtures: owner/admin middle-row moves enabled; first/last boundaries disabled; all six editor move buttons disabled |
| Public CTA marker / booking guard | PASS: custom label renders, opens existing preview dialog; clearing date disables submission and shows existing date guidance |
| Historical documents | PASS: current 210-key schema preserved, historical migration fixtures pass, custom retired values and amenity Description round-trip through local SQL draft/publication |
| Responsive component checks | PASS at 320, 375, 390, 430, 768, 1024 and 1440px: page width equals viewport, five benefits share one row, no sampled form input crosses viewport |
| Amenity interaction | PASS: editing title preserves a synthetic historical description and removes the unused Description input |

**390 automated tests passed.** The final suite includes the new tests, rather than relying on historical audit counts. Tests use disposable PGlite databases, synthetic staff/records and mocked transports, never hosted Supabase writes.

One intermediate validation failed after removing the temporary development preview: stale `.next/dev/types/validator.ts` still referenced its deleted route. Removing only generated development types and regenerating resolved it; final lint/types/build passed. No application workaround or retained preview route was introduced.

The local credential-free preview's availability request returned the expected unavailable/503 response after dialog opening; no real reservation or provider call was made. Real checkout success was not demonstrated by this fixture. Existing quote/booking regression tests passed and the widget's quote/submission logic was unchanged.

## Evidence and limits

Local evidence is retained at `private/cms-package1-evidence/` in the original IDE checkout (ignored, not application source): mobile/desktop screenshots, responsive measurements, role states, temporary synthetic preview source and test/build logs. Screenshots were visually inspected. They show reused components with local default photography and synthetic content, outside the authenticated production shell; they do not claim production-content or complete admin-shell acceptance. The temporary preview source is absent from the final application tree.

No physical-device, screen-reader or new authenticated hosted-account test was performed. Browser roles use the real permission policy with synthetic component props; actual mutation authorization was independently exercised through local migration RPCs. No new full 24-test embedded-Postgres concurrency run was needed for these presentation-only changes; database/domain regressions above passed. Production end-to-end booking/payment/email delivery and independent GPS/ETA were not exercised or changed.

## Security and compatibility

No permission was granted or relaxed. Draft editors remain unable to reorder/publish through SQL, owner/admin retain existing publisher rights, and operations receives no Partners access. Existing operator binding, optimistic stamps, server authorization and sensitive-field restrictions remain covered by regressions. No hidden field is treated as a new security boundary.

All 210 stored Website keys remain supported. Retired controls become non-editable through active editor allowlists, not deleted from historical documents. Amenity description remains part of the same JSON model and validators. Existing CMS entities remain authoritative; no duplicate configuration, generic module or framework was added. Booking calculations, availability/capacity transactions, pricing, quote validation, passenger logic, GPS/ETA, operational stops and the external map are unchanged.

## Outstanding issues and release decision

No outstanding failure within the five approved fixes. Audit findings F03/F04/F07–F11/F13/F14 and other packages remain deferred; this package makes no claim to resolve them. The GO decision applies to this narrow, locally validated candidate. Release still requires explicit user authorization and the existing Vercel deployment procedure; hosted acceptance after any future approved release remains necessary.

## Rollback and review

The original workspace and production require no rollback because neither application tree nor hosted data was changed by this implementation. Only this report and ignored review evidence are copied into the original workspace.

Review the isolated branch against baseline with `git diff 2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd` from its checkout. To abandon before release, retain any desired evidence and discard the isolated branch/checkout. If this package is committed and later released with separate approval, revert its scoped implementation commit on a new review branch and run the same checks; do not reset shared main. There is no database migration or historical-data rollback. Any future production rollback/deployment needs separate authorization.
