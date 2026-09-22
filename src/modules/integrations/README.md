# Integrations

Own persisted event delivery and retryable notification adapters. Phase 1F provides idempotent event/audit persistence and the server-only persistStaffActivity adapter. No external notification handler or worker runs yet. See docs/OUTBOX_AND_AUDIT.md for transaction boundaries and integration responsibilities.

Phase 5E adds a locally tested confirmation queue, renderer, provider ports and server-only RPC store. Sending is disabled by default. See docs/PHASE_5E_REPORT.md; run npm run notifications:preview for fictional text.
