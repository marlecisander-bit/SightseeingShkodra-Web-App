/** Public integration identity only. Operational data remains in the map app. */
export const publicMapBinding = {
  origin: "https://sightseeingshkodralivetrackingapp.netlify.app",
  project: "sightseeing-shkodra",
} as const;
export const publicMapUrl = `${publicMapBinding.origin}/live-map.html?project=${publicMapBinding.project}`;

/** A historical server override must never silently join another map's stops. */
export function matchesPublicMapProject(project: string | undefined) {
  return project === undefined || project === publicMapBinding.project;
}
