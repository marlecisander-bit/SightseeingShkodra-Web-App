# Vercel environment inventory

5 October 2026. Names and presence only; no secret values. Vercel Project variables and linked Shared variables were both empty under All Environments. This applies to Production, Preview and Development at audit time. Netlify presence is from its authenticated variable list; values/context details were not revealed. Local source references were enumerated from src/ and netlify/.

P = configure in Production. Preview/Development need their own safe bindings; do not automatically clone production secrets or enable delivery there. System variables are host-managed. Public-prefix values are browser-visible and must never contain privileged credentials.

| Variable | Used by | Client/server | Required in Vercel? / environment | Netlify inventory | Vercel status |
|---|---|---|---|---|---|
| `ADMIN_NOTIFICATIONS_ENABLED` | Inbox projector activation | Server | Optional: explicit feature gate | Not listed | MISSING |
| `ADMIN_NOTIFICATIONS_START_AT` | Notification activation cutoff | Server | Required when notifications enabled | Not listed | MISSING |
| `ADMIN_PUSH_ENABLED` | Push dispatch/subscription activation | Server | Optional: explicit feature gate | Not listed | MISSING |
| `APP_ENV` | SEO launch/email safety | Server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `BOOKING_OWNER_EMAIL` | Owner message recipient | Server | Required when email enabled | Not listed | MISSING |
| `BOOKING_REPLY_TO_EMAIL` | Reply-to address | Server | Required when email enabled | Not listed | MISSING |
| `CHECKOUT_SESSION_SECRET` | Signed checkout session cookies | Server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `CRON_SECRET` | Bearer authorization for existing internal workers | Server | Required when either scheduler enabled | Not listed | MISSING |
| `EMAIL_ENABLED` | Email worker activation gate | Server | Optional: explicit feature gate | Present (Builds, Functions; one context) | MISSING |
| `EMAIL_START_AT` | Email activation cutoff | Server | Required when email enabled | Not listed | MISSING |
| `EMAIL_TEST_RECIPIENT` | Controlled recipient override; required for non-production sending | Server | Conditional: safe test sending | Not listed | MISSING |
| `LIVE_MAP_PROJECT_SLUG` | Read-only independent map project binding | Server | Optional: map stop reads | Present (Builds, Functions; one context) | MISSING |
| `LIVE_MAP_PUBLISHABLE_KEY` | Read-only stop lookup | Server | Optional: map stop reads | Present (Builds, Functions; one context) | MISSING |
| `LIVE_MAP_SUPABASE_URL` | Read-only stop lookup | Server | Optional: map stop reads | Present (Builds, Functions; one context) | MISSING |
| `NEXT_PUBLIC_SITE_URL` | Canonical metadata, booking/email links, recovery redirects | Public/browser + server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | SSR/browser Auth and Admin Realtime | Public/browser + server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `NEXT_PUBLIC_SUPABASE_URL` | Public auth client and server database clients | Public/browser + server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `NODE_ENV` | Framework runtime/development gates | Server | Host-managed | System/host-specific | Host-managed; not user variable |
| `PUBLIC_HOMEPAGE_PRODUCT_SLUG` | Fixed public bookable product binding | Server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `PUBLIC_OPERATOR_ID` | Fixed operator binding for public readers/workers | Server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `RESEND_API_KEY` | Resend server transport | Server | Required when email enabled | Not listed | MISSING |
| `RESEND_FROM_EMAIL` | Verified sender identity | Server | Required when email enabled | Not listed | MISSING |
| `SITE_INDEXING_ENABLED` | Explicit SEO launch gate | Server | Optional: indexing gate | Present (Builds, Functions; one context) | MISSING |
| `SUPABASE_SECRET_KEY` | Server-only CMS/booking/admin projections and guarded mutations | Server | Required: P; isolated equivalents for Preview/Development | Present (Builds, Functions; one context) | MISSING |
| `VAPID_PRIVATE_KEY` | Server-only push signing | Server | Required only when push enabled | Not listed | MISSING |
| `VAPID_PUBLIC_KEY` | Push subscription key exposed only through authorized Admin response | Server | Required only when push enabled | Not listed | MISSING |
| `VAPID_SUBJECT` | Push sender contact | Server | Required only when push enabled | Not listed | MISSING |
| `VERCEL_ENV` | Host environment classification and email safety/build preflight | Server | Host-managed | System/host-specific | Host-managed; not user variable |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is not consumed by this code. Use the exact `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` name. Netlify also lists `NETLIFY_EMAILS_DIRECTORY` and `NETLIFY_EMAILS_SECRET`; no source reference was found, so these are not required on Vercel. No analytics key is expected.

