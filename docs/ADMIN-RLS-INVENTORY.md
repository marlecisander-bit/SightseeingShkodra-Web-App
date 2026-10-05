# Admin RLS inventory

Generated from all local migrations. All public tables have RLS; browser INSERT/UPDATE/DELETE/TRUNCATE privileges checked separately. Public website uses server-projected DTOs and bounded booking endpoints; authenticated reads below are operator/role scoped. Administrative writes use guarded service operations. Embedded amenities live in content_pages. Independent map data is outside this database audit.

| Table | Browser read policy / server-only boundary |
|---|---|
| api_keys | No browser policy; server only |
| audit_logs | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text]) |
| booking_items | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| bookings | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| content_pages | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'content_editor'::text]) |
| customers | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| departures | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| domain_events | No browser policy; server only |
| email_worker_status | owner_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text]) |
| inventory_holds | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| notification_deliveries | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| operators | operators_staff_read (SELECT): private.has_staff_role(id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| orders | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| payment_events | No browser policy; server only |
| payments | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text]); meeting_point_operations_read (SELECT): ((provider = 'meeting_point'::text) AND private.has_staff_role(operator_id, ARRAY['operations'::text])) |
| products | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| redirects | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'content_editor'::text]) |
| refunds | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text]) |
| review_settings | No browser policy; server only |
| reviews | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| schedule_exceptions | exception_staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| service_schedules | schedule_staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| staff_profiles | staff_profiles_self_or_owner_read (SELECT): (((auth_user_id = ( SELECT auth.uid() AS uid)) AND is_active) OR private.has_staff_role(operator_id, ARRAY['owner'::text])) |
| stops | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| suppliers | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text, 'content_editor'::text]) |
| vehicle_positions | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| vehicles | staff_read (SELECT): private.has_staff_role(operator_id, ARRAY['owner'::text, 'admin'::text, 'operations'::text]) |
| admin_notifications | SELECT only for active owner/admin/operations with their own receipt; no browser mutations |
| admin_notification_receipts | SELECT only for auth.uid() and active owner/admin/operations in that operator; no browser mutations |
| admin_notification_preferences | SELECT only for auth.uid() and active owner/admin/operations in that operator; no browser mutations |
| admin_notification_sources | No browser grants or policies; server projection ledger only |
| admin_push_subscriptions | No browser grants or policies; credential-bearing rows stay server-only |
| admin_push_deliveries | No browser grants or policies; server-only dispatch leases and outcomes |

The six admin-notification tables above are implemented in local migration
`20261005000100_admin_notifications.sql`; hosted application is pending. Local tests
verify anonymous denial, per-user/per-operator isolation, content-editor exclusion,
and absence of authenticated INSERT/UPDATE/DELETE/TRUNCATE grants. Receipt and
preference writes use the verified session and `bookings.read` server boundary.
Device responses omit endpoint/encryption credentials. Only receipts are added to
`supabase_realtime`; authorized notification content is fetched through the server API.

## WhatsApp global settings — 5 October 2026

No new table, policy or write grant. Six website content fields reuse the existing operator-scoped `content.manage` guard and website save/publish RPC. Migration 20261005000200 extends validation and restricts its historical helper to the private schema/service role. Local tests reject anonymous/browser execution and unauthorized operations writes. Hosted acceptance pending; see [WhatsApp report](WHATSAPP-CONTACT-AND-SITE-ICONS.md).
