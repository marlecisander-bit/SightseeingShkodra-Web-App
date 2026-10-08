# Public/admin connections ? implementation checkpoint

8 October 2026. Local implementation and isolated automated verification completed. Representative Chrome presentation checks completed. Full authenticated browser acceptance remains incomplete. Nothing committed, pushed, deployed, migrated or published to production by this task; no customer messages or role changes.

## Changes

The [current connection matrix](PUBLIC-CMS-CONNECTION-MATRIX.md) replaces the stale audit matrix. New Website sections own homepage stop-overview copy, Route presentation, shared visitor action labels and booking-dialog copy, and Book/Route/FAQ/Explore search/social metadata. Saved preview uses the actual public components and the relevant page. The homepage stop-overview preview now correctly targets Home; this was corrected during browser inspection. SEO draft details are inspectable without indexing the private preview.

The complete homepage ticket section respects its visibility flag. Ticket description/inclusions remain product-owned. Disconnected intro description/link controls and editorial destination coordinates are removed from the active editor while stored compatibility fields remain intact. Previously retired how-it-works, hero amenities, secondary review, static notebook/place, old footer and mobile-only navigation fields stay inactive. Product slug/type changes are rejected by both server and database; normal descriptive editing remains available. Intentional future identity changes require a reviewed developer migration.

Navigation offers approved pages and published operator-owned destinations. SQL validates destination membership and retained aliases, not merely path syntax. Legacy route aliases stay usable. Destination draft edits cannot reorder already published destinations; explicit publisher ordering remains an immediate public action.

Website Publish still includes the selected form plus all saved Website drafts. The pending-change review shows published and next values, including unsaved selected-form changes; it does not claim unsaved values in another form are published. Shared consumer descriptions clarify scope. Owner-sensitive saved drafts cannot be published by an admin as an accidental side effect.

Meeting points have owner-only append-only effective-dated versions. New bookings capture the effective value at confirmation. Existing bookings receive the previous historical meeting point during migration and retain it through later modifications. Pass/manage pages, direct confirmation results and newly prepared v2 email snapshots consume that booking snapshot. Already prepared email snapshots remain immutable and byte-compatible. Changing the setting does not enqueue communications. Associated stop IDs come from the retained independent map; the setting never edits its stops.

## Permission matrix

| Capability | Owner | Admin | Operations | Content editor |
|---|---|---|---|---|
| Website/destination drafts | Yes | Yes | No | Yes |
| Publish Website/destination; immediate destination ordering | Yes | Yes | No | No |
| Contact, footer, WhatsApp, legal and external review settings | Yes | No | No | No |
| Review curation/publication | Yes | Yes | No | Read only |
| Prices and commercial exceptions | Yes | Yes | No | No |
| Schedule/capacity changes | Yes | Yes | Yes, preserve commercial values | No |
| Effective-dated meeting point | Yes | No | No | No |
| Existing product slug/type mutation | No via editor | No via editor | No | No |
| Independent map admin handoff | Yes | Yes | Yes | No |

Focused permissions are enforced in Server Actions; SQL guards protect relevant RPC boundaries and product identity. Existing browser table privileges/RLS remain in force. Review mutation uses the existing server-only service boundary. No memberships were changed. Independent map access still requires that application's own sign-in; the link grants no role there.

## Intentionally code-owned

Booking calculations, passenger rules, capacity transactions, cutoffs, security messages, operational availability/ETA warnings, transactional email structure, canonical/robots decisions, fixed layout/brand assets, attribution/credits, and sample-companion SEO remain code-owned. Product descriptions, prices, editorial destinations and map stops are not duplicated into the Website document. Legal text still needs owner approval; no legal claims were invented.

## Verification

Full npm test chain: **366 passed, 0 failed, 0 skipped**: 31 component, 17 identity, 129 integration, 165 database, 24 PostgreSQL concurrency. The database runs use disposable isolated fixtures. Seven new connection cases exercise distinctive new-field drafts, unchanged public snapshots, shared publication and restoration, stale saves, owner-sensitive and employee denials, actual published destination aliases, protected product identity, operations schedule/commercial separation and historical meeting-point snapshots. Component tests render the real public consumers and test all four new SEO owners and saved meeting-point email rendering. These are not static-string-only claims.

Lint and TypeScript pass. An isolated production build passes with communication/index flags disabled and no Supabase credentials copied. Logs: private/connections-tests.log, connections-lint.log, connections-types.log and connections-build.log. The build is local, not a Vercel acceptance test.

Chrome fixture checks used the actual AdminShell/WebsiteWorkspace and public components with synthetic props in an ignored private checkout. Inspected desktop 1440x900, tablet 768x1024 and mobile 390x844/320x568 cases, including stop-overview editor, Route fields/SEO, pending publication review, navigation destination selector, unsaved edit/discard, homepage stop count and booking-dialog copy/meeting-point summary. Measured no document overflow in those cases. Fixed actions were reachable at 320px. The fixture's owner capability props are explicit; this is layout evidence, not an authenticated role proof. Browser persistence is not claimed: fixtures have no database credentials, and Save/Publish were not submitted.

## Required release steps ? not executed

1. Review and apply 20261006000200_public_admin_connections.sql, then 20261006000300_meeting_point_versions.sql after the existing migration baseline. Check migration history first. These are new local migrations, not instructions to reapply historical migrations.
2. Verify new RPC definitions/privileges, product identity trigger, meeting-point table and booking snapshot trigger in the authorized target. Preserve existing booking commitments and prepared email snapshots.
3. Deploy the matching application only after migration verification and explicit production authorization. No environment-secret or scheduler change is required for this feature.
4. Complete authenticated saved-draft ? preview ? publish ? refresh ? restore browser acceptance in an isolated data environment, including image/alt/focal-position edits, every new field/consumer, and employee role denials. Then run a controlled read-only hosted smoke check. Do not use production customers or send test notifications for this acceptance.

## Remaining limitations and decisions

No complete authenticated browser persistence matrix was performed; DB/component tests and representative fixture checks are complementary evidence. Actual upload/file-picker acceptance, every image/focal variant, physical mobile keyboards/safe areas and assistive-technology acceptance remain unverified. The local Route iframe did not load successfully; the separate admin root responded HTTP 200 and identified itself as Sightseeing Shkodra Admin, but this does not certify GPS/ETA or authenticated map operation. No map code changed. The local unconfigured planner can refresh to its unavailable state, as designed.

Owner must supply any changed meeting-point details/effective time and approve legal content. No meeting-point version was created in production. New text defaults preserve existing wording where possible and require editorial review before publication. The fixture and private logs are not release artifacts. Existing unrelated booking-dialog CSS, owner SQL and earlier report changes were preserved.

## Authorized publication - 8 October 2026

Owner subsequently requested publication. Both new migrations applied successfully through the authenticated Production Supabase SQL editor and were recorded in migration history. Read-only verification confirmed the meeting-point table/trigger, restricted browser privileges and service RPC access. Matching tested application is being released through the existing main-branch Vercel integration. This supersedes the local-only release status above; full physical-device and authenticated write acceptance remain separate limitations. Pending mobile booking-dialog responsiveness changes are included in the tested source release; unrelated owner SQL and historical reports remain unstaged.
