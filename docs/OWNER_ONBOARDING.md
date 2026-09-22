# Development owner onboarding

Updated: 2026-09-22.

The user supplied the intended owner email in chat. An exact-email Auth lookup found no existing account. Created a pending, unconfirmed Auth account without a password, then created the real development operator and its active owner membership. No invitation or other email was sent, and email ownership was not marked verified.

- Project: `ybngoppqqiohcduojfyg` (development only).
- Operator: Sightseeing Shkodra, `9185510e-0e82-4027-ab1c-8604dad5c92e`, Europe/Tirane.
- Staff profile: `53c1c7b6-fe33-4b21-882f-a52dc8808164`, active owner.
- Recorded an idempotent `staff.owner_bootstrapped` domain event and audit entry with null system actor.
- Read back the membership and verified its operator, role and active flag.

This is an account/data bootstrap through the existing privileged API, not a schema change. No production configuration or legacy service changed. The existing development audit fixture was left intact. No personal email or credentials are stored in this document.

Pending: account activation and password setup. The app currently has password sign-in only; a working invitation/password-setup flow must be implemented and checked before an invitation is sent. Sending email requires explicit user instruction. Do not describe the owner as ready to sign in yet.

Chrome is now connected. Opening `/admin` in a real browser reached the staff sign-in page. Full authorized form interaction and mobile acceptance remain pending; connection alone is not acceptance evidence.
