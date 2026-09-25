# Sightseeing Shkodra web app

Fresh Next.js App Router and TypeScript project following Roadmap V4 and the user-approved decision to build without legacy imports.

## Run locally

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev` and open http://localhost:3000. The initial page is a coming-soon shell; booking and admin features are not implemented yet.

The foundation builds without cloud credentials. Copy `.env.example` to `.env.local` when configuring integrations. Run `npm run check` for lint, type checking and a production build. Run `npm start` after building to serve the production build locally.

## Project references

- [Roadmap V4](docs/SIGHTSEEING_SHKODRA_ROADMAP_V4.md)
- [Approved amendments](docs/DECISIONS.md)
- [Phase status](docs/PHASE_STATUS.md)
- [Architecture and environments](docs/ARCHITECTURE.md)
- [Original document](docs/source/Sightseeing_Shkodra_Platform_Rebuild_Roadmap_v4_Execution_Edition.docx)

Next planned step: Phase 1B, new database schema migrations. No legacy website, tracking code or data will be imported.


Booking email setup and verification: [Resend booking emails](docs/BOOKING-EMAILS.md). Delivery is disabled by default. `npm run emails:preview` exports six synthetic HTML/text examples without sending mail.

### Netlify environment configuration

The Web App is hosted separately from the standalone map. Configure production environment variables in Netlify for both Builds and Functions; `.env.local` is intentionally not committed. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PUBLIC_OPERATOR_ID`, `PUBLIC_HOMEPAGE_PRODUCT_SLUG`, `CHECKOUT_SESSION_SECRET`, `APP_ENV=production` and `NEXT_PUBLIC_SITE_URL` set to the website HTTPS origin. The optional published-stop connection uses `LIVE_MAP_SUPABASE_URL`, `LIVE_MAP_PUBLISHABLE_KEY` and `LIVE_MAP_PROJECT_SLUG`. Keep `EMAIL_ENABLED=false` and `SITE_INDEXING_ENABLED=false` until their launch checks are approved. Never use NEXT_PUBLIC_ for a privileged key. Rebuild after changing public build variables.
