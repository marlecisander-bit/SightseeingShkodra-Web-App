# Phase 0.5 existing systems audit

Status: SKIPPED by the fresh-project decision in DECISIONS.md. The partial observations below are historical; missing legacy evidence no longer blocks Phase 1A. This is not a passed legacy audit.

## Observed evidence

The workspace inventory contained README.md, AGENTS.md, CLAUDE.md, the roadmap, its retained DOCX/text extraction and the phase checklist. It contained no application code, package manifest, migrations, test suite, deployment configuration or existing tracking implementation. The initial `git status --short --branch` reported that the directory was not a Git repository.

The roadmap names Next.js/TypeScript, Supabase, Vercel, Stripe and Leaflet/OSRM. Those are requirements; the current tracking technology and actual production schema remain unverified. No external service has been accessed or changed.

## Reuse decisions and missing evidence

| Area | Roadmap direction | Evidence needed before final decision |
| --- | --- | --- |
| Tracking | Reuse existing tracking through shared public view/admin manage components | Source files, dependency versions, position writer/reader, subscriptions, route service configuration |
| Position storage | Preserve the existing vehicle_positions source of truth | Actual tables, keys, ownership, RLS, realtime configuration and update flow |
| WordPress content | Migrate useful content and preserve indexed URLs | Sitemap, Search Console export, metadata, media rights/alt text and page inventory |
| Existing ticketing | Replace through the unified booking domain at the scheduled phase | Provider integration, open orders, fulfillment and transition requirements |
| Booking domain | Implement the V4 shared booking API where no compliant implementation exists | Existing code/schema inspection; no reusable implementation identified yet |
| Credentials/deployments | Separate environments and keep secrets server-side | Variable names only, project mapping and deployment settings |

No existing code is marked for deletion or retirement yet. Reusable components cannot be named until the source is inspected.

## Proposed module map

Planning only; no application directories have been scaffolded:

```text
src/app/                 public, admin and versioned API entry points
src/modules/booking/     pricing, availability, holds, orders and lifecycle
src/modules/catalog/     products, suppliers, stops and departures
src/modules/content/     guide content, metadata and redirects
src/modules/identity/    operator context and central role authorization
src/modules/payments/    provider verification and payment processing
src/modules/integrations/ outbox delivery and notification adapters
src/modules/tracking/    adapters around existing position data and routing
src/components/maps/    shared view/manage map UI
supabase/migrations/    version-controlled schema, functions and RLS
tests/                  domain, database integration and end-to-end tests
```

Keep one modular monolith. UI and API entry points call the shared booking domain; payment confirmation and capacity changes use its transactional boundary. Final paths depend on the existing-code audit.

## Unresolved risks

- Existing tracking schema may differ from the roadmap sketch; inventory it before creating overlapping tables or changing writers.
- Missing indexed URLs would make redirect coverage unverifiable.
- Existing booking/payment data may require a transition plan; its volume and structure are unknown.
- Operator ownership and current RLS cannot be assessed without schema evidence.
- Dependency compatibility, licensing, deployment assumptions and environment variable names are unknown until source/configuration is supplied.

## Next evidence required

Obtain the official website/tracking URLs and source repository or local folder paths. Confirm Phase 0 account access and export locations. Inspect the provided code and schema read-only, replace unknowns with concrete file/table references, and run the Phase 0.5 audit before proceeding to Phase 1A.
