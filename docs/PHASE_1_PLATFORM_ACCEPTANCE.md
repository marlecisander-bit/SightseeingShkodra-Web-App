# Phase 1 platform acceptance

Date: 2026-09-21. Foundation integration result: PASS.

Run: `node --env-file=.env.local --import tsx scripts/verify-supabase-development.mjs`.

The runner imports the actual src/proxy.ts and uses NextRequest/NextResponse, Supabase SSR cookies and the hosted development Auth/PostgREST services. Verified:

- Real password sign-in, verified getUser identity and two-operator RLS isolation.
- Direct writes, raw outbox reads and protected RPC calls denied to session clients.
- Real refresh-token exchange and proxy refresh of a persisted session whose expiry is forced into the past.
- Refreshed cookies written to the response and forwarded on the request; forwarded identity verified with Auth.
- Private/no-store response headers for valid, malformed and unrefreshable sessions.
- Malformed cookies produce no verified identity; a stale session with a rejected refresh token is cleared.
- Role changes visible without sign-in; deactivation immediately removes operator access.
- Privileged RPC succeeds and duplicate requests return the same event/audit IDs.

The privileged RPC intentionally retains one synthetic operator, ID 20000000-0000-4000-8000-000000000001, and one immutable event/audit pair with key foundation-platform-verification-v1. No personal data is included. Other temporary operators, memberships and Auth users are deleted. Repeated runs reuse this pair. Negative cookie tests emit expected SDK warnings.

## Scope of acceptance

This verifies the current foundation proxy and platform integration. It does not claim a browser end-to-end test of an admin login screen: that screen belongs to a later phase and does not exist yet. Expiry is simulated in persisted session metadata; no signing keys are altered and no hour-long wait for a naturally expired JWT is claimed. A rejected refresh credential exercises session removal. Actual page navigation, cookie behavior in deployed browsers and future protected handlers need tests when those features are built.

No product behavior, schema or production settings changed. No manual user action is required for the next development phase.
