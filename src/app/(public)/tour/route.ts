/** Retired public page: redirect only, with no CMS or booking reads. */
export function GET() {
  // No Tour query parameters apply to Route. A fixed relative target also preserves the host.
  return new Response(null, {status:301,headers:{Location:'/route'}});
}
