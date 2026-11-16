# Approved SEO release — 16 November 2026

Owner explicitly authorized fixing PR91 blockers, merging/deploying code, applying only the reviewed CMS correction and changing the www.app assignment after safeguards pass. Search Console and DNS changes are excluded. This preparation record is not a claim of completed release.

Integrated current main8af2eab (published mobile release) with SEO head6a94397, resolving documentation append conflicts by preserving both histories. Source changes add exact-old-value corrections to editor_draft.card.description for the two backed-up products, tighten Daily Ticket selection to its verified ID, and retain the existing www.app307alias behavior for nonmarketing paths after the public308 rules. Custom drafts are preserved. The review branch’s existing Vercel deployment suppression remains intact; main is not suppressed.

## Fresh authoritative CMS gate

Signed-in Supabase project sightseeing-shkodra-webapp / ybngoppqqiohcduojfyg / main PRODUCTION was verified in the dashboard. A read-only SELECT exported5content records and2products at2026-11-16T15:22:44.796388Z. Full CSV/JSON backup and field-level differences are stored in gitignored private/seo-release-20261116; only hashes and nonprivate paths/counts enter Git.

The corrected source migration changes33JSON fields across all7records when run offline against that backup. Both seasonal notices already say April2027 and are correctly skipped. Product drafts/published snapshots and editor drafts align; other values are preserved. Source migration replay is a no-op. A separate private application wrapper uses SERIALIZABLE isolation,5-second row-lock timeout,30-second statement timeout, exact full-record before comparison under locks and exact expected-after comparison (allowing only normal updated_at stamps). Its offline tests prove both successful application and rejection/preservation of a concurrent owner edit. Any mismatch must abort rather than overwriting content.

## Hosting and release order

Vercel settings confirm apex.app and www.com are assigned to this project’s Production environment, with apex.com308to www.com. Current www.app307 to apex.app is observed publicly but not listed as a separate project assignment in the initial dashboard. After final CI/diff review: deploy code first and verify deployed SHA/health; apply only the guarded correction and compare its receipt against the33-field plan; then explicitly assign www.app to the same Production app without altering apex assignments or DNS. The new host-only fallback preserves www.app protected/unknown-path307 behavior; public marketing paths take precedence with direct308 to www.com. Confirm this with real host/path/query and protected-flow checks before success.

No unrelated migrations, pricing, inventory, booking rules, email activation, worker settings, independent map changes or Search Console actions are included. The development review page is unavailable outside development.

## Acceptance and rollback

Require fresh exact-head CI and matching merged tree; verify public redirects/canonical/OG/sitemap and April2027/ticket facts, JSON-LD visibility and mobile/desktop/booking-entry/map behavior. Do not submit a real booking or payment. Preserve customer fragment tokens, auth/admin/API/webhook routes and configured customer origin. Search Console cleanup/indexing remains a separately authorized follow-up as documented in SEO-FINAL-REVIEW-2026-11-16.md.

Last-good source/deployment is the published mobile main8af2eab, not the PR’s old pre-mobile base. Rollback code through the controlled Git/Vercel process and CMS only by guarded restoration of the33changed JSON fields from the private backup. A restore must compare each current field with its applied value and abort if it has since changed. Restore the www.app assignment separately if needed; no wholesale table/document restore.

Actual SHA, deployment ID, applied CMS receipt, alias outcome and live acceptance are recorded after the gates complete, not inferred from this preparation record.
