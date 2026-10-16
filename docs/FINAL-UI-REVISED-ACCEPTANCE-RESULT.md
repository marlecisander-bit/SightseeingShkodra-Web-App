# SIGHTSEEING SHKODRA — FINAL UI REVISED ACCEPTANCE RESULT

16 October 2026, Europe/Tirane. **Revised availability acceptance PASS. Scoped integrated local visual and automated acceptance PASS. GO to request publication to the existing Draft PR #22 for fresh CI. NO-GO for merge or Production deployment at this checkpoint.**

This report records the owner's revised acceptance authorization only. No commit, push, PR update, ready-for-review action, merge, deployment, rollback, application-data write or infrastructure change was performed. Accessibility validation remains incomplete and is not marked PASS. No live Production availability endpoint verification is claimed.

## 1. Candidate and scope

| Reference | Verified value |
|---|---|
| Production/main baseline | `c3020c566f167af4d0ef87e9aa33d4d0adb0d367` |
| Existing PR | [Draft #22](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/22) |
| PR head / local HEAD | `8ce96c0d1acc301a2c83be4df3990895fabcfa43` |
| Release checkout | `/private/tmp/shkodra-final-ui-release-20261016` |
| Local branch | `release/admin-and-partners-2026-10-16` |
| Integrated candidate | Exactly 34 paths relative to Production; refinements remain uncommitted |
| Current Production artifact | `dpl_HGQ8hKBLiZa9qLgdcQt58JXTncpv` |
| Production status | Ready / Latest / Production / Current; source main `c3020c5` |
| Public domain | https://sightseeingshkodra.app/ |
| Immutable Production URL | https://sightseeing-shkodra-web-rnivsjoeq-aleksander-marleci.vercel.app |

The existing integrated Phase A navigation, Warm Minimal refinement and Partners correction were tested directly. No competing implementation or source fix was created. Their 34 recorded file hashes match the earlier integrated candidate before and after acceptance. There is no new release commit SHA.

The earlier [blocked release report](FINAL-UI-PRODUCTION-RELEASE-RESULT.md) remains an accurate historical checkpoint. This report resolves its availability-procedure blocker under the subsequent owner authorization and supplies fresh scoped visual evidence. It does not retroactively mark an unexecuted release successful.

## 2. Availability acceptance — disposable functional evidence

The complete existing suite was executed twice in this verification, including a final repetition after visual acceptance. The final run passed **451 tests, zero failures and zero skips**. No test was rewritten or weakened.

Relevant existing suites include:

- `tests/integrations/public-availability.test.mjs` and `passenger-availability.test.mjs`: server-bound operator/product, exact passenger mix, malformed input, unpublished products and controlled configuration/provider failures.
- `tests/database/availability.test.mjs` and `availability-clock.test.mjs`: configured minor-unit prices; capacity zero/one; confirmed occupancy; active unexpired versus elapsed holds; invalid dates; Europe/Tirane dates, midnight, DST and cutoff boundaries; sold-out versus past departures.
- `tests/database/calendar-pricing.test.mjs` and `product-pricing.test.mjs`: passenger categories and ages, free infants without occupied seats, range/departure price precedence, category offers, immutable confirmed snapshots and rejection of unsafe commercial edits.
- `tests/database/service-schedules.test.mjs`: effective dates/weekdays, four departure times, exceptions, closure/restoration, per-time capacity, paused schedules and repeated materialization reusing departure identities.

The schedule test explicitly starts with zero departures, reads two dates and obtains eight rows; repeated reads reuse IDs. This is expected **disposable local behavior**, not a hosted operation. Tests involving holds, bookings or mutation rejection ran only against synthetic PGlite/embedded PostgreSQL databases.

All checks used the existing sanitized runner with a localhost development origin, communications/indexing disabled and no hosted service credentials. Local API forwarding tests use injected transports; database tests execute the real migrated functions on disposable data. Together they support functional availability acceptance without claiming a live hosted HTTP-to-database test.

## 3. Availability acceptance — hosted read-only evidence

The authenticated Supabase SQL Editor showed project `ybngoppqqiohcduojfyg`, sightseeing-shkodra-webapp, **main / Production**. Five bounded inspection transactions used `BEGIN READ ONLY`, a local 15-second statement timeout, SELECTs and COMMIT. Captured results explicitly returned `transaction_read_only = on`.

No application availability/pricing/materialization RPC was invoked. `pg_proc`, routine-source hashes/security attributes, configuration tables and aggregate record counts were read directly. No production availability endpoint, admin Bookings render path, mutating RPC, test booking, hold, inventory insertion or customer send was executed. The dashboard may retain its normal SQL query/editor history; this is not an application-data migration or write.

| Hosted snapshot | Observation |
|---|---|
| Product configuration | Five existing products; one published daily ticket and four archived products |
| Published ticket pricing | EUR minor units: adult 1000, child 800, infant 0; adult minimum 13, child 3–12, infant 0–2 |
| Capacity contract | Existing `departure_seats`, version 1 |
| Active schedule | 24 September–31 December 2026; weekdays 1–7; 09:00 / 11:00 / 13:00 / 15:00; default capacity 8; no calendar ranges |
| Operator timezones | Captured operator rows use Europe/Tirane |
| Existing inventory | 105 departure rows across the project; no new inventory requested |
| Exceptions / confirmed items / active unexpired holds | 0 / 7 / 0 at the read-only checkpoint |

These are configuration and aggregate observations, not a quote for every date or a guarantee that legitimate operational activity has stopped. The project-wide departure date range includes historical/future records; it must not be interpreted as the published service season. No customer records or credentials are included in this report.

### Routine parity

The seven inspected routines retain `SECURITY INVOKER`, empty search path, postgres ownership and execution for postgres/service_role; anon and authenticated execution are false. The candidate contains no change to these functions or grants.

| Routine | Hosted source MD5 | Comparison to disposable migrated local reference |
|---|---|---|
| `effective_schedule_times_v1` | `fb321e13726bf19251970e7a9843a1d8` | Exact source match |
| `passenger_categories_v1` | `006fb990ae139cc4077ba1d8df18389e` | Exact source match |
| `passenger_quote_v1` | `1d15559b7bb27bc04479a10bd5240c10` | Exact source match |
| `read_dated_availability_v1` | `885047524cfcdc48fa267eca2a6018c8` | Exact source match |
| `read_passenger_availability_v1` | `774679174b8cac49cb95a50fe37f5d7c` | Exact source match |
| `ensure_schedule_date_v1` | `16a2f3333deac9dcc20ac597c49b75e7` | Whitespace formatting differs; normalized source and SQL token sequence match |
| `read_availability_v1` | `28998cf630026149df27f765e707d14d` | Whitespace formatting differs; normalized source and SQL token sequence match |

For the final two routines, independent hosted hashes of trimmed, whitespace-collapsed source match the local equivalents: `ffcdb19edbc09bc1007aa4938caa1454` and `9b7116382088fb08a4d9babc884f4b57`. The displayed complete statements and string literals were also compared as SQL tokens. Raw byte identity is not claimed for these two bodies.

The hosted source confirms the existing chain: public API → `getAvailability` → `read_passenger_availability_v1` → `read_availability_v1` → `ensure_schedule_date_v1`, which can INSERT missing departures with ON CONFLICT DO NOTHING. The candidate's API, services, SQL and pricing contracts equal the Production source baseline. Its presentation changes do not alter this behavior. **Revised availability acceptance PASS; live Production endpoint verification NOT PERFORMED by design.**

## 4. Fresh integrated visual acceptance

A credential-free localhost development server rendered the exact candidate components with synthetic content and inert or unconfigured transports. Four temporary development-only fixture routes mounted them; all four were removed before final validation. Their source and evidence remain ignored/private. No application route was added to the candidate.

| Surface / state | 320 | 375 | 390 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|---|---|
| Actual HomepageView, header and footer | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Partners: 0 / 1 / 2 / 3 / 5 cards | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Actual initial BookingFlow and native booking dialog | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Real quoted booking controls with synthetic quote | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Admin navigation / Overview presentation | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Calendar month and expanded date editor | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BookingCard and expanded manual-booking controls | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Website section list and expanded Hero editor | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Catalog, Destinations, Partners and Reviews editors | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Notifications center and email panel | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Mobile More dialog open/close | PASS | PASS | PASS | PASS | Desktop | Desktop | Desktop |

PASS means the stated local layout/state was rendered and checked, with actual `innerWidth` verified, no page horizontal overflow and no visible sampled input/select/textarea outside the viewport. It is not authenticated hosted workflow or accessibility certification. The Calendar intentionally retains a contained horizontal month region at narrow widths; page-wide overflow was absent.

Partners produced 35 fresh count/width cases. All expected card counts and centered row bounds matched; images loaded with `object-fit: contain`. Last-card-to-footer gaps were exactly 48px below 640px, 64px at 768px and 80px from 1024px, including the newly required 1280px sample. Section bottom and footer top met without an extra gap. Empty Partners rendered no section/cards. Synthetic landscape images and a long organization name exercise proportions and wrapping; they are not approved production partners.

Booking dialog bounds were contained at all widths; at 320px they were left 12 / right 308. Settled dialog captures confirmed opacity 1. Close controls worked; mobile More opened with Close focused and returned focus to More after dismissal. Existing component tests additionally cover Back, focus/scroll restoration and guarded context switching. Four synthetic role selections and the unchanged four-role policy tests retain restrictions; fixture role selectors themselves are not authorization boundaries.

The booking-management sample composes the actual BookingCard, StaffPassengers, AdminStatus and current CSS with representative synthetic content and inert controls. It does **not** render the complete server BookingsPanel, authenticate a hosted role, materialize a service date or exercise create/cancel/collect/resend. Quoted public controls likewise use synthetic props; the actual BookingFlow was checked in its initial state. Disposable tests provide functional quote evidence. No visual fixture's sample €18 total is presented as a live quote.

Screenshots and seven-width comparison sheets were inspected. Early animated-dialog frames, stitched full-page duplication artifacts and measurements targeting an earlier tab were discarded; settled dialog captures, stable viewport captures and same-tab width-checked measurements are the accepted evidence. These capture issues did not prompt application changes. The browser viewport override was reset and the local server stopped.

## 5. Accessibility and runtime limitations

| Item | Status |
|---|---|
| Responsive scope above / native dialog open-close | PASS within sampled local states |
| Complete keyboard-only walkthrough, including every focus path | UNTESTED / incomplete |
| Native 200% browser zoom acceptance | UNTESTED / incomplete |
| Screen-reader announcements, contrast/conformance audit | UNTESTED / incomplete |
| Physical iPhone/Android, native keyboard, rotation, safe areas | UNTESTED / incomplete |
| Authenticated hosted role workflows and persistence | NOT PERFORMED |
| Production booking endpoint and complete live quote | NOT PERFORMED under revised procedure |
| Full accessibility validation completeness | **FAIL — outstanding evidence, not a confirmed new defect** |

Prior accessibility incompleteness has not been relabelled PASS. Existing cross-page dirty-navigation, Catalog concurrency and shared-device notification concerns remain outside this presentation-only release. No binary upload, publish, booking operation, email/push send, notification acknowledgment or external map/GPS action was performed. F09 editorial content and the existing Production hero/SEO content state remain separate matters.

## 6. Final automated checks

| Check after visual acceptance | Result |
|---|---|
| `npm run check` | PASS — zero-warning lint, type generation/TypeScript and Production build; exit 0 |
| Complete `npm test` | PASS — 451; zero failures/skips; exit 0 |
| Component / identity / integration tests | 71 / 22 / 145 PASS |
| Database / embedded PostgreSQL / verifier contract tests | 181 / 25 / 7 PASS |
| Strict F10, non-writing API execution | PASS — exit 0 |
| `npm audit --omit=dev --audit-level=low` | PASS — zero vulnerabilities |
| `git diff --check` | PASS |
| Exact original candidate hashes | 34/34 PASS |
| Protected backend/configuration diff against Production | Empty |
| Fresh integrated GitHub CI | NOT OBTAINED — publication not authorized |

The first post-fixture check encountered generated `.next/dev/types` references to the four removed temporary routes. Only that generated local development type cache was removed; the complete check was rerun successfully. No source assertion or compiler requirement was weakened. Final generated `next-env.d.ts` equals the baseline.

F10 was executed through `verifyCms({write:false})` after its local-environment guard. Historical generated reports were not rewritten. Results retain separate scopes: 126 active Website PASS; 84 retained compatibility keys; four retired Catalog compatibility PASS; five representative probes (131 combined field/probe PASS); 21 independent checks PASS; 41 historical code-controlled references UNTESTED. These overlap and are not complete-CMS certification.

Final logs are `/private/tmp/revised-acceptance-check-final.log`, `revised-acceptance-final-tests.log`, `revised-acceptance-f10.log` and `revised-acceptance-audit.log`. Earlier run/failure logs remain distinguishable.

## 7. Exact release manifest and preservation

The following is the unchanged 34-path candidate relative to Production `c3020c5`. Every SHA-256 below was rechecked. The canonical digest is SHA-256 of sorted lines formatted as `hash`, two spaces, path, newline:

`989c83f6ad76ed4b6c526ebf11a93ca4c8166356c43b4d8ef840a5b2f45403a7`

| Candidate path | SHA-256 |
|---|---|
| `docs/ADMIN-PHASE-A-IMPLEMENTATION-RESULT.md` | `908d5660d31fdd91de50b6ecd407810b68aca39aae01ec147206de16e22ce4c5` |
| `docs/ADMIN-WARM-MINIMAL-IMPLEMENTATION-RESULT.md` | `12eb4fff57e795c8ad59edf16d3e219058acc5aa2b6a3c8f7c39780bff5dbbc9` |
| `docs/PARTNERS-LAYOUT-RESULT.md` | `af4c2ae30e155aeefe8d5ef504f8fc6b9eb8000aa65b89ba1e9dc833e2c24b57` |
| `src/app/admin/LUCIDE-LICENSE.txt` | `b495047bd93a9b06913511076f504daba17d5bbeb3e0650f3bb53a4220329c57` |
| `src/app/admin/admin-icon.tsx` | `bc865461a3573e5c0d5d42328dbbb5bfc26ce14a885991a98a4e9e5c5ec48e70` |
| `src/app/admin/admin-icons.json` | `2fceabb048db8257db4e6a8877cb5cb0751c690fc860a69394ba43794366901d` |
| `src/app/admin/admin-navigation.tsx` | `bc19f08118e7880a34c40570e7cd4342ef674006d4acccc54fc3d4ea71f4576d` |
| `src/app/admin/admin-shell.tsx` | `d23a1c1fb8150358d071eebe14a46312a5dbc133cf647b90f5de86b5b6b75207` |
| `src/app/admin/admin-status.tsx` | `0966880824b8415a5cfaeb3e7ebb137c9db7953f900b6c0d504624f21241244a` |
| `src/app/admin/admin.module.css` | `ddbb4b4e567b91f82346af4c885ebee49993435dcd4d8a6420b24b225b08b86c` |
| `src/app/admin/bookings-panel.tsx` | `b08615bff17d28f9152e33e9c88d5c4fc0b09b0599a1c0a21aba079bbf3f1e21` |
| `src/app/admin/calendar-panel.tsx` | `ff63823b928da3e7a03c7c00c0784b1b96c19ff83cd242497cbff92831da27ae` |
| `src/app/admin/calendar.module.css` | `4431af5d9eaa07290b5ed0d3771f4d2a080e7eac2754fa3e7057cd7c0933c0b1` |
| `src/app/admin/destinations-editor.tsx` | `6db8af860f09d723ee05c4a7d70ad415c71b73e529d8c6cb80198c1caf85befd` |
| `src/app/admin/email-panel.module.css` | `377c0edf5ffb224e568dd9699712278452d8263221575fdb0e687a36d836f072` |
| `src/app/admin/email-panel.tsx` | `c366c860baf0a2850c0e267ab7717c9b715740bea6942f9a9aafb19e19e9140f` |
| `src/app/admin/layout.tsx` | `8dcba5cd4662d4736ce9b8f318d82a730f4d88b45e529f1efbe6a5a1ae4f0864` |
| `src/app/admin/notifications.module.css` | `ad11f48f3d4cfce547e07b77584203705a1fd590011dcba51fecc4545d68cff8` |
| `src/app/admin/notifications.tsx` | `89b2247fded14e775dd42fc8377124fdcb6ba73559e7aeee65c48222ceb38a6b` |
| `src/app/admin/operations-calendar.tsx` | `45752710cd9393f20546fa599159c15ba8d6ac2b5cf70620c52283cb1013573e` |
| `src/app/admin/page.tsx` | `f9f6ac7ea19eaef746d6182f0a47832930feb67e798776aca2d29ce047ac0683` |
| `src/app/admin/partners-panel.tsx` | `dbff66e46a8ba5402a4504cb5f5999c2c6a8ea52ffe1667ab773d20b42966e86` |
| `src/app/admin/reviews-panel.tsx` | `a6c2d3f8bcadf708de8fa47b1462a258d9e636ebf529e63948f962c6830fd663` |
| `src/app/admin/website-editor.module.css` | `b8b1717847bcac328d091b4176524089106ff91c5d424948eed4b27e9e1e25c3` |
| `src/app/admin/website-section-card.tsx` | `67fa45c9d6a0476392f9f5549f254a5dfe4eef5ba68b07152a94af6242d16bd1` |
| `src/app/admin/website-workspace.tsx` | `3993c6db00e558b8696190a81218ebb3bc004097defbeedcdcee049d24766098` |
| `src/components/public/partners-section.module.css` | `4fd14112856a0e738158f55d041641d559c7afdae2547dd4a94cb3791f945949` |
| `src/components/public/partners-section.tsx` | `c339248b791c768a2abacb3ef58d58e360557bc069ed45cd07ab103a7f899c65` |
| `src/modules/identity/admin-navigation-layout.ts` | `30981beea3fe5adb8ce4a45f1599fee099f602c9ae43103e9cc1b8bb6289213d` |
| `tests/components/admin-navigation-context.test.mjs` | `6086d980b920e4f010f3809cd48eb29703b24a8d5dcbfdecff0858ea6eb4b316` |
| `tests/components/admin-navigation-phase-a.test.mjs` | `afd11013e6a28918d56cfda0efe2a60bf899fdfdc5a18a41efd2fcabb02e9fe5` |
| `tests/components/admin-warm-minimal.test.mjs` | `fe37115cfd2df7060d166cc562d3d7fca20555b1547f7b3a26b0d0484a7e55eb` |
| `tests/helpers/admin-navigation/browser-fixture.tsx` | `75c10b4139f3e527d3ab75747751bd1eda771cf719f618378ddaf506469f0e2f` |
| `tests/identity/admin-navigation-phase-a.test.mjs` | `70db57a24c2d0b3c6b0b44d90285267f19f59800b272ac5c1bc52a13e9dbee4a` |

This new report and the earlier blocked release result are **additional local documentation only**, outside the 34-path candidate. The final working-tree delta against Production is therefore 36 paths. Publishing either additional report would require explicitly including it in the reviewed publication scope; no hidden manifest expansion occurred.

Protected paths equal Production: availability/booking modules and APIs, all Supabase migrations/schema/RLS, role/authorization/section registry, mutation actions, delivery/notification services, dependencies/lockfile, CI, Next/Vercel configuration and external tracking code. The only public component delta is Partners CSS and image sizing. Changed admin panels retain queries/actions/payloads and add presentation/status styling only. No new route, environment file, secret, package or backend function is included.

The CMS PR #21 implementation is already in the baseline and is not duplicated or replayed. Its migration and ledger are untouched. Website publication/SEO ownership, Catalog retirement/compatibility, Calendar pricing authority and entity-specific lifecycles remain intact.

The five other isolated source/report checkouts retained their HEAD, full Git-status text and every previously dirty/untracked file hash from this verification's initial snapshots: Phase A (25 files), duplicate Warm Minimal (24), Partners (3), CMS (3) and SEO (1). The original IDE checkout remains `ffd26dd48a0227bca38969c8aa7433838a137e2e` with 125 status entries and was not edited; no full byte-identity claim is made for its unrelated dirty files. No reset, cleanup or staging occurred in another checkout.

## 8. GitHub and Vercel safety gates

Fresh authenticated read-only inspection confirmed:

- PR #22 is still Draft, one commit / 11 files at old head `8ce96c0`, with three successful statuses and no merge conflict. These checks do not cover the uncommitted integrated candidate. No ready-for-review, comment/body edit or merge action was selected.
- Production tracks **main**; Preview tracks **all unassigned git branches**. Preview is not assumed isolated.
- Ignored Build Step is saved as **Only build production** with `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`. Node 24 and normal build overrides remain unchanged. No repository override is introduced. Strict F10 stays outside the normal build command.
- Existing Preview record `dpl_FupQz4bVygc8L7o5nvydag3gyHMK`, source `8ce96c0`, remains Canceled / Build Canceled, explicitly skipped by Ignored Build Step; Visit is disabled. This corroborates saved suppression. No new push was used to test it. Earlier historical Preview artifacts are not isolation evidence.
- Vercel shows **No checks configured** under Deployment Checks. Main-push GitHub CI must not be assumed to delay automatic Production promotion. Exact candidate PR CI must be obtained before any later approved merge.

The recorded workflow remains Node 24, install/check/test/production audit, localhost development origin and communications/indexing disabled, with no deploy/migration step. No required check or protection was relaxed. No cloud environment value or delivery/scheduler configuration was changed.

## 9. Rollback readiness

[Current Ready artifact](https://vercel.com/aleksander-marleci/sightseeing-shkodra-web-app/HGQ8hKBLiZa9qLgdcQt58JXTncpv) remains Latest / Production / Current, source `c3020c566f167af4d0ef87e9aa33d4d0adb0d367`, with the public domain assigned. Project overview exposes an enabled **Instant Rollback** button; retention settings show 30 days. No rollback control was activated.

This verifies artifact presence and UI availability now, not a performed rollback or guaranteed future retention. Recheck before any separately approved release. After a later approved deployment, this artifact is the application-level fallback reference; verify ID/source before any separately authorized rollback, then perform safe read-only recovery checks. No database reversal, F04 migration rollback, ledger rewrite or main reset is part of this UI release.

## 10. Decision and stop

| Gate | Decision |
|---|---|
| Revised non-mutating availability procedure | **PASS** — local functional plus hosted read-only/source evidence |
| Fresh integrated seven-width local visual scope | **PASS** — synthetic/component scope and limitations above |
| Required local automated checks / exact 34 hashes | **PASS** |
| Backend, permissions, CMS and independent map preservation | **PASS for candidate source/actions performed** |
| Full accessibility validation | **INCOMPLETE / FAIL completeness** |
| Hosted operational/persistence acceptance | **NOT CLAIMED** |
| Preview suppression / available application fallback | **PASS at inspected checkpoint** |
| Fresh integrated remote CI | **PENDING separate publication authorization** |
| Publication / PR update | **NOT EXECUTED; authorization required** |
| Merge / Production deployment | **NO-GO at this checkpoint; not authorized** |

**GO to request separate authorization to commit/push the verified 34-path candidate to the existing Draft PR #22 for fresh CI and review only.** Keep the earlier blocked report and this acceptance report local unless their publication is explicitly included. Do not create a competing PR or mark #22 ready under this recommendation.

After publication is separately authorized, recheck remote base/head and suppression, publish only the reviewed scope, obtain successful exact-head CI and verify that any provider record is skipped. Stop again before readiness promotion, merge or Production deployment. Those require a separate decision that acknowledges the remaining accessibility/runtime limitations and a refreshed rollback checkpoint.

**No Production release occurred.**
