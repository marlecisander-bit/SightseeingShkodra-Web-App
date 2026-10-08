# Migration reconciliation — read-only inspection

## Current baseline — 8 October 2026, superseding historical findings below

Source baseline is main/origin/main `18c48d0d88736de7dc9aae3a6fd7c8feb0054022`; dependency security patches are already published. The approved credential rotation subsequently redeployed this same source and revoked the exposed server key. Old deployment snapshots require current credentials before rollback. No secret values belong in these documents.

The fresh read-only **44-migration** comparison found matching final application structure: 350 columns, 121 indexes, 264 comparable constraints, 38 triggers, 27 policies, 34 RLS tables and 89 functions with equivalent executable definitions. `bookings.meeting_point_snapshot` exists. The previously reported email-function drift and proposed function replacement are **superseded; do not execute that repair**. Seven migration-history entries remain unrecorded; eleven explicit service-role trigger grants differ. Neither is permission to replay SQL or change privileges. Historical QR aggregate checks were clean but are not a fresh data audit.

Production Auth URLs were corrected under separate approval. Production delivery is observed active; preserve it. Inbox acceptance, historical data-update provenance, isolated functional development/Preview, CI/protection activation and hosting eligibility remain pending. Owner declined new/duplicate backends. Local production mutation bindings stay unset; communications stay disabled locally/Preview. The historical statements below describe their original inspection stage, including obsolete commit IDs, dependency-release status and disabled-delivery advice; they are not current operational instructions.

See [reconciliation proposal](SUPABASE-RECONCILIATION-PROPOSAL.md), [controlled acceptance](PRODUCTION-ACCEPTANCE.md) and [review packet](READINESS-RELEASE-REVIEW.md). No migration/history/grant/cloud change is authorized by this update.

## Historical record — preserved, superseded where noted above


## Current baseline warning — 8 October stage-B preparation

The detailed comparison below is historical: 42 repository migrations versus 35 hosted records. Current repository has 44 migrations; the hosted dashboard audit recorded 37, including 20261006000200_public_admin_connections and 20261006000300_meeting_point_versions. The meeting_point_versions table and non-null bookings.meeting_point_snapshot were observed, so the earlier missing-column prerequisite is stale. Fresh all-44 function/grant/schema comparison remains unverified. Do not apply the earlier email-function drift correction blindly or replay the seven missing entries.

A new isolated reference was generated at /private/tmp/shkodra-schema-reference-44.json; the existing private/schema-reference-42.json and historical exports remain preserved. Stage-A guards now reject production in hosted development scripts; they still require explicitly approved isolated bindings and mutation opt-in. No production migration or history repair is authorized.


8 October 2026. Target: production website `ybngoppqqiohcduojfyg`. No migration or history repair applied. Repository baseline `f4f0ded`, local maintenance branch `maintenance/mac-readiness-2026-10-08`.

All 42 repository version IDs were compared to 35 hosted history entries: seven are absent. The owner's attached catalog export has now been compared to the isolated 42-migration reference. The seven entries' final schema effects are present; they are missing history records, not missing structural migrations. Do not replay them. This is final-state equivalence evidence, not proof of the historical execution method or permission to repair history.

## Completed catalog comparison

