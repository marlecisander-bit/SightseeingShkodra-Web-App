# Independent live map embed

The user's approved approach is now an iframe on `/live`, pointing to:

`https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra&embed=1`

Continue editing and publishing the map in the original tracking admin. The embedded page uses that application's existing GPS and published-map refresh behavior. Unsaved drafts are not published updates. Map changes do not require rebuilding this booking website; changes to the tracking application's JavaScript may require a page refresh after its own deployment.

The tracking app, its authentication, database, device ingestion and processing remain independent. This website neither copies positions nor runs a second tracking pipeline. Deeper code/database/admin consolidation is superseded by this decision. Earlier prototype modules and development preview are retained but not imported by `/live`.

The iframe has a descriptive title, responsive height, lazy loading, geolocation delegation for the embedded app's user-triggered location feature, and a direct-open fallback link. No user location was requested during verification. Cross-origin loading failures and upstream GPS/ETA quality remain the tracking app's responsibility; the host does not claim to diagnose them.

Local verification (2026-09-22): lint, typecheck and isolated production build passed. Chrome loaded the hosted map inside localhost, showed published stops, and the Route control worked at 390px width. The embedded display updated its distance/ETA during observation. It initially showed location temporarily unavailable and subsequently recovered. Map tiles can load independently of route overlays. No map was republished to test publication refresh; that behavior remains owned by the existing app. No live-service modifications, database writes or external deployment occurred.
