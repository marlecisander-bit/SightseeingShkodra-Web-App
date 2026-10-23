# Remaining unpublished changes — 23 October 2026

Owner requested publishing all unpublished changes. Release assembled in an isolated checkout from actual production main b47933b0ef1cb36ec0b4d850488f5a0d1329c365. Existing Vercel Git integration uses main for production; branch pushes may create non-production previews with no production binding. Baseline Vercel production FYLxWyj7cLvpmrt7YRygwasHTtCC was successful and is the rollback application reference. Additive email-provider schema from the earlier release remains in place.

## Scope and reconciliation

Compared every dirty/untracked workspace path with the original workspace HEAD ffd26dd and current main. Most differences were already published. Preserved newer production admin navigation/design, CMS verification/diagnostics, hero booking labels, partner card/image sizing, cross-platform tests and the complete email reliability release, rather than regressing them to stale workspace copies. Original IDE worktree remains untouched by release assembly.

New application changes: calendar availability redesign and required stop-publication fields/validation. Supporting development-only calendar/stop previews, focused tests and accumulated local reports/public-page screenshots are included. Stop editor retains production button hierarchy and association guidance. Existing horizontal-panning calendar test was updated to the requested fitting grid and keyboard behavior.

No booking deletion was approved or executed. No migration, hosted data/configuration/DNS/scheduler change, test booking, email send or resend is included. Existing active delivery and independent Live Map remain unchanged.

## Validation before push

Clean npm ci; npm run check (lint, TypeScript and production build); all 487 npm tests across six suites passed. Production npm audit found zero vulnerabilities. git diff --check passed. Current production's locked jsdom dependency resolves the old workspace's missing-package failure without changing dependencies.

Integrated synthetic calendar preview checked at 320/393/768/1024/1440px without horizontal overflow. Existing read-only projection, permission checks and save actions preserved. Today cutoff and closed-date projected-capacity limitations remain explicitly labeled; the release does not invent new bookability rules. Browser testing submitted no production mutations.

Development previews are blocked outside development. Production acceptance must verify authenticated calendar and stop-editor fields, public route/homepage and retained email health without submitting operational changes.

## Release state

Validated candidate prepared; push, PR/CI, merge, Vercel production result and live acceptance recorded in the post-release update. Production rollback uses the previous Ready application deployment, not a database restore. The current database, sender credentials and provider observation configuration must be retained.
