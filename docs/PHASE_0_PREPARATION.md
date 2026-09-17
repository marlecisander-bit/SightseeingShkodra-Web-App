# Phase 0 preparation

Status: SUPERSEDED by the fresh-project decision in DECISIONS.md. Legacy inventory below is historical, not an active prerequisite. New cloud setup is deferred until needed.

## Access and migration inventory

| Item | Evidence needed | Status |
| --- | --- | --- |
| Current website | Official URL and WordPress hosting/project location | Awaiting user |
| Domain registrar | Provider name and confirmation the owner can log in and manage the domain | Unverified |
| Google Search Console | Confirmation of property access; exported indexed URLs | Unverified |
| Google Analytics | Confirmation of property access and current measurement setup | Unverified |
| Vercel | Existing project identification and development access | Unverified |
| Supabase | Existing project identification, schema/migrations and development access | Unverified |
| Live tracking | Public URL, repository/local path, deployment and position data source | Awaiting user |
| Current ticketing | Provider/URL and description of current checkout and fulfillment | Unverified |
| Content and SEO | Sitemap, indexed URLs, titles/descriptions, content and image inventory | Not collected |

Provide account access confirmation, URLs and file paths, not passwords or secret values. Keep original exports in an owner-controlled backup folder outside this repository. Record their paths and export dates here once supplied. No export has been collected yet.

## Environment strategy

This is the planned separation, not a claim that cloud resources exist:

- Local development: local configuration, synthetic fixtures and local or dedicated development Supabase data.
- Staging: separate non-production database and credentials, preview/staging deployment, payment test mode and controlled notification recipients. Prevent public indexing.
- Production: retain current website, ticketing and tracking unchanged during preparation. Introduce the new production environment and cutover only at the relevant approved roadmap step.

Keep environment values out of Git. Document variable names and purpose in `.env.example` when the application integrations are inventoried during Phase 1A. Privileged Supabase, payment and integration credentials belong server-side. Do not copy production customer data into development fixtures.

## Completion criteria

- [ ] Owner confirms registrar, Search Console, Analytics, Vercel and Supabase access.
- [ ] Dated sitemap/indexed URL and metadata/content exports are retained outside Git.
- [ ] Existing tracking source, deployment and database structure are available for inspection.
- [ ] Existing ticketing system is identified.
- [ ] Local source control is established and the preparation baseline committed.
- [ ] Actual development/staging/production project mapping is recorded.

Next: complete the evidence inventory, then finish the Phase 0.5 audit. Do not retire existing services during this work.
