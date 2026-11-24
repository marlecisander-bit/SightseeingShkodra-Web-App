import { readPublicMap } from '@/modules/tracking/public-map-server';
import { freshRoutePosition, routeEta } from '@/modules/tracking/route-itinerary';

export async function GET(request: Request) {
  const data = await readPublicMap(request.signal);
  const position = freshRoutePosition(data?.snapshot.positions[0]);
  return Response.json({
    mapVersion: data?.mapVersion ?? null,
    position,
    eta: position ? routeEta(data?.journey) : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
