# Production admin authentication audit and setup

## Audit before changes
The application already uses the existing Supabase project and real Auth. `/admin` checks `auth.getUser()` and redirects logged-out visitors to `/auth/sign-in`; this is the existing login URL, not a second admin panel. Password sign-in is a server action using signInWithPassword. Supabase SSR cookies persist sessions; proxy refreshes claims only for admin/auth routes. Every protected page/domain operation rechecks the user and active operator membership. `withOperatorService` creates the privileged client only after authorization. No browser isAdmin flag, custom password table, hard-coded email authorization or production login bypass was found.

Authorization uses auth.users.id -> staff_profiles.auth_user_id, with operator_id, role and is_active. Owner has full permissions including staff/settings; admin has operational/content permissions; operations/content_editor retain deliberately restricted staff workspaces. An ordinary authenticated account with no membership gets no workspace/data. Preserving these staff roles avoids breaking existing delegated administration. User-editable metadata is never a role source.

## Changes
- src/modules/identity/password-recovery.ts: validated fixed recovery origin and generic recovery result.
- src/app/auth/actions.ts: existing Supabase resetPasswordForEmail request; admin router-cache invalidation after successful signOut.
- src/app/auth/forgot-password/page.tsx: email-only recovery request screen.
- src/app/auth/sign-in/page.tsx: generic Invalid email or password and recovery link.
- src/app/admin/layout.tsx and session-history-guard.tsx: private-page metadata and reload of browser back/forward-cache restores so server authorization runs again. This layout is not a substitute for per-handler permission checks.
- tests/identity/password-recovery.test.mjs and tests/database/admin-auth-security.test.mjs.

No schema changes, role grants or new authentication system. Public tourist booking still requires no Auth account. Existing signing cookie for anonymous checkout is independent and unchanged. No tracking, pricing, capacity, payment or notification engine changes.

## RLS/security
See ADMIN-RLS-INVENTORY.md for every public table and its read policies. Public table RLS and absence of browser write grants are tested. Staff membership reads are self/owner scoped; role assignment cannot be written directly by authenticated/anonymous clients. Administrative writes go through server authorization and operator-scoped service/RPC operations. Public reads/writes use existing bounded server DTOs/booking RPCs; public visitors do not receive unrestricted table access. CMS amenities are embedded content_pages data. The independent live-map database is outside this repository's authentication scope.

SAFE (scanned scope): no known privileged environment secret found in tracked files or generated .next/static assets; no credential-pattern matches found in tracked source or Git history scan. Privileged server modules use server-only boundaries. Ignored local .env/private files are not published. Pattern scans are not proof against every possible encoded/historical secret. Production environment values and hosted policies were not changed or exhaustively re-audited in this local task.

ACTION REQUIRED: configure Supabase Auth URLs, recovery email template/delivery and create/assign the intended staff account as below. Recovery requests deliberately do not disclose whether an address exists or a provider rejected the email. Supabase Auth rate limits apply; configure its abuse controls for production. No recovery emails sent during tests.

## Manual first-admin setup
1. Open the existing Supabase project `ybngoppqqiohcduojfyg`. Do not create another project.
2. Authentication > Users: create the intended user through the dashboard's secure create-user flow (or invite them). Enter the password only there or in the app's Supabase-backed password form. Do not paste it into SQL, code or chat. If the user already exists, reuse that Auth user rather than creating a duplicate.
3. Copy that user's actual UUID. In SQL Editor, run `select id, name from public.operators order by name;` and identify the Sightseeing Shkodra workspace UUID.
4. Review docs/FIRST-ADMIN-ASSIGNMENT.sql. Replace both marked placeholders with those actual UUIDs. Choose owner for full first-owner settings/staff control; use admin if intentionally limiting those powers. Execute only in trusted Supabase SQL Editor. No UUID is fabricated and no assignment runs automatically.
5. Configure local .env.local and matching Netlify server environment names: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (server-only), NEXT_PUBLIC_SITE_URL. Preserve existing checkout/public-content variables. Never prefix the secret key with NEXT_PUBLIC_/VITE_/PUBLIC_. Rebuild after changing public environment values.
6. Run `npm run dev`, open `http://127.0.0.1:3000/admin`, sign in, then choose the workspace. If already assigned an active owner profile, no additional assignment is necessary.
7. Before deployment, test the actual account's refresh/navigation/logout/re-login and a non-staff account. No real admin credentials were collected by this task.

## Password recovery configuration
Supabase Authentication > URL Configuration: set Site URL to `https://sightseeingapp.netlify.app` and allow the exact `/auth/activate` redirect for that origin and your local origin (`http://127.0.0.1:3000/auth/activate`). Set NEXT_PUBLIC_SITE_URL to the matching environment origin, without a path/query/fragment. Avoid broad wildcard production redirects.

Authentication > Email Templates > Reset Password: use a link compatible with the existing fragment-based activation page:

```html
<a href="{{ .RedirectTo }}#type=recovery&amp;token_hash={{ .TokenHash }}">Reset password</a>
```

The user opens the link, explicitly continues, existing verifyOtp validates the single-use recovery hash and sets Supabase session cookies, then /auth/set-password uses updateUser on the verified account. Expired/reused links show generic recovery guidance. Do not use the default implicit-token link with this hash-token page without updating the template. Configure Supabase Auth SMTP/delivery and password policy in the dashboard; no additional application email provider is introduced. Invite setup remains available through the existing invite activation flow.

References: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail and https://supabase.com/docs/guides/auth/auth-email-templates

## Verification and limits
Local suite: 17 identity, 87 integration, 130 database, 23 PostgreSQL concurrency = 257 passing tests. Tests cover role mismatch/no membership/disabled membership, metadata escalation, operator isolation, no privileged-client creation before authorization, recovery validation/provider errors, browser write denial across all tables, and public booking rules. No actual admin password, recovery delivery or hosted Auth session was exercised; those account-level acceptance checks remain manual. Local production build and logged-out route checks are recorded after completion below.

LOCAL ONLY. DO NOT DEPLOY until separately authorized.

Final local verification: lint/typecheck/build passed. Logged-out /admin and direct bookings/content URLs redirected to sign-in despite fake isAdmin/role browser storage values. Login error and Forgot password UI checked at 390px without overflow. Public / and /book returned 200 without login. All 38 generated browser assets scanned for configured privileged secrets: none found. Nonexistent /admin/.../settings returns 404; settings use the existing workspace structure rather than that invented route. Real-account login/refresh/logout/back and recovery inbox completion remain manual acceptance checks.

Activation troubleshooting: observed Supabase error_code=otp_expired in the local email redirect (no credential values recorded). Activation UI now displays expired/used-link guidance with a recovery link instead of submitting an empty token; bare activation URLs show complete-link guidance. Local browser checks passed without sending email.
