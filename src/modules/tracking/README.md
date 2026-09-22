# Tracking prototypes (inactive on public pages)

The connected public map is components/public/live-map-embed.tsx, which embeds the independent tracking app. See docs/LIVE_MAP_EMBED.md and the approved amendment in docs/DECISIONS.md.

This directory retains earlier experimental SharedMap presentation, the unused vehicle_positions reader and ported presentation functions. Only development preview/tests use the renderer. They are not the production tracking source and must not be wired as a competing GPS pipeline. No device writer or scheduler exists here.

See docs/PHASE_6_AUDIT.md for the current acceptance boundary.
