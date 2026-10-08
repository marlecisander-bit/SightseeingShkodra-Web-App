# Controlled booking and notification acceptance — prepared, not executed

Baseline 18c48d0. No test booking, capacity change, check-in, cancellation or email send is authorized by this document. Do not copy production data or provision a new backend. Existing 366-test release evidence and six freshly passed guard regressions are not hosted end-to-end acceptance.

## Approval packet

Privately select a customer-controlled test inbox and confirm access/consent for the existing configured owner inbox. Record their actual addresses only in a password manager/private local evidence, never chat/Git/report. Agree on a specific existing low-demand future departure, its time zone, available seats, no payment, test window and cancellation cleanup. Production synthetic records persist in audit/history; cancellation must retain this history, not delete records. Do not create a departure, staff user, operator or other production resource without distinct approval.

Proposed bounded smoke: at most one synthetic unpaid booking, one modification before the 15-minute cutoff, one cancellation; up to two role-specific notifications per event (six automatic emails total), plus at most two approved manual resends if dedup/receipt investigation requires them. No global recipient override, flag switch, scheduler invocation, secret rotation, provider key change or deployment. If existing configuration routes to any uncontrolled address, stop. Use a clearly marked synthetic contact/name, no real customer data; email subjects/content must match actual app behavior, not an invented safety label. Keep management URL/QR token/provider message IDs in private evidence only.

## Cases and evidence

| ID | Case | Expected evidence | Execution boundary |
|---|---|---|---|
| B1 | Create one Adult unpaid meeting-point booking | Server-quoted price/schedule retained; one confirmed order/booking; exactly one occupied seat; management link; persisted opaque QR; repeated submit idempotent | Approved single production smoke only; no charge |
| B2 | Capacity eight, adults/children/infants, accompanying adult | Eight seated accepted, ninth rejected; infants occupy zero; adult requirement enforced; two final-seat attempts cannot oversell | Existing disposable database/concurrency tests; do not saturate real departures |
| B3 | Modify permitted passenger mix/date before cutoff | Atomic allocation move/reprice, booking identity retained, appropriate version change; same-departure update does not leak seats | Production only within approved low-risk booking scope; approve target departure if changed |
| B4 | Cancel unpaid booking before cutoff | Terminal cancellation, exact occupied seats released once; repeated cancel idempotent; management status matches | Approved smoke cleanup; preserve records/audit |
| B5 | Cutoff and staff-only restrictions | Equality at departure minus 15 minutes closes customer mutations; paid/checked-in changes require staff | Clock-controlled disposable tests; no production clock/pricing/payment changes |
| Q1 | QR issued and persistent | Private scan resolves correct booking, no token exposed in logs/reports; canonical QR retained through supported changes | Read-only approved booking inspection |
| Q2 | Two devices check in same QR | Exactly one succeeds; correct actor/operator; cancelled/foreign token rejected | Disposable tests only unless a separate real check-in/data mutation approval is granted |
| E1 | Customer and owner creation notifications | Distinct intended recipients; actual messages arrive in both inboxes; correct booking reference, date/time, price/meeting point, QR/link | Requires bounded-send approval and both inbox-access confirmations |
| E2 | Customer and owner modification notifications | Each inbox receives updated details and reliable before/after information; booking/version match | Approved modification; wait for prior event delivery before next step |
| E3 | Customer and owner cancellation notifications | Both inboxes receive cancellation; no misleading active QR; booking/seat state agrees | Approved cancellation |
| E4 | Dedup/retry behavior | No extra event on repeated submit; mocked timeout/429/5xx paths preserve idempotent envelope, uncertain outcome bounded | Disposable/mocked tests; never trigger provider outage or production retry storms |
| S1 | Staff/operator authorization | Unauthorized roles and second operator cannot read/mutate/check-in foreign records | Disposable tests; no new production staff |

## Inbox delivery standard

Queue completion/worker heartbeat/provider accepted status alone is insufficient. For each of six event/recipient pairs, capture private inbox receipt timestamp, intended role, matching synthetic booking reference, correct body, working canonical management link and QR where appropriate. Check spam folders. Provider delivered webhook/status supports receiving-server acceptance but still does not prove inbox placement; owner/customer inbox confirmation is required. Review only the synthetic messages, never unrelated customer mail. If arrival is absent after ten minutes, mark PENDING/FAIL with the observed provider state; do not resend automatically. Keep tokens, addresses and screenshots private/redacted.

## Safe ordering

Confirm approvals, configuration/recipient identities, available seats and freshness first. Create; wait for customer AND owner creation receipts; modify once; wait for both modification receipts; cancel; wait for both cancellation receipts; verify seat restoration and no pending/failed synthetic jobs. Stop immediately on unexpected recipient, live inventory contention, wrong operator, duplicate charge, extra sends or schema error. Do not disable live workers globally as a testing precaution. No manual DB edits/deletes to clean up.

The admin diagnostic sends synthetic previews to EMAIL_TEST_RECIPIENT and does not drain the booking queue. It cannot prove actual role routing or all lifecycle delivery, and currently has no configured test recipient per prior read-only audit. Do not turn on a global production redirect merely to use that form.

## Minimal approval scope for this next step

No test is authorized yet. Proposed minimum: one synthetic Adult booking on one owner-approved existing future departure, then one same-departure modification to two Adults only if a second seat is explicitly approved/available, then cancellation before cutoff. If two seats are not approved, choose a separately agreed supported modification; do not invent editable fields or change departures. No check-in, payment collection, global configuration, departure creation, manual resend or worker invocation in the minimum scope. Exactly six automatic lifecycle emails maximum (customer and owner for each event); if actual configured routing includes additional recipients, stop before creation and revise approval. Owner-controlled inbox consent and private customer inbox are mandatory.

Record private before/create/modify/cancel seat observations: expected test contribution 0 -> 1 -> 2 -> 0. Use attributable booking/hold records to distinguish legitimate concurrent customer activity; total displayed availability may legitimately change independently. Wait for test holds to settle before final restoration evidence. Assert order/item cancellation and no active test hold, preserving audit history. If another booking changes availability, report the attributable restoration rather than claiming the raw number returned to its original value.

QR inspection must be read-only (resolve with check-in=false through an approved staff interface/port); scanning a control that marks checked-in is prohibited in this scope. If no non-mutating interface exists, document that limitation and request a separate scoped read-only verification mechanism. Check issued token persistence after modification and cancelled result after cancellation, without recording tokens in reports. No real check-in or scanner-race experiment.

Before creation require explicit departure/date/time Europe/Tirane, window safely more than 15 minutes before departure, maximum two occupied seats, permitted same-departure modification, existing owner recipient consent and private customer inbox confirmation. Approval includes cancellation cleanup even if a receipt is missing; if email acceptance fails, stop further test steps, cancel within approved scope and record failure. Do not leave inventory occupied while waiting indefinitely. No retry/resend allowance by default. Original expanded protocol above is reference; this minimal scope overrides its optional resends and broader capacity/check-in cases.
