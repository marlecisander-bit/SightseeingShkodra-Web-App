# Phase 3A admin shell

Implemented /auth/sign-in, /admin workspace selection and /admin/[operatorId]/[section]. Email/password sign-in and sign-out use Supabase SSR session clients in Server Actions. Credentials never appear in redirect URLs. No public signup or automatic staff promotion exists.

Workspace sections are overview, products/stops, departures, bookings and content. Each page calls requirePermission for its own section on every request; navigation uses the same permission matrix. Operator names/memberships are read through session-scoped RLS. Unknown sections return not-found. Authentication/authorization failures redirect without workspace content. Staff choose only their active memberships. Nonstaff accounts receive an empty-access state.

Implemented mobile breakpoint, wrapping navigation/header, minimum 44px controls, keyboard focus styles, skip link, form labels and error announcements. Sections are clearly identified as placeholders; product CRUD, bookings tools and content editors are later phases. No synthetic metrics or operational data is displayed.

## Verification

npm run check passed lint, typecheck and production build. Added role-navigation tests. Hosted integration runner with `--admin-http` verified actual local Next HTTP routes using real Supabase SSR cookies: anonymous redirects, authorized overview render, foreign operator rejection, role-demotion bookings rejection and content-editor content access. Temporary Auth users/memberships were cleaned up; existing synthetic audit fixture remains as documented.

Visual QA is pending: the computer-use browser provider reported no browser available. Responsive CSS is implemented, but desktop/mobile screenshots, keyboard interaction and browser form submission are not claimed tested. This phase is implemented with visual acceptance pending. The local dev server is running at http://127.0.0.1:3000/auth/sign-in.

Owner onboarding also awaits the user's owner email. No real user has been promoted or created, no invitation was sent, and no credentials were invented. Existing Auth users can sign in only if their staff membership has been provisioned. No migrations or environment variables changed.

Final regression result: npm test passed 89 tests (13 identity/navigation, 5 adapter, 59 embedded database, 12 native PostgreSQL). Final lint passed after the HTTP verifier additions. Build/typecheck passed with all new app routes.