No key values were opened, compared or migrated. Matching intended project URL/credentials remains an owner configuration step. The local configured server successfully read the existing published CMS, whereas the Vercel deployment has no source binding.

## Source references

- `ADMIN_NOTIFICATIONS_ENABLED`: `netlify/functions/admin-notifications-schedule.mjs`, `src/modules/notifications/worker.ts`, `src/modules/notifications/server.ts`.

- `ADMIN_NOTIFICATIONS_START_AT`: `src/modules/notifications/worker.ts`.

- `ADMIN_PUSH_ENABLED`: `src/modules/notifications/worker.ts`, `src/modules/notifications/server.ts`.

- `APP_ENV`: `netlify/functions/booking-email-schedule.mjs`, `netlify/functions/admin-notifications-schedule.mjs`, `src/modules/content/seo.ts`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`, `src/app/api/public/checkout/route.ts`.

- `BOOKING_OWNER_EMAIL`: `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `BOOKING_REPLY_TO_EMAIL`: `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `CHECKOUT_SESSION_SECRET`: `src/app/api/public/checkout/route.ts`.

- `CRON_SECRET`: `netlify/functions/booking-email-schedule.mjs`, `netlify/functions/admin-notifications-schedule.mjs`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-server.ts`.

- `EMAIL_ENABLED`: `netlify/functions/booking-email-schedule.mjs`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `EMAIL_START_AT`: `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `EMAIL_TEST_RECIPIENT`: `src/modules/integrations/email-admin-test.ts`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `LIVE_MAP_PROJECT_SLUG`: `src/modules/content/destination-stops-server.ts`.

- `LIVE_MAP_PUBLISHABLE_KEY`: `src/modules/content/destination-stops-server.ts`.

- `LIVE_MAP_SUPABASE_URL`: `src/modules/content/destination-stops-server.ts`.

- `NEXT_PUBLIC_SITE_URL`: `netlify/functions/booking-email-schedule.mjs`, `netlify/functions/admin-notifications-schedule.mjs`, `src/modules/content/seo.ts`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`, `src/app/auth/actions.ts`.

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `src/modules/identity/supabase-config.ts`, `src/app/admin/notifications.tsx`.

- `NEXT_PUBLIC_SUPABASE_URL`: `src/modules/booking/orders-server.ts`, `src/modules/booking/lifecycle-server.ts`, `src/modules/booking/holds-server.ts`, `src/modules/booking/customer-management-server.ts`, `src/modules/booking/availability-server.ts`, `src/modules/notifications/worker.ts`, `src/modules/identity/supabase-config.ts`, `src/modules/identity/operator-service.ts`, `src/modules/content/website-server.ts`, `src/modules/content/reviews-server.ts`, `src/modules/content/homepage-server.ts`, `src/modules/content/faq-server.ts`, `src/modules/content/destinations-server.ts`, `src/modules/content/day-planner-server.ts`, `src/app/admin/notifications.tsx`, `src/modules/integrations/booking-email-server.ts`, `src/app/api/public/availability/route.ts`.

- `NODE_ENV`: `src/modules/integrations/booking-email-config.ts`, `src/app/dev/whatsapp-preview/page.tsx`, `src/app/dev/tracking-preview/page.tsx`, `src/app/dev/buttons-preview/page.tsx`, `src/app/dev/booking-email-preview/page.tsx`, `src/app/dev/booking-pass-preview/page.tsx`, `src/app/dev/hero-preview/page.tsx`, `src/app/dev/admin-notifications/page.tsx`, `src/app/dev/reviews-preview/page.tsx`, `src/app/dev/cms-reconciliation/page.tsx`.

- `PUBLIC_HOMEPAGE_PRODUCT_SLUG`: `src/modules/content/homepage-server.ts`, `src/modules/content/faq-server.ts`, `src/app/api/public/availability/route.ts`.

- `PUBLIC_OPERATOR_ID`: `src/modules/notifications/worker.ts`, `src/modules/content/website-server.ts`, `src/modules/content/reviews-server.ts`, `src/modules/content/homepage-server.ts`, `src/modules/content/faq-server.ts`, `src/modules/content/destinations-server.ts`, `src/modules/content/destination-stops-server.ts`, `src/modules/content/day-planner-server.ts`, `src/modules/integrations/email-admin-test.ts`, `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`, `src/app/api/public/availability/route.ts`, `src/app/api/public/checkout/route.ts`.

