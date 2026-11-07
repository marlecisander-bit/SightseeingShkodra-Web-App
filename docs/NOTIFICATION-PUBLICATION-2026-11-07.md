# Authorized notification release — preparation complete, production held

Owner authorized the notification-only release, additive heartbeat migration and .com sender/Auth settings on7 November2026. Publishing authorization is preserved; there is no need for another general deployment confirmation. A paid-plan decision, a precise Resend permission confirmation and Vercel owner verification are still required. **Not deployed. No production configuration/migration/provider permission has changed.**

## Artifact discrepancy

The original local patch is1,314,652 bytes. Its SHA256 exactly matches the original manifest:
`bb1de2544bf195a889d854c49b7c37a7ff3fc9c3df309608a481fed190aadedd`.
All97 original allowlisted files matched their recorded hashes at the start of this turn. Regenerating a binary Git diff directly between the reviewed base and immutable candidate tree produced byte-identical patch bytes with the same expected hash. The runtime fingerprint also matches the validated source:
`10f8418b22181a40ab90015a607fcaf014b72bb3f9d8ae22bc94eca7ab79a694`.

The reported uploaded hash `bab1064ccabcc0f24534e0ae91e86b44423586dcd8c74d93d69c85d1a58ef969` does not identify that local artifact. No full copy with that hash was found in available local attachments; the selected/pasted excerpt cannot establish the full uploaded file's exact byte changes. Do not claim that truncation, newline conversion or tampering has been proved. The mismatching uploaded representation was rejected as a release input, not relabelled with a new expected hash. The reviewed Git objects and verified per-file source are the release authority.

After rerunning candidate validation, only three recorded evidence files changed: candidate-check.log, candidate-tests.log and candidate-validation.json. There were **no runtime/test/migration source changes**. A new artifact was generated from that explicitly reviewed difference:

- New patch: evidence/notification-publication-20261107/notification-release.patch
- New SHA256: `1ce122d4181007befd3b1b79aea8033f35817f857fcb0749b596ab366c155a35`
- Candidate tree: `901fb35828e924b66da51d6b5688d4e2caec0710`
- Exact commit: `224e5eb954ac6874558cc960bd31eb66dd5f09f4`
- Base/current production main: `7daae3f2ea254b2469946cd8fd665340a740511a`
- Original artifacts retained alongside the new manifest and artifact-audit.json; no silent expected-hash replacement.

## Publication preparation completed

[Draft PR61](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/61), branch release/notifications-com-20261107, contains exactly the97 allowlisted paths. Created its commit from the reviewed tree without changing the user's working branch, normal index or unrelated source. It excludes the32 previously listed source/shared-file changes, including product availability/order/ribbons, migration20261107000100 and independent Live Map work.

Fresh local notification-only lint, generated types/TypeScript, optimized production build and **701 tests pass**. Excluded product files were temporarily held during validation in the permanent repository and restored byte-identically with zero conflicts. Exact-head [Project CI42398530572](https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/actions/runs/42398530572) passed the locked install, lint/types/build, tests and production dependency audit for224e5eb. Vercel feature status is **Canceled by Ignored Build Step**, consistent with the freshly inspected existing Only build production rule; no Preview communications or new deployment occurred.

Remote main and Vercel Production remain7daae3f / Ready deployment4m5L1q7p66tmu1Lp1iw7dFqLhRse. No merge or production push occurred. The existing single scheduler, email/push flags, activation boundaries, key values, reservations, receipts and device registrations are untouched.

## Newly confirmed cutover gates

