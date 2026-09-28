# Local acceptance environment - prerequisite audit

Status: BLOCKED before local stack startup. No isolated profile activated and no acceptance mutations performed.

## Existing infrastructure
- supabase/config.toml already defines project sightseeing-shkodra-dev, API port 54321, Auth site URL http://127.0.0.1:3000 and localhost redirect. Reuse this stack.
- 36 existing SQL migrations are present. The website-media bucket is conditionally created by 20260923000100_structured_homepage.sql when Storage exists. Apply all migrations unchanged.
- supabase/fixtures/development.sql contains synthetic demo records behind app.fixture_mode=development. It is not an end-to-end acceptance seed: its dates/product defaults require preparation through current contracts. db.seed.sql_paths is currently empty.
- Automated tests use PGlite and embedded PostgreSQL with test-only Auth substitutes. These do not provide the real browser Auth/Storage stack needed here.
- .env.local binds the app to shared project ybngoppqqiohcduojfyg.supabase.co. .env* and private/ are Git-ignored. No environment values were changed or secrets printed.
- Existing clients use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for Auth/browser access and SUPABASE_SECRET_KEY for server operations. Public content, bookings, pricing and reviews use the same backend. NEXT_PUBLIC_SITE_URL is localhost:3000. Email is disabled unless EMAIL_ENABLED equals true.
- LiveMapEmbed uses the existing independent Netlify viewer; keep it read-only.
- scripts/verify-supabase-development.mjs explicitly requires the shared hosted project and performs writes. Do NOT use it for isolated acceptance.

## Blocking prerequisites
Docker and Supabase executables were not found on PATH. Docker Desktop was absent from its standard Program Files location. Podman was not found. wsl --list reported that Windows Subsystem for Linux is not installed. A working Docker-compatible Linux container runtime is required before the existing local Supabase stack can start. Installing/enabling the Windows prerequisites may require user/admin interaction and restart.

No local API, database, Auth or Storage service has been started or certified. Local migrations, synthetic admin/seed, reset reproducibility and browser acceptance remain NOT RUN. Current localhost must still be treated as connected to the shared backend.

## Additional compatibility finding
Current website-schema.ts safeWebsiteImage, Next remotePatterns and SQL homepage validators permit repository images or HTTPS *.supabase.co Storage URLs, but not loopback HTTP Storage URLs. A local upload would therefore need a deliberately scoped compatibility solution before image save/preview/publish acceptance. Do not weaken production validation or rewrite historical migrations casually. This is a local-environment compatibility gap, not a demonstrated production upload failure.

## Resume sequence (not executed)
1. Make the compatible container runtime available; verify it responds. Obtain the Supabase CLI and reuse supabase/config.toml. Do not link to or reset a hosted project.
2. Start the local stack and verify API, Auth, database and Storage. Stop/report any migration failure before changing migrations.
3. Prepare a fail-closed acceptance launcher/profile using existing variable names: allow only the verified loopback backend, force email disabled, omit hosted/Resend secrets, use a separate ignored env profile, and refuse shared/remote targets before startup or seed/reset. Do not overwrite .env.local or deployed configuration. This guard is NOT implemented yet.
4. Seed synthetic operator/owner, current CMS/destinations/reviews, capacity-eight schedules and passenger prices through existing models. Keep deterministic fixtures/reset instructions and no production data copy.
5. Resolve the loopback media compatibility deliberately, then verify local-only upload destinations.
6. Start the isolated app, verify actual Auth/API/Storage network destinations and zero shared mutable-data traffic. Only then declare safe and run the requested CMS, booking, multi-tab, review and reset acceptance matrix.

No production configuration, credentials, data or infrastructure changed. No cloud project created. No email enabled. No deployment.
