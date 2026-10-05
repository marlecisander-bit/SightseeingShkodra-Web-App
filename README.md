# Sightseeing Shkodra web app

Fresh Next.js App Router and TypeScript project following Roadmap V4 and the user-approved decision to build without legacy imports.

## Run locally

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev` and open http://localhost:3000. The application includes public booking and an authenticated admin workspace.

The foundation builds without cloud credentials. Copy `.env.example` to `.env.local` when configuring integrations. Run `npm run check` for lint, type checking and a production build. Run `npm start` after building to serve the production build locally.

## Project references

- [Roadmap V4](docs/SIGHTSEEING_SHKODRA_ROADMAP_V4.md)
- [Approved amendments](docs/DECISIONS.md)
- [Phase status](docs/PHASE_STATUS.md)
- [Architecture and environments](docs/ARCHITECTURE.md)
- [Original document](docs/source/Sightseeing_Shkodra_Platform_Rebuild_Roadmap_v4_Execution_Edition.docx)

See the phase status for current implementation and outstanding acceptance checks.


Booking email setup and verification: [Resend booking emails](docs/BOOKING-EMAILS.md). Delivery is disabled by default. `npm run emails:preview` exports six synthetic HTML/text examples without sending mail.

## Deployment

Vercel is the official host; production branch `main`, domain `sightseeingshkodra.app`. Supabase and Resend remain the backend and email provider. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for Production, isolated Preview, and local Development configuration. Vercel Hobby background delivery is paused by owner decision. Netlify is retained only as legacy fallback pending parity; the independent Live Map remains external.
