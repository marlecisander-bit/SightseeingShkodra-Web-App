# Foundation architecture and environments

The project uses Next.js App Router, React and strict TypeScript as a modular monolith. Dependencies are pinned in package.json and package-lock.json. Setup follows the [official Next.js installation guidance](https://nextjs.org/docs/app/getting-started/installation).

## Boundaries

src/app owns routes and page composition. src/modules reserves booking, catalog, content, identity, payments, integrations and tracking boundaries, each with an ownership README. These are scaffolding, not implemented capabilities. Database changes belong in supabase/migrations starting with Phase 1B.

Booking alone owns pricing, availability, holds, capacity and lifecycle. Frontends and payment adapters use that boundary. Payment verification, outbox delivery and operator-scoped RLS remain mandatory. No old system is imported; see DECISIONS.md.

## Environment separation

| Environment | Intended resources | Current state |
| --- | --- | --- |
| Local | Local Next.js, dedicated development Supabase or local database, synthetic data | Next.js configured; database not connected |
| Staging | Vercel staging/preview, separate non-production Supabase, payment test mode, controlled notifications | Not provisioned |
| Production | Vercel production and dedicated production Supabase/server secrets | Not provisioned or modified |

APP_ENV records environment intent; it does not itself isolate databases or configure cloud providers. Separate project credentials enforce resource separation. NEXT_PUBLIC_SITE_URL is reserved for canonical origin configuration. Supabase placeholders are reserved for auth integration; no database client is active. Privileged credentials must never use the NEXT_PUBLIC_ prefix.

The placeholder page is marked noindex/nofollow. Public-content and launch phases must replace it and introduce environment-aware indexing. This scaffold is not a production-ready website.

Git ignores local environment values, cloud-local state, dependencies and build output. No hosting project, remote Git repository, database, payment account or migration has been created.

## Verification

npm run check runs ESLint, route type generation/TypeScript and the production build. Domain, database and end-to-end tests will be introduced with their functional phases. No booking functionality exists yet.
