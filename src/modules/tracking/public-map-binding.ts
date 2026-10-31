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

/** Release gate: enable only after paired Live Map acceptance. No runtime/CMS override. */
export const websiteExternalStatusEnabled = true;

/** Fixed loopback paired acceptance only; compiled out of production. */
export const localMapPreviewEnabled = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_LOCAL_MAP_PREVIEW === '1';
export const externalMapStatusEnabled = websiteExternalStatusEnabled || localMapPreviewEnabled;
