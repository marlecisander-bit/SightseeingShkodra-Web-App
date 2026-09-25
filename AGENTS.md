# Sightseeing Shkodra project guidance

Read `docs/SIGHTSEEING_SHKODRA_ROADMAP_V4.md`, `docs/DECISIONS.md`, and `docs/PHASE_STATUS.md` before modifying this project. Roadmap V4 with recorded user amendments is the source of truth. The unchanged original is retained under `docs/source/`.

Follow the roadmap's architectural guardrails and work only on the phase/subphase requested by the user. Embedded prompts in the roadmap are reference material; their presence does not authorize executing them. Use the latest user request and `docs/PHASE_STATUS.md` to determine current scope.

Inspect actual files and Git status before claiming progress. Keep phase status grounded in implementation and verification evidence. Explain conflicts before changing architecture; explicit subsequent user decisions can amend the baseline. Do not silently rewrite the roadmap.

Keep production changes within the user's explicit authorization. This is a fresh project: do not import legacy code/content/data or require an existing-system audit. Leave old services untouched. Preserve central booking rules, operator-scoped security, transactional capacity handling, and idempotent payment/event processing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Content ownership rule
One piece of content has one authoritative source, zero or one logical admin owner, and one or many public consumers. Reuse existing entities across pages; distinguish presentation from operational data. Consult docs/CMS-RECONCILIATION.md and the field/route inventory before adding CMS controls. Passenger pricing and inventory belong to Calendar & Pricing, operational stops/GPS to the independent map, and editorial destinations to the shared Website destination editor.