| Category | Result |
| --- | --- |
| Columns/types/nullability/defaults | All 344 match |
| Indexes | All 119 match |
| RLS/table SELECT permissions | All 33 table records match |
| Policies | All 27 match |
| Triggers/enabled state | All 36 match |
| Comparable constraints/validation | All 261 hosted entries match exactly |
| Extra reference constraint records | 267 NOT NULL catalog entries; all corresponding column nullability matches. This is a catalog representation difference, not absent nullability. PostgreSQL 18 added table NOT NULL entries to pg_constraint; the follow-up asks for hosted server version. [Release notes](https://www.postgresql.org/docs/18/release-18.html). |
| Function identity/result/security-definer/search_path config | All 82 match |
| Function bodies | 58 exact MD5 matches; 23 hosted hashes match the repository bodies after LF→CRLF conversion; one confirmed substantive body difference |
| anon/authenticated function EXECUTE | All match; no extra browser/public-role execution observed in the exported fields |
| service_role function EXECUTE | 11 trigger-returning functions are executable in hosted but not in the test reference; other grants match. Follow-up ACLs show direct postgres-granted service_role EXECUTE, not inherited owner privileges. Historical grant timing/default-privilege origin is not established. |

The differing function is `public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb)`, from the recorded transactional-email completion chain. Follow-up source comparison shows the hosted function adds `meetingPoint` from `b.meeting_point_snapshot` and removes a comment; other text matches after line-ending normalization. No such column exists anywhere in the exported schema, including bookings. An isolated `EXPLAIN SELECT b.meeting_point_snapshot FROM public.bookings b` against the full reference returns SQLSTATE 42703 (undefined column). The hosted function therefore has an invalid reference in its fresh version-2 preparation branch. No hosted function invocation or mail send was attempted. This drift is separate from the seven absent history entries.

Email/background delivery must stay disabled. Prepare a separately reviewed forward correction restoring the repository function body, rehearse with synthetic version-2 email preparation, and obtain explicit production SQL authorization before any hosted replacement. Do not add an unexplained column or enable delivery to test this path. Existing 356 local tests passed against repository SQL; they do not certify the drifted hosted function.

The 11 service-role differences involve trigger-returning guard/history/update/email-capture functions, including `guard_booking_pass_v1`. No corresponding anon/authenticated grant expansion was found. Their trigger definitions and bodies match (allowing the identified line endings). Follow-up shows owner postgres, explicit `{postgres=X/postgres,service_role=X/postgres}` ACLs and service_role_inherits_owner=false on these functions. This resolves the current grant mechanism; whether grants originally came from default privileges or manual SQL remains unknown. Treat it as a documented least-privilege difference for separate review; do not silently revoke grants. Trigger-returning functions cannot be invoked as ordinary RPC functions, and the browser-role permissions match.

Private evidence: `private/hosted-schema-audit.json`, `private/schema-reference-42.json`, and `private/schema-comparison.json`, all ignored; no function source/credentials included in this report. The follow-up returned hosted PostgreSQL 17.6, explaining the NOT NULL catalog representation difference relative to the PostgreSQL-18-style PGlite reference. All four aggregate QR checks return zero: invalid QR shape, invalid check-in shape, cross-operator check-in actor, and historically confirmed bookings without QR. This verifies current invariants, not historical execution provenance. Auth, Storage and end-to-end application acceptance remain unverified.

## Seven absent history entries

| Migration | Reconciled final-state evidence | Classification |
| --- | --- | --- |
| `20260924000100_booking_qr_pass` | Columns, unique/composite operator FK, shape constraints, trigger, guard and resolve function bodies match; resolve browser/service execution matches. Guard has the noted additional hosted service-role grant. | Existing unrecorded schema; all four current QR/backfill/check-in invariant checks PASS (zero violations). |
| `20260924000200_manual_reviews` | All review columns/nullability/defaults/checks/indexes and review_settings schema/RLS/policies/exported permissions match | Existing unrecorded schema. |
| `20260924000300_cms_reconciliation` | inclusions column/constraint and final save_catalog body/security/exported grants match | Existing unrecorded effects. |
| `20260924000400_homepage_hero_v2` | Hero helper and public homepage projection bodies/config/grants match | Existing unrecorded effects. |
| `20260928000100_homepage_visibility` | Effective private validator chain body matches the full 42-migration reference | Existing final-state effects; earlier function definition superseded. |
| `20260930000100_global_footer` | Effective private validator chain body matches the full 42-migration reference | Existing final-state effects; earlier function definition superseded. |
| `20261001000100_faq_route_link` | Effective private validator chain body matches the full 42-migration reference | Existing final-state effects; earlier function definition superseded. |

The recorded WhatsApp migration preserves the preceding validator as `private.validate_website_before_whatsapp_v1`; the recorded managed-FAQ migration adds another wrapper via `private.validate_website_before_faq_v1`. The public validator visibly calls the FAQ private helper. Compare the entire final effective schema from all 42 migrations, including this private helper chain, rather than expecting the current public function to equal an earlier superseded definition.

## Private catalog comparison

Both exports are received, saved privately and compared. The completed narrow checks used [SCHEMA-AUDIT-FOLLOWUP-READONLY.sql](SCHEMA-AUDIT-FOLLOWUP-READONLY.sql) as a whole and save its result privately as `private/hosted-schema-followup.json` (or CSV). It returns the one unresolved function definition, trigger-function ACL metadata, hosted server version and aggregate-only QR/check-in violation counts. No mutations occur. The initial [SCHEMA-AUDIT-READONLY.sql](SCHEMA-AUDIT-READONLY.sql) remains available for reproducibility. It uses BEGIN READ ONLY, catalog SELECTs and ROLLBACK; it reads no application records and returns function body hashes instead of source text. Export its single `schema_audit` JSON value (or CSV cell) to ignored `private/hosted-schema-audit.json` / `.csv`. Do not paste into chat or commit. A reference generated from all 42 migrations in isolated PGlite is at ignored `private/schema-reference-42.json`; the temporary database was closed. The query has been successfully executed against that reference.

Compare objects by stable table/name/argument identities, not OIDs/order. Allow explicitly documented platform/extension objects and platform-owned ACL differences; compare business function bodies, security-definer/search_path, effective anon/authenticated/service grants, RLS, policies, columns/defaults, indexes, constraints/validation and triggers. A hash mismatch needs private definition inspection before declaring semantic drift; formatting can differ. This snapshot does not prove data invariants or Auth/Storage platform configuration.

## Reconciliation plan — no production execution authorized

1. Catalog and QR invariant comparison is complete. Preserve the confirmed email-function drift and direct service-role trigger grants as separate findings; no missing structural effects were found for the seven unrecorded entries. Preserve private evidence. Do not run existing hosted setup/seed scripts: they hardcode this production ref.
2. Rehearse the full 42-migration chain on a new approved empty isolated backend, seed synthetic data and run booking/admin acceptance.
3. All seven absent entries have matching final effects (allowing the documented extra service-role trigger grant) and QR invariants pass. They are candidates for migration-history repair only after separate reviewed evidence, a backup/rollback plan and explicit approval. Correct/rehearse the separate email-function drift through a reviewed forward change; repairing history will not fix that drift. Repair changes hosted history and needs separate owner approval.
4. If an effect is missing/drifted, prepare a targeted forward reconciliation migration. Do not replay all seven: older validator replacements could regress WhatsApp/FAQ behavior, and existing tables/columns can collide. Preserve later functions and operator security. Review/rehearse before any production proposal.
5. If only later superseding definitions are present, document provenance and verify the complete effective contract before deciding whether to mark the earlier entry applied. Never mark unimplemented structural/data effects applied just because a newer migration is recorded.
6. Obtain explicit production authorization for any future SQL/history action. This inspection does not certify production schema or deployability.

## Complete version comparison

| Repository file | Hosted migration history |
| --- | --- |
| `20260917000100_core_schema.sql` | Recorded |
| `20260920000100_inventory_holds_and_states.sql` | Recorded |
| `20260921000100_staff_roles.sql` | Recorded |
| `20260921000200_operator_access_policies.sql` | Recorded |
| `20260921000300_outbox_and_audit_foundations.sql` | Recorded |
| `20260921000400_availability_snapshot.sql` | Recorded |
| `20260921000500_transactional_holds.sql` | Recorded |
| `20260921000600_pending_checkout.sql` | Recorded |
| `20260921000700_booking_confirmation.sql` | Recorded |
| `20260921000800_cancellation_hooks.sql` | Recorded |
| `20260921000900_catalog_management.sql` | Recorded |
| `20260922000100_departure_management.sql` | Recorded |
| `20260922000200_content_management.sql` | Recorded |
| `20260922000300_staff_manual_booking.sql` | Recorded |
| `20260922000400_non_retryable_stale_edits.sql` | Recorded |
| `20260922000500_public_homepage_snapshot.sql` | Recorded |
| `20260922000600_meeting_point_bookings.sql` | Recorded |
| `20260922000700_product_pricing_editor.sql` | Recorded |
| `20260922000800_notification_delivery_queue.sql` | Recorded |
| `20260923000100_structured_homepage.sql` | Recorded |
| `20260923000200_service_schedules.sql` | Recorded |
| `20260923000300_schedule_inventory_identity.sql` | Recorded |
| `20260924000100_booking_qr_pass.sql` | ABSENT |
| `20260924000200_manual_reviews.sql` | ABSENT |
| `20260924000300_cms_reconciliation.sql` | ABSENT |
| `20260924000400_homepage_hero_v2.sql` | ABSENT |
| `20260925000100_resend_booking_emails.sql` | Recorded |
| `20260925000200_dynamic_destinations.sql` | Recorded |
| `20260925000300_calendar_passenger_pricing.sql` | Recorded |
| `20260925000400_calendar_inheritance_guards.sql` | Recorded |
| `20260925000500_email_worker_readiness.sql` | Recorded |
| `20260925000600_booking_seats_and_cutoff.sql` | Recorded |
| `20260925000700_customer_booking_management.sql` | Recorded |
| `20260925000800_booking_calendar_guidance.sql` | Recorded |
| `20260928000100_homepage_visibility.sql` | ABSENT |
| `20260930000100_global_footer.sql` | ABSENT |
| `20261001000100_faq_route_link.sql` | ABSENT |
| `20261005000100_admin_notifications.sql` | Recorded |
| `20261005000200_whatsapp_contact.sql` | Recorded |
| `20261005000300_fix_whatsapp_private_permissions.sql` | Recorded |
| `20261005000400_transactional_email_completion.sql` | Recorded |
| `20261006000100_managed_faq.sql` | Recorded |
