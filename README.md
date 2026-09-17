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
