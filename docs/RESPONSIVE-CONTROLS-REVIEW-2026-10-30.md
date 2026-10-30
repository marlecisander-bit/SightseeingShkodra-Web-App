# Responsive controls and dialogs — local review

Publication update: see `releases/all-completed-20261030/README.md`. The following is the historical local implementation report; production migration 20261030000400 has since been applied with business records unchanged.

30 October 2026. Presentation-only changes; no commit, push, deployment, database update or customer action. Existing admin, Live Map and other pending work preserved.

## Fixed

- Booking filters: explicit container-responsive grid replaces competing flex widths. Search label sits above its input; date/status stack below480px content width, sit side by side on tablets, and align with search in wide workspaces. Filter actions occupy a separate wrapping row. Hidden email/filter values and form submission semantics remain unchanged.
- Shared admin date/time/datetime controls: bound inline sizes, border-box sizing and normalized native WebKit date value sizing. This addresses the Safari intrinsic-width risk visible in the user's screenshot without replacing native pickers.
- Shared admin buttons: long labels wrap within the available width, icons do not shrink, and text has consistent line height. Booking section headings/actions can wrap in narrow containers.
- Notification popup: at narrow widths, title and close control have separate grid cells; Mark all as read gets its own row.
- Public booking dialog: header text can shrink/wrap while logo and close target retain their space; content/fields cannot force horizontal expansion.
- Cancellation dialog: scoped heading size prevents page heading rules making the title oversized. Action labels wrap/stack on phones; viewport containment, safe-area padding and scroll padding are explicit.
- Passenger controls and amount breakdowns: long labels/values wrap, with counters kept together. Shared button icons and native date controls are contained in public dialogs.

Changed implementation files: `src/app/admin/bookings-workspace.tsx`, `bookings.module.css`, `admin.module.css`, `notifications.module.css`; `src/components/public/booking-dialog.module.css`, `booking-controls.module.css`; `src/app/button-system.css`. Added development-only layout review at `src/app/dev/responsive-controls/page.tsx` and `preview.tsx`.

## Audit and browser review

Inventoried all five active dialog implementations outside development routes: booking.tsx, booking-controls.tsx (cancellation), day-planner-strip.tsx, homepage-stops-gallery.tsx and admin/notifications.tsx. Reviewed shared admin form/action/image layouts and standard public button styles, retaining existing containment where it already worked.

Native Chrome responsive emulation used actual BookingsWorkspace and NotificationBell with existing synthetic fixtures. Public preview opens the actual BookingProvider modal with editorial preview (no availability/booking writes), plus cancellation/timetable/destination layout fixtures using their real CSS and long labels/date/time controls. Those three fixtures validate presentation and native dialog opening/dismissal, not their production business actions. Native Escape dismisses dialogs; the booking modal close target remained readable and separate from its long title. Scrollable content and wrapping actions remained reachable.

Captured booking filters at390x844,320x740,375x812,768x1024 and1440x900. Notification popup at320x740 and1440x900. Actual booking modal at375x812,320x568 and1440x900. Cancellation layout at390x700 and1440x900; timetable at375x667 and1440x900; destination at320x568,844x390 and1440x900. No observed date/status overlap or dialog action/title collisions in these reviewed states. No real destructive, booking, payment, push or email actions were triggered.

Evidence: `docs/evidence/responsive-controls-2026-10-30/`. Chrome full-page screenshots can place fixed bottom navigation at the original capture viewport boundary; this is a capture artifact, not proof that scrolled content is inaccessible. Next development indicators are development-tool overlays, not production controls.

## Checks and limits

Final `npm run check` passed lint, Next type generation/TypeScript and production build. Full `npm test`:652 passed, zero failed (160 components,24 identity,225 integrations,209 disposable database,27 PostgreSQL,7 CMS verification). `git diff --check` passed.

Chrome responsive emulation is not physical-device or Safari/WebKit acceptance. The screenshot's iPhone native date behavior still needs a physical Safari recheck. No exhaustive live authenticated click-through of every screen, every translated string or every business state is claimed; the source inventory/shared controls and representative layout fixtures were reviewed. Native select values remain single-line and may truncate long option text normally. Production remains unchanged until separately authorized publication.
