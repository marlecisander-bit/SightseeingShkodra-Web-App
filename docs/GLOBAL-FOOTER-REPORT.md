# Global footer implementation report

30 September 2026

**FINAL STATUS: PASS for local implementation and automated verification. Not deployed.** Hosted migration and post-deployment save/publish acceptance remain pending.

## Current footer architecture

The public route-group layout already used one `Footer` in `src/components/public/ui.tsx`; there was no separate mobile footer. The redesign reuses that component and existing logo. The existing final booking invitation is preserved as a separate section immediately above the semantic footer, with its original visibility rules.

## New global footer component

One dark charcoal footer contains only the existing homepage-linked logo, configured social/review icons, a small outlined Staff Login button, Privacy Policy and Terms & Conditions links, copyright and VAT. Desktop uses two compact rows; mobile stacks and centers the groups. Legacy navigation, taglines, location, language and placeholder legal/contact text are removed from the renderer and active footer editor. Their pages and stored legacy fields remain intact.

## Pages using global footer

All routes under `src/app/(public)/layout.tsx`: Home, Tour, Route & Live Map, Explore and destination guides, Book, booking detail/manage pages, Your Day, Credits, Privacy Policy and Terms & Conditions. `/live` retains its existing redirect. Admin draft previews reuse the same component. Staff/admin application pages retain their own application shell.

## Admin social settings and ownership

Website content > Navigation, footer & search > Footer owns Instagram, Facebook, GetYourGuide and Tripadvisor HTTPS URLs, business name, VAT and copyright year. These fields extend the existing operator-scoped `homepage_v1` document and existing draft/publish RPC. Blank URLs hide their icons. No account URLs were invented.

Google Reviews retains its sole authoritative `review_settings.google_reviews_url` value. Its editing control moves from Guest Reviews to Footer; Guest Reviews links to that owner. The UI explicitly states this existing setting saves immediately, separately from website drafts. Guest Reviews display limits and leave-review URL retain their existing owner. Partial upserts omit unrelated fields. Public layout and reviews reuse the same request-cached reader; root layout revalidation propagates saves globally.

Defaults: Sightseeing Shkodra; M66526001A; 2026.

## Legal CMS

Privacy Policy and Terms & Conditions have separate text/status editors in the same global Website group, with saved-draft preview links. They reuse the existing CMS rather than introducing another table or publishing engine. New public routes are `/privacy-policy` and `/terms-and-conditions`. Empty/unpublished pages show a neutral availability notice, have noindex metadata and are excluded from the sitemap. Published content renders as escaped plain text with preserved paragraphs. Empty published legal text is rejected. No legal wording was supplied or fabricated.

The additive migration `20260930000100_global_footer.sql` extends validation and supplies compatible defaults for old documents; it does not rewrite historical migrations or mutate saved documents. Apply it before releasing the new application, otherwise CMS saves containing new fields will be rejected by the old validator. It has only been exercised in disposable local databases.

## Staff Login route

The button uses existing design-system button content and links to `/admin`. Browser verification reached the existing authenticated workspace selector and Owner workspace. No authentication code changed.

## Responsive and accessibility evidence

Configured five-icon fixture, rendered using the actual shared Footer and styles:

| Widths | Overflow | Minimum link target height | Footer height |
|---|---|---|---|
| 320, 375, 390, 430 | None | 44px | approximately 359px |
| 768, 1024, 1280, 1440, 1920 | None | 44px | approximately 194px |

Desktop 1440px and mobile 320px screenshots visually inspected. All six images loaded. Icon links have aria-labels/tooltips, decorative images have empty alt text, and external links use `target=_blank` with `noopener noreferrer`. Keyboard Tab moved between icons with a visible 3px yellow focus ring. White text/icons and yellow focus contrast against the retained charcoal background. Viewport override restored afterward. This is Chrome viewport evidence, not physical Safari/Android certification.

Actual local Privacy Policy page rendered its unpublished notice and existing Google Reviews URL. Actual authenticated Footer editor displayed all five URL controls and the requested business defaults. No Save/Publish button was submitted against the hosted database.

## Verification

- Complete `npm test`: **288 passed, 0 failed, 0 skipped**: components 9, identity 17, integrations 99, database 140, PostgreSQL concurrency 23.
- `npm run check`: lint, TypeScript and production build passed.
- New tests cover configured/empty social links, a single footer across public path contexts, escaped legal text, old-document compatibility, unsafe URLs, legal publication validation and existing-RPC draft/publish/withdrawal behavior.
- Historical CMS reconciliation test now uses the existing frozen historical fixture instead of current application defaults; original assertions remain.
- Final URL input-type and helper-copy refinement checked with lint and TypeScript separately.
- Logs are local only: `private/footer-check-final.log`, `private/footer-full-tests.log`, `private/footer-final-static.log`.

No new runtime dependencies, third-party scripts, widgets, icon APIs or external image requests. Five local SVG assets total approximately 9 KB. Instagram/Facebook/Tripadvisor/Google artwork is sourced from Simple Icons; GetYourGuide artwork from its official press asset. Provenance is recorded in `public/brand/social/SOURCES.md`.

## Files changed for this task

- `src/components/public/ui.tsx`, `legal-page.tsx`
- `src/app/(public)/layout.tsx`, `public.css`, `privacy-policy/page.tsx`, `terms-and-conditions/page.tsx`
- `src/app/sitemap.ts`
- `src/modules/content/website-schema.ts`, `reviews-server.ts`
- `src/app/admin/website-editor.tsx`, `website-workspace.tsx`, `website-panel.tsx`, `footer-google-editor.tsx`, `reviews-editor.tsx`, `review-actions.ts`, `[operatorId]/website-preview/page.tsx`
- `public/brand/social/`: five SVGs and provenance
- `supabase/migrations/20260930000100_global_footer.sql`
- `tests/components/global-footer.test.mjs`, `tests/database/global-footer.test.mjs`, `tests/database/cms-reconciliation.test.mjs`
- This report, `docs/CMS-RECONCILIATION.md`, `docs/PHASE_STATUS.md`

Unrelated pre-existing working-tree changes are excluded from this report. No deployment, hosted migration, content mutation or email enablement was performed.
