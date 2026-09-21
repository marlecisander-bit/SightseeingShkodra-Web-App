# Phase 2F

Consolidated request/response/lifecycle types in contracts.ts; all existing booking adapters now import these shared types and retain compatible re-exports. Added BOOKING_API_V1.md as the unified operation, permission, retry, event, error and unit reference. No schema, environment variables or hosted changes in this phase.

No HTTP API is claimed: the implemented API is server-domain functions plus privileged SQL RPCs. Earlier reports loosely anticipated HTTP transport in 2F; the phase's actual shared-contract scope is implemented here, with HTTP/session/security handling left to the consuming interface phases. Browser and AI.TEP integration do not yet exist and are not marked tested.

Validation: npm run check passed (lint, typecheck and production build). The complete local suite passed 88 tests. Shared types required no database migration or hosted data changes.
