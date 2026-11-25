import { readPublicMap } from '@/modules/tracking/public-map-server';
import { freshRoutePosition, lastKnownRoutePosition, routeEta } from '@/modules/tracking/route-itinerary';

export async function GET(request: Request) {
  const data = await readPublicMap(request.signal);
  const lastPosition = lastKnownRoutePosition(data?.snapshot.positions[0]);
  const position = freshRoutePosition(lastPosition);
  return Response.json({
    mapVersion: data?.mapVersion ?? null,
    position,
    observedAt: data?.snapshot.positions[0]?.updatedAt ?? null,
    lastKnown: position ? null : lastPosition,
    movement: position ? data?.journey?.movement ?? null : null,
    eta: position ? routeEta(data?.journey) : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
