# F10 implementation result

16 October 2026, Europe/Tirane. **Local implementation only. GO for review of this verification tooling; NO-GO for an all-fields-work acceptance claim.** Release preparation, push, PR, merge and deployment remain unauthorized and have not occurred. Four known catalog failures and five untested active controls remain explicit in the result.

## Baseline, isolation and specification decisions

Read-only GitHub main checks at the start and end returned `a890a6a944886fce5b5adcdf893fe6e4f4666d00`, the Package 1 production merge. The clean implementation clone is `/private/tmp/shkodra-cms-f10-20261016`, branch `implementation/cms-f10-verification-2026-10-16`. Changes remain uncommitted for local review. The original IDE workspace remains on its older dirty baseline; no files there were reset, overwritten, staged or modified by this task. Its unrelated changes were not copied into this clone.

Read the approved F10 plan from the isolated Package 1 checkout, Package 1 production result, five audit/recommendation documents, Decisions, Roadmap V4 and Phase Status before implementation. The approved plan is copied here as reference; its original planning-only authorization paragraph is historical and superseded by the user's F10 implementation authorization.

Two specification differences required interpretation, not application changes: the latest request requires only PASS/FAIL/UNTESTED, superseding the plan's additional result labels; and the historical matrix predates Package 1. Current active/retained inventory is derived from source, not its historical counts. Known F03/F04/F07 behavior is reported, not repaired. Existing architecture and business rules are unchanged.

## Defects corrected and capabilities

The old script attempted owner initialization and publication as a content editor, generated generic links for unsupported field kinds, accumulated edits, used nonexistent image fixtures, required a running composite development route and accepted marker presence anywhere in its HTML. It could neither execute the current permissions contract nor establish per-control correctness.

The replacement derives active controls from `editableWebsiteSections`, compares them to explicit reviewed cases and refuses new/missing cases. Unknown fixture kinds fail. All current kinds receive application-valid values. Each independent case uses owner baseline publication, the permitted editor/owner draft role, fresh SQL reads, unchanged published output, saved-draft public-component projection, admin/owner publication and repeated published reads. Assertions inspect actual text, image/source attributes, links, CSS properties, conditional DOM or metadata; script and hidden-input markers cannot satisfy text checks. The tool does not depend on a browser route or HTTP server.

Existing migrations and development fixtures run only in disposable in-memory PGlite. Synthetic staff cover owner, admin, content_editor and operations; real SQL denies anonymous writes, cross-operator writes, stale updates, editor initialization/publication/reorder and owner-only setting changes by lesser roles. The harness rejects production/preview environments, service bindings and non-loopback origins before database setup; fetch is blocked during verification and restored afterward. This is not an OS-level network sandbox or a claim that arbitrary native sockets are intercepted. No hosted client is created by the harness.

Entity probes respect existing publication models: Destination draft/publication, editorial association and ambiguous/missing association fallback; Partners direct activation/deactivation and anonymous RLS; Reviews direct publication and retained soft-deleted content; catalog persistence and canonical FAQ inclusions; protected pricing authorization; owner-only appended meeting-point versions with retained earlier rows and stale-version rejection. These are representative entity probes, not exhaustive certification of every entity property. Existing server-action/loader and authorization regressions supplement them.

## Current results and denominators

| Scope | PASS | FAIL | UNTESTED | Meaning |
|---|---:|---:|---:|---|
| Active Website controls | 121 | 0 | 5 | Behavioral public/preview projection; all 126 completed SQL persistence/publication stages |
| Separate representative entity/boundary probes | 5 | 0 | 0 | Destination, Partners, Reviews, pricing permission boundary and meeting-point versions |
| Catalog SEO/image properties | 0 | 4 | 0 | Known F04 presentation disconnections |
| Retained Website keys | 84 | 0 | 0 | Stored compatibility only; no public-rendering claim |
| Historical protected code entries | 0 | 0 | 41 | Reference inventory only; no fresh algorithm certification |
| Independent checks inside verifier | 20 | 0 | 0 | Includes lifecycle, role, visibility, entity and negative self-test checks; overlaps above, do not add to field totals |

The 210 retained Website schema keys comprise 126 active controls plus 84 compatibility keys. These are not the total of every CMS collection subfield. The historical 259-row mapping extract is labeled reference evidence and is not used as a current passed-field denominator.

The five UNTESTED controls are `route.eyebrow`, `route.title` (request-bound Your Day composition), `routePage.mapAction` (opened stop dialog), `bookingDialog.title` and `bookingDialog.text` (client dialog). Their values persist and publish locally; this run does not prove their interactive public presentation. They remain UNTESTED rather than being inferred correct from storage or build success.

The four FAIL properties are `catalog.product.meta_title`, `meta_description`, `og_image` and `og_image_alt`. They persist through the real catalog RPC, but the tested homepage metadata uses the existing Website authority and does not consume them. This reports F04; it does not change catalog ownership or claim every possible route was tested. Navigation slots 0/3 remain structurally Partial because normalized duplicate targets can be suppressed; unique-target and default-suppression cases are distinct. Desktop hero focal CSS retains its existing wide-screen transformation, not a faithful-crop acceptance claim.

Compatibility tests preserve all 84 retained custom values, keep stored amenity descriptions, validate additive old publications without Partners keys and retain earlier meeting-point records. No historical report or stored schema key was deleted or relabeled as fresh evidence.

## Validation and reproduction

Run from this checkout with Node 24 and no service credentials:

```sh
npm run verify:cms
npm run test:cms-verification
npm run lint
npm run typecheck
npm run build
```

