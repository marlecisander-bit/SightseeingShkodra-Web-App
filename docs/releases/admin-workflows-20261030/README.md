# Admin workflow release — 30 October 2026

## Scope and isolation

Prepared in `SightseeingShkodra-Web-App-admin-release-20261030`, based on production `5ce856450b785ffba3681119d8693e8f6d9750c3`. Original checkout and unrelated unfinished embedded Live Map changes are preserved. No public tracking files, schema for content, booking write logic, infrastructure configuration or delivery settings are included.

Includes product checklist, consistent draft/preview/publish controls, full-history booking search, shared Stops & Destinations with unsaved-edit protection, existing admin simplicity fixes (labels, image input layout, icon-only amenities and removal of decorative bus badge). Final acceptance fixed the misleading empty-search reset control. Development-only controlled fixtures exercise the real editor components; production returns 404 for the acceptance route.

## Database gate

Applied `20261030000300_admin_booking_search.sql` to the existing production project `ybngoppqqiohcduojfyg` through its authenticated SQL editor, before application release. Adds one read-only STABLE SECURITY INVOKER RPC with empty search path. Only service_role can execute; the RPC verifies matching active owner/admin/operations staff and operator. The application also checks bookings.read and binds the authenticated operator/staff identity. Search filters the full history before deterministic 25-row pagination; no booking/capacity/payment/email writes change.

Verified required production types, unique operator/order constraint, SELECT privileges, migration history, exact installed function source, anon/authenticated denial, service permission and foreign-operator rejection. Scoped production result: total30, page1=25, page2=5, empty query=0. EXPLAIN ANALYZE: 6.574ms execution on current data (not a large-volume benchmark). Before/after transactional fingerprints of orders, bookings, customers, booking items and payments matched; no records modified. Full evidence: production-preflight.json.

Rollback is tested on a disposable database: restore application `5ce8564` first; the additive function may safely remain. Optional rollback.sql checks the source hash, drops only this function without CASCADE and removes only its migration registration. Booking data and prior migration history are preserved; reapplication passes. Existing Vercel Ready deployment `2Zi5ee8t4yAwW4E9HMnsxdWxrTp1` offers Instant Rollback.

## Acceptance and checks

Native Chrome browser acceptance used real admin editor components with explicitly labelled in-memory synthetic save responses, not real content mutations. Historic fixture has 130 old records across six pages; checked oldest SS-OLDEST, exact search, query/date/status preservation, pagination and empty results. Production RPC was separately tested with the actual service role.

Checked product checklist targets, dirty preview prevention, failed-save retention, successful draft save, saved preview distinct from published data, and publish response. Checked shared destination edits across both views, blocked tab switch with unsaved edits, keep editing, explicit discard/cancel, draft save and publish. Keyboard Tab/Enter worked. Owner/admin publish controls, content_editor save without publish, and operations editorial restrictions were checked alongside permission regression tests.

Responsive browser review/captures: product at375,390,768,1440; destination editor at390,1440; bookings at375,390,768,1024,1440. No observed clipping or inaccessible controls. Captures are local ignored evidence under docs/screenshots/admin-workflows-20261030. Full-page captures contain the browser's fixed mobile navigation at the capture viewport boundary; it remains fixed while scrolling. Physical devices were not tested. Synthetic UI saves do not constitute a production write test; real content and customer emails were deliberately untouched. Authenticated production owner session was confirmed before release, with safe post-release reads planned.

Final candidate: npm run check passed (lint/typecheck/build); npm test646 passed (156 components,24 identity,222 integrations,210 database,27 PostgreSQL,7 CMS verification); npm audit --omit=dev --audit-level=low:0 vulnerabilities; git diff --check passed. Production-mode smoke: homepage200; dev acceptance404; local authenticated admin requires unavailable local backend configuration (503), so hosted owner session is used for release checks.

## Release sequence

Verified Vercel Node24 and Only build production, ignored-build command `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`. No configured staging; no new environment created. Database applied first, then feature branch/PR CI, then main release. GitHub main currently has no branch protection, so successful CI is enforced manually before merge. Record final commit, deployment and safe production results in the publication receipt after deployment.
