import { readPublicMap } from '@/modules/tracking/public-map-server';
import { routePublicStatus } from '@/modules/tracking/route-status';

export async function GET(request: Request) {
  const data = await readPublicMap(request.signal, true);
  const query = new URL(request.url).searchParams;
  const status = routePublicStatus(data);
  const includeMap = query.has('geometry') && data?.mapVersion != null &&
    query.get('geometry') !== String(data.mapVersion);
  return Response.json({ ...status, ...(includeMap ? { map: data.map } : {}) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
