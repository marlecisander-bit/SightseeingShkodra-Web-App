# Development owner onboarding

Updated: 2026-09-22.

The user supplied the intended owner email in chat. An exact-email Auth lookup found no existing account. Created a pending, unconfirmed Auth account without a password, then created the real development operator and its active owner membership. No invitation or other email was sent, and email ownership was not marked verified.

- Project: `ybngoppqqiohcduojfyg` (development only).
- Operator: Sightseeing Shkodra, `9185510e-0e82-4027-ab1c-8604dad5c92e`, Europe/Tirane.
- Staff profile: `53c1c7b6-fe33-4b21-882f-a52dc8808164`, active owner.
- Recorded an idempotent `staff.owner_bootstrapped` domain event and audit entry with null system actor.
- Read back the membership and verified its operator, role and active flag.

This is an account/data bootstrap through the existing privileged API, not a schema change. No production configuration or legacy service changed. The existing development audit fixture was left intact. No personal email or credentials are stored in this document.

Implemented: `/auth/activate` accepts a single-use invitation/recovery token in the URL fragment and submits it to `verifyOtp` only after an explicit button click. It redirects to `/auth/set-password`, which verifies the session with `getUser` both on rendering and in its Server Action. Passwords must match and contain 12–128 characters; Supabase may impose additional policy. `updateUser` modifies only that verified account. No role or tenant assignment is accepted from the form. Passwords/tokens are not logged by these handlers and links have no caller-supplied redirect destination. The fragment avoids HTTP URL/referrer logging, but the private link remains an access credential.

`scripts/prepare-owner-setup.mjs` is an explicit development-only CLI. It requires the supplied email to already have the exact active owner membership, generates an invite (or recovery for an already confirmed user), checks the returned user ID, and writes the private link under ignored `private/owner-account-setup.html`. It neither sends email nor prints the token. Run with `node --env-file=.env.local scripts/prepare-owner-setup.mjs <authorized-owner-email>`. No public account/link generation endpoint was added.

The authorized owner's setup file has been prepared. The user must open it in Chrome, follow the link, click Continue, and choose a password. Do not describe the owner as ready to sign in until that is completed. Delete the private HTML after use. This is direct administrative bootstrap delivery to the user, not proof of mailbox possession; Supabase's normal invite verification will confirm the account when redeemed. Email invitation delivery and production password recovery remain unconfigured.

Validation: lint/typecheck/production build passed; all 15 identity tests passed (including two new setup-validation tests). Chrome testing with a temporary development Auth account passed activation, mismatch feedback, successful password save, sign-out, login with the saved password, one-use link replay rejection, and anonymous password-page redirect. The account had no memberships and correctly received no workspace. Inspected the password/mismatch form at 390x844 with no visible overflow, and reset the viewport afterward. Removed the exact temporary Auth account. No test used or changed the owner's password. The remaining 80 domain/integration tests were not rerun for these authentication-only changes.

Full admin form interaction and the full mobile acceptance matrix remain pending; these focused setup checks do not complete Phase 3.

Implementation references: [Supabase token verification](https://supabase.com/docs/reference/javascript/auth-verifyotp), [link generation without email delivery](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [session-scoped account updates](https://supabase.com/docs/reference/javascript/auth-updateuser).
