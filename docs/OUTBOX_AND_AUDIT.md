# Phase 1F outbox and audit foundations

Migration: supabase/migrations/20260921000300_outbox_and_audit_foundations.sql. The existing domain_events and audit_logs tables remain the source of truth; no parallel event store or external message service is added.

## Stored events

domain_events now includes actor_id, idempotency_key, schema_version, attempt_count, next_attempt_at and last_error_code. Composite actor foreign keys preserve operator ownership. A null actor denotes an explicitly system-originated event; the staff adapter always supplies a verified staff profile.

The unique (operator_id, idempotency_key) constraint deduplicates persistence. A retry with identical event identity, actor, payload and schema version returns the original ID. Reusing the key with different data fails with SQLSTATE 23505. Use a stable command/event key, not a new UUID on every network retry. Distinct logical events need distinct keys even if they concern the same entity.

New keys on old rows are populated with generated UUID strings by the migration. That preserves existing records but cannot reconstruct historical caller request keys. Future RPC callers must explicitly provide a meaningful stable key.

An event's operator, actor, entity, event type, payload, version, creation time and key are immutable. Pending events may update retry metadata and eventually published_at. Attempt counts cannot decrease; published events cannot change, and events cannot be deleted through ordinary DML. The partial due-event index supports a future worker.

No worker, lease/claim algorithm, subscription fanout, scheduler, dead-letter workflow or external notification is implemented here. published_at will mean durable outbox dispatch completion, not proof that every customer notification was delivered. A later integration must track per-consumer delivery/idempotency independently and handle worker crashes with at-least-once delivery. The current retry columns are persistence foundations, not a functioning queue processor.

## Audit history

audit_logs receives its own operator-scoped idempotency key. Repeating an identical audit write returns its original ID; changing action, actor, target or metadata under the same key fails. All updates and deletes are rejected by a trigger, and service_role loses UPDATE/DELETE rights. Database administration can still disable triggers or alter schema; this is application-level append-only history, not protection against a database administrator.

Audit data should identify the action, target, changed field names and a useful non-sensitive summary. Do not copy passwords, tokens, service secrets, payment payloads or unnecessary customer personal data into metadata. last_error_code accepts short machine codes such as provider.timeout, not provider error messages. The helpers validate JSON object shape but do not automatically redact content. Retention/redaction procedures need an explicit reviewed policy rather than ad hoc deletes.

## Persistence helpers

| Function | Purpose |
| --- | --- |
| enqueue_domain_event | Insert an event or return the identical existing event |
| append_audit_log | Append an audit entry or return the identical existing entry |
| record_domain_activity | Save the event and audit entry atomically using one key and target |

All functions use invoker rights, an empty search_path and fully qualified tables. Only service_role can execute them through the API; anon/authenticated callers are denied, even staff owners. Existing read policies and operator-scoped audit visibility remain unchanged. Direct privileged inserts remain possible; domain code must use the helpers to obtain their idempotency behavior.

persistStaffActivity in src/modules/integrations/activity.ts is server-only and calls record_domain_activity once. It uses operatorId and staffProfileId from the verified StaffContext, not extra fields in the supplied activity. Its client and context must come from an already-authorized server operation such as withOperatorService; the adapter itself is not an authorization endpoint. System workers will require a separate verified entry point and may use null actor IDs. Polymorphic entity IDs still require domain validation to prove the entity belongs to the chosen operator; the SQL foreign key only verifies actor ownership.

## Transaction boundaries

record_domain_activity commits or rolls back the pair together. If the audit write fails, the new event is also rolled back. The individual helpers also participate in an outer SQL transaction, so future booking/admin transaction functions can change business records, persist events and append audit entries together.

**A separate Supabase update followed by the activity RPC is not one transaction.** Future production mutations must call the SQL helpers inside the same transaction as the mutation. The TypeScript adapter guarantees only the event/audit pair; it must not be used to claim a separately submitted business update was atomic. No existing product or booking mutation endpoint is automatically audited by this phase, because none has been implemented.

Do not send notifications inside the business transaction. A later worker may retry dispatch without undoing committed booking/payment data. The helper's conflict handling is intended for PostgreSQL READ COMMITTED; callers at stronger isolation levels must retry whole transactions on serialization failures. Multi-connection races remain part of full PostgreSQL/Supabase validation.

## Checks and limits

npm test runs identity, adapter and database suites. Database tests cover scoped actor identity, duplicate and conflicting commands, atomic failure and outer rollback, immutable history, retry/publication metadata, tenant-scoped keys and RPC permissions. Adapter tests verify verified-context arguments, single RPC invocation, response validation and sanitized errors.

These checks use embedded PostgreSQL and mocked RPC responses, not a hosted Supabase project or real notification transport. No production data, credentials, email or WhatsApp settings were touched. Worker concurrency, delivery, outbox retention and automated auditing of future business mutations remain later work.