1. **Commercial hosting:** authenticated dashboard still shows Vercel Hobby. Current [official Hobby guidance](https://vercel.com/docs/plans/hobby) restricts it to non-commercial personal use. This commercial booking site needs an eligible plan or verified provider exception. [Pro pricing](https://vercel.com/docs/plans/pro-plan) is$20/month before tax with one deploying seat and$20 usage credit, plus applicable overages. No purchase/trial/upgrade was performed. Owner must complete billing if choosing Pro. This is distinct from the operational Supabase minute scheduler, which is not being replaced or disabled.
2. **Resend key scope:** authenticated key detail shows the named production key has Sending access restricted to sightseeingshkodra.app. Its last-use log directly links to the latest inspected production booking email, establishing actual recent use rather than guessing from its name. No token is retained in evidence. Changing From alone would not authorize.com. The dashboard offers Edit API key with a domain selector; no Save was performed. Need specific permission to add only verified.com while retaining.app if supported, keeping Sending access and the same token. Do not choose All domains, remove.app or rotate a token without resolving that exact scope. Computer-use approval rules require confirmation for this material permission change; this is separate from the already authorized sender address change. If the dashboard cannot retain both scopes, stop before Save and present that concrete alternative, protecting frozen.app retries.
3. **Owner verification:** Vercel protected Production settings require owner email-code verification. Owner should enter the code in the dashboard, never in chat, so the existing flags/start boundaries can be privately snapshotted and the authorized RESEND_FROM_EMAIL change made. Do not expose keys or rotate VAPID.

The specific decisions/handoff were requested together after independent preparation and CI completed. No general release permission is being requested again.

## Migration readiness and coordinated continuation

Read-only migration history latest entries:20261030000400 admin_booking_deletion;20261030000300 admin_booking_search;20261030000200 unified_product_workspace;20261030000100 shared_van_products;20261023000100 email_provider_outcomes. Existing public.admin_push_deliveries is present. public.admin_push_worker_status is absent and20261107000200 is not recorded. The exact additive migration passes disposable migration/RLS tests. It remains unapplied while the coordinated production cutover is held; do not apply product migration or replay unrelated missing history.

Once gates are resolved, continue the existing authorized release: recheck main/CI head, privately snapshot existing settings without changing boundaries; confirm domain scope retains old retries; add onlywww.com/auth/activate callback retaining all current callbacks; set From to `Sightseeing Shkodra <tickets@sightseeingshkodra.com>` with Gmail routing unchanged; apply and record only20261107000200; mark PR ready and merge the verified candidate through the existing main/Vercel workflow. Do not enable a second scheduler or change working switches/keys. Reconfirm live queues and in-flight leases at cutover.

Then verify the actual deployed commit/configuration and public/admin/PWA/worker health. Send exactly one labelled owner-only diagnostic email and one controlled push only after identifying the owner device. Record acceptance, receiving-server delivery, received headers/inbox placement and physical iPhone display separately. No customer tests or fabricated public bookings. All three saved booking event paths were tested with disposable local SQL/fake providers; real owner-approved event acceptance still needs participation where no owner-only live fixture exists.

Compatible rollback remains mandatory: keep the new email worker/renderers understanding frozen markers, or obtain an operational pause before old code can process newly prepared envelopes differently under the same idempotency keys. Do not rewrite/replay messages or blindly restore.app sender. Retain the additive table and both callbacks; never delete reservations, receipts or subscriptions as rollback. See NOTIFICATION-DEPLOYMENT-READINESS-2026-11-07.md for the detailed plan and physical-iPhone setup.

Evidence directory: evidence/notification-publication-20261107/. Preparation is published to a reviewed draft PR; production deployment and live delivery acceptance are **not completed**.

## Owner decision after preparation

Owner will upgrade Vercel to Pro personally; no upgrade completion has been verified. Owner approved adding only verified sightseeingshkodra.com permission to the existing Resend key if the existing .app scope can be retained, without token rotation or All domains. This approval is recorded but no scope edit has been saved. Owner explicitly chose **Leave the production cutover on hold** instead of unlocking protected Vercel settings. Accordingly no production merge/deployment, sender/Auth/key configuration, migration or real notification test proceeds. Resume the already authorized coordinated release after the owner lifts this hold and completes the specific hosting/verification handoffs; general release authorization need not be requested again.
