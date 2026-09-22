# Approved roadmap amendments

## 2026-09-22 - Confirm seats now, pay at the meeting point

The user explicitly skipped Stripe and online payments, requested online van-seat reservations with payment at the meeting point, and approved implementation. This supersedes the paid-before-confirmed rule for new meeting-point reservations and Stripe Phase 5A-D. The original roadmap remains unchanged.

Confirm reservations atomically from valid holds; count confirmed items against capacity. Abandoned forms expire, but confirmed reservations retain seats until cancelled. Keep payment separately due until authorized staff record full collection. Preserve tenant/session security, locking, idempotency, audit history and historical online-payment primitives. No automatic emails/WhatsApp, no external deployment; local/development only.


## 2026-09-22 - Replacement logo artwork

The user's newly supplied `SIGHTSEEING SHKODRA LOGO 2 VERSIONET 2 (3).svg` supersedes the earlier `(2).svg` for app logos. Both public web variants are replaced from this source and served on localhost only, as explicitly requested. The earlier source remains archived; [the brand registry](brand/README.md) identifies the current artwork and its hash.

## 2026-09-22 - Logo integration on local server

The user requested updating and publishing the supplied logo, then clarified: "no no just publish in the local server". Use derived web SVG versions in the public header and footer, preserving the original artwork. This authorizes the local branding update only; no hosting deployment or existing-site change is requested. See [brand asset registry](brand/README.md).

## 2026-09-22 - User-supplied logo versions

The user explicitly requested recording the supplied `SIGHTSEEING SHKODRA LOGO 2 VERSIONET 2 (2).svg` as Sightseeing Shkodra logo versions. The unchanged original and provenance are retained in [the brand asset registry](brand/README.md). Use this artwork as the logo reference for future integration. This authorizes retaining the supplied brand asset within the fresh project; it does not change the roadmap phase or authorize legacy-site imports. App logo replacement is not part of this recording task.

## 2026-09-22 - Website reference; business details entered later

The user supplied https://sightseeingshkodra.com/ for reference and said they will enter details such as prices manually later. Reading the public site for context is authorized. This does not authorize importing legacy code, copying operational data into the new database, or changing the old service. Phase 4A connects the homepage to published structured data while leaving the owner's empty catalog unpublished. The reference site's age-based pricing is not adopted automatically: the existing V1 domain supports one per-guest rate; age bands require a separately scoped extension. The retained roadmap is unchanged.

## 2026-09-17 — Fresh project without legacy imports

User instruction: "skip this and set up as a new project without importing anything from the old website".

Build a new application from scratch. Legacy website content, indexed URL exports, ticketing migration, tracking-code reuse and existing database imports are not prerequisites. The Phase 0 legacy inventory and Phase 0.5 legacy audit are skipped by this decision, not marked passed. No existing service is to be modified or retired.

The V4 Next.js/TypeScript, Supabase, Vercel, modular-monolith, shared booking-domain, security, payment and design requirements remain the baseline. Phase 1A establishes the local foundation. New cloud accounts and project credentials can be supplied when their phases require them.

Future tracking will be a new implementation with one position data source, rather than reuse of unavailable legacy code. Legacy migration/redirect work in Phase 7 is not applicable unless the user later requests replacing an existing domain/site. Deployment and launch verification still apply.

This amendment overrides conflicting legacy-reuse and import requirements in the retained V4 text. The original DOCX is unchanged.

## 2026-09-22 - Local notification testing first

The user requested building and testing locally before setting up WhatsApp or email providers. Phase 5E is limited to a local queue, provider ports, message preview and simulated tests. No messages, hosted migration or scheduler activation in this phase. Live delivery remains pending; original roadmap unchanged.
