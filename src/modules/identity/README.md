# Identity

Own operator context, staff roles and server-side authorization. Phase 1D provides the permission model and verified-session integration. Phase 1E provides scoped membership reads and an authorized server-only privileged callback. See docs/AUTHORIZATION.md and docs/DATABASE_ACCESS.md. Privileged callbacks must always filter resources by the verified operator context.