- `RESEND_API_KEY`: `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `RESEND_FROM_EMAIL`: `src/modules/integrations/email-admin-status.ts`, `src/modules/integrations/booking-email-config.ts`.

- `SITE_INDEXING_ENABLED`: `src/modules/content/seo.ts`.

- `SUPABASE_SECRET_KEY`: `src/modules/booking/orders-server.ts`, `src/modules/booking/lifecycle-server.ts`, `src/modules/booking/holds-server.ts`, `src/modules/booking/customer-management-server.ts`, `src/modules/booking/availability-server.ts`, `src/modules/notifications/worker.ts`, `src/modules/identity/operator-service.ts`, `src/modules/content/website-server.ts`, `src/modules/content/reviews-server.ts`, `src/modules/content/homepage-server.ts`, `src/modules/content/faq-server.ts`, `src/modules/content/destinations-server.ts`, `src/modules/content/day-planner-server.ts`, `src/modules/integrations/booking-email-server.ts`, `src/app/api/public/availability/route.ts`.

- `VAPID_PRIVATE_KEY`: `src/modules/notifications/worker.ts`.

- `VAPID_PUBLIC_KEY`: `src/modules/notifications/worker.ts`, `src/modules/notifications/server.ts`.

- `VAPID_SUBJECT`: `src/modules/notifications/worker.ts`.

- `VERCEL_ENV`: `src/modules/integrations/booking-email-config.ts`.

## Permanent migration environment assignments

Each variable above retains its listed consumer and client/server visibility. These assignments supersede earlier activation suggestions; no values have been transferred into the dashboard.

| Variables | Production | Preview | Development |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY | Required matching live project | Matching isolated project only | Matching isolated local/test project |
| PUBLIC_OPERATOR_ID, PUBLIC_HOMEPAGE_PRODUCT_SLUG | Required live binding | Required synthetic binding for functional tests | Synthetic binding |
| CHECKOUT_SESSION_SECRET | Required private random signing secret | Separate test secret | Separate local secret |
| NEXT_PUBLIC_SITE_URL | https://sightseeingshkodra.app | Preview HTTPS origin | http://localhost:3000 |
| APP_ENV | production | preview | development |
| EMAIL_ENABLED, ADMIN_NOTIFICATIONS_ENABLED, ADMIN_PUSH_ENABLED | false on Hobby | false, build-enforced | false by default |
| SITE_INDEXING_ENABLED | false until launch approval | false, build-enforced | false |
| RESEND_API_KEY, RESEND_FROM_EMAIL, BOOKING_OWNER_EMAIL, BOOKING_REPLY_TO_EMAIL, EMAIL_START_AT, EMAIL_TEST_RECIPIENT | Not required while sending paused; retain privately for future controlled activation | Omit real provider credentials; test sends denied | Only isolated controlled diagnostics if separately authorized |
| CRON_SECRET | Optional while paused; required >=32 characters for authorized worker calls, which still return disabled | Omit; workers paused regardless | Controlled tests only |
| ADMIN_NOTIFICATIONS_START_AT | Not required while paused | Not required while paused | Explicit synthetic activation only |
| VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT | Not required while push paused | Omit real keys | Separate test keys only |
| LIVE_MAP_SUPABASE_URL, LIVE_MAP_PUBLISHABLE_KEY, LIVE_MAP_PROJECT_SLUG | Optional existing read-only external bindings | Read-only bindings if needed | Read-only bindings if needed |
| PREVIEW_SUPABASE_PROJECT_REF | Not consumed | Required with DB credentials; isolated project ref | Not consumed |
| PRODUCTION_SUPABASE_PROJECT_REF | Not consumed | Required with DB credentials; real live ref, must differ | Not consumed |
| NODE_ENV, VERCEL_ENV | Host-managed | Host-managed | Framework/host-managed |

The two new project-reference variables are server/build configuration (non-secret identifiers) consumed by scripts/check-deployment-env.mjs. Build guards enforce explicit URL isolation, not cryptographic credential ownership. Verify matching keys in Supabase before deploy. No analytics or additional admin integration environment variables were found. Legacy adapter context/site URL fields are Netlify runtime arguments, not variables to migrate.
