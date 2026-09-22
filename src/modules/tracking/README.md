# Tracking

One position source: the existing vehicle_positions table. Phase 6B adds SharedMap view/manage-selection interfaces and readPositions, a server-only, operator-filtered reader. The caller must supply an authorized request-scoped client and trusted operator binding. Manage selection is not permission to write.

Local fictional preview: /dev/tracking-preview. Public /live integration and admin writes remain separate phases. No GPS publishing, polling, routing or ETA yet. See docs/PHASE_6B_REPORT.md.