`verify:cms` regenerates `CMS-F10-FIELD-RESULTS.json` and `CMS-F10-VERIFICATION-RESULT.md`. **Its exit code is currently 1 because the four known FAIL findings remain.** It never converts those findings to PASS. `test:cms-verification` separately checks the verifier itself: exact known gaps, lifecycle stages, environment refusal, fixture exhaustiveness, undeclared-field rejection, network refusal and false-positive detection. Any new failure or changed coverage contract fails that suite. The deliberately disconnected `hero.book` fixture returns FAIL without changing application source or production content.

| Command/check | Final result |
|---|---|
| ESLint | PASS; zero warnings |
| TypeScript / generated route types | PASS on final tree |
| Production build | PASS; temporary local route absent |
| Component + identity + database tests | 246 PASS, 0 failures/skips |
| React-server integration tests | 144 PASS, 0 failures/skips |
| Embedded PostgreSQL concurrency tests | 24 PASS, 0 failures/skips |
| F10 verification tests | 5 PASS, 0 failures/skips |
| Total automated tests | **419 PASS**; internal field probes are not additional Node test cases |
| `git diff --check` | PASS |

The first concurrency attempt failed at setup because the sandbox denied a loopback socket (24 tests affected by that shared setup failure). A separately permitted rerun against disposable local PostgreSQL passed all 24. Early F10 development probes also exposed fixture mistakes (Destination publication normalization, table/time-column names and catalog HTTPS image validation, and an empty-Partner assertion that initially included its parent BookingProvider dialog); those adapters were corrected without modifying application rules. Final reports contain no unexpected verifier-check failures.

Chrome synthetic fixture checks at 320/375/390/430/768/1024/1440px found no page overflow or visible field crossing the viewport. Owner/admin middle-row reorder directions were enabled with first/last boundaries disabled; editor/operations move controls were disabled. Overview hid Partners for operations. Hero editing enabled Discard, showed unsaved status, kept editor Publish disabled and Discard restored saved values. Real editor components and their existing CSS wrappers were reused. No form was submitted from the browser.

A temporary development-only route was used to mount the fixture, then removed before final lint/types/build. Its reusable fixture source remains under tests, outside application routing. Initial screenshots without the existing parent CSS wrappers were superseded after correcting the test fixture; final measurements/screenshots use those wrappers. Ignored evidence is in `private/f10-evidence/`: mobile/desktop PNGs, browser measurements/roles and command logs. These checks are synthetic component UI evidence, not authenticated production/admin-shell acceptance. No upload, physical-device, screen-reader or full dirty/pending navigation workflow acceptance is claimed.

## Exact changed-file manifest

All paths are relative to this isolated checkout:

- `package.json` — bounded verifier commands and new suite in the existing test chain; no dependency change.
- `scripts/verify-cms-fields.mjs` — guarded local entry point, report generation and nonzero finding status.
- `scripts/cms-verification/assertions.mjs` — public property assertions and explicit untested cases.
- `scripts/cms-verification/cases.json` — explicit reviewed current cases; schema additions fail closed.
- `scripts/cms-verification/entities.mjs` — actual entity lifecycle and permission probes.
- `scripts/cms-verification/fixtures.mjs` — deterministic, type-aware synthetic values.
- `scripts/cms-verification/render.mjs` — adapters to existing public components and metadata functions.
- `scripts/cms-verification/safety.mjs` — local environment and fetch guards.
- `scripts/cms-verification/verify.mjs` — orchestration, dynamic inventory, SQL lifecycle and reports.
- `tests/helpers/cms-verification/audit-reference.json` — historical audit matrix reference extract, not current pass evidence or CMS configuration.
- `tests/helpers/cms-verification/browser-fixture.tsx` — non-routed synthetic editor fixture.
- `tests/verification/cms-fields.test.mjs` — five focused verifier regression tests.
- `docs/CMS-F10-VERIFICATION-PLAN.md` — preserved approved reference plan copied from Package 1 checkout.
- `docs/CMS-F10-FIELD-RESULTS.json` — generated machine results, baseline/schema fingerprint/tool hashes, per-control fixture/roles/stages and limitations.
- `docs/CMS-F10-VERIFICATION-RESULT.md` — generated human-readable findings.
- `docs/CMS-F10-IMPLEMENTATION-RESULT.md` — this report.

No final `src/`, migration, dependency lockfile, deployment workflow, Vercel configuration or environment-file change is included. No booking/price/passenger/capacity/transaction/QR/GPS/ETA/operational-map logic or RLS was changed. Existing production indexing and delivery configuration were neither accessed for mutation nor modified. The verifier itself creates no bookings or notifications; existing booking regressions use disposable synthetic local records and mocked transports.

## Limits, recommendation and rollback

**GO for separately authorized review/release of the scoped tooling, with these findings disclosed. NO-GO for claiming complete CMS field acceptance or treating `verify:cms` as a currently green all-field release gate.** F04 resolution and the five interactive/request-bound proofs require separate scoped work. More exhaustive entity subfield, authenticated isolated-session, image upload, pending/conflict UI and physical-device coverage remains manual/future work. Do not interpret the historical protected-code inventory as proof of every protected algorithm.

No release action has been taken. There is no production rollback or data migration to perform. Before commit, abandon this isolated checkout after preserving desired evidence; do not reset the original workspace. If later committed and released under separate authorization, revert only the scoped F10 tooling/test/documentation commit on a review branch and run the same checks. No database/configuration rollback is required. Any push/PR/deployment needs new explicit authorization.
