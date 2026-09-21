# Phase 2A

Implemented versioned availability types and validation, EUR-cent pricing, server-only getAvailability, and read_availability_v1 in migration 20260921000400_availability_snapshot.sql. Contract: BOOKING_AVAILABILITY_V1.md.

Added seven database/domain tests for zero/one-seat boundaries, guest validation, price safety, tenant/draft filtering, naturally elapsed holds, confirmed/pending items, past/closed departures and RPC permission denial. Full suite: 81 tests pass. Initial expiry fixture was corrected to insert a valid hold then wait for expiry, preserving lifecycle guards.

No environment variables, production changes, payment code or UI changes. Migration initially verified in disposable embedded and native PostgreSQL databases. No reservation guarantee: Phase 2B transactional holds is next. HTTP adapters remain Phase 2F.

Lint, typecheck and production build pass. The first build encountered a transient Windows EBUSY lock in .next diagnostics; the rerun passed. After tightening rejection of unknown pricing fields, the seven affected tests were rerun and passed.

Development deployment: CLI dry-run listed only 20260921000400_availability_snapshot.sql, then push applied it successfully to the linked development project. No product data or price was changed. The actual server adapter against hosted Supabase returned the expected NOT_FOUND for a nonexistent product. Saleable-data calculations are covered by disposable database tests; no real selling price is configured yet.
