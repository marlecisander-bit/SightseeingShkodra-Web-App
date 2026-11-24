import { trackingAdminSession } from '@/modules/tracking/admin-server';
import { parseTrackingWeek } from '@/modules/tracking/service-hours';

type Context = { params: Promise<{ operatorId: string; path: string[] }> };
const responseHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const versionColumns = 'id,status,published_at,created_at';
const mapFields = ['p_project', 'p_expected_head', 'p_expected_published', 'p_expected_draft', 'p_status', 'p_map', 'p_request'];
const maxBodySize = 4_000_000;

function failure(status: number, message: string) {
  return Response.json({ code: status === 400 ? '22023' : '42501', message }, { status, headers: responseHeaders });
}

async function relay(request: Request, { params }: Context) {
  if (request.headers.get('x-live-map-workspace') !== '1' ||
      ![null, 'same-origin'].includes(request.headers.get('sec-fetch-site'))) {
    return failure(403, 'Open the Live Map workspace from the website admin.');
  }

  const { operatorId, path } = await params;
  const session = await trackingAdminSession(operatorId).catch(() => null);
  if (!session) return failure(401, 'Reconnect your tracking account in the website admin.');
  const { projectId, vehicleId, token } = session;
  const query = new URL(request.url).searchParams;
  const upstreamQuery = new URLSearchParams();
  let resource: string;
  let body: string | undefined;

  if (request.method === 'GET' && path.length === 1) {
    resource = path[0];
    switch (resource) {
      case 'projects':
        upstreamQuery.set('select', 'id,name,slug,default_vehicle_id,is_public');
        upstreamQuery.set('id', `eq.${projectId}`);
        break;
      case 'map_versions': {
        const status = query.get('status');
        if (status && status !== 'eq.draft' && status !== 'eq.published') return failure(400, 'Invalid version filter.');
        upstreamQuery.set('select', query.get('select')?.split(',').includes('map_data') ? `${versionColumns},map_data` : versionColumns);
        upstreamQuery.set('project_id', `eq.${projectId}`);
        upstreamQuery.set('limit', '1');
        upstreamQuery.set('order', status === 'eq.published' ? 'published_at.desc.nullslast,id.desc' : 'id.desc');
        if (status) upstreamQuery.set('status', status);
        break;
      }
      case 'vehicle_service_hours':
      case 'tracking_live_snapshots':
        if (!vehicleId) return Response.json([], { headers: responseHeaders });
        upstreamQuery.set('select', resource === 'vehicle_service_hours' ? 'vehicle_id,enabled,time_zone,week,updated_at' : 'snapshot,revision');
        upstreamQuery.set('vehicle_id', `eq.${vehicleId}`);
        break;
      default:
        return failure(404, 'Tracking resource unavailable.');
    }
  } else if (request.method === 'POST' && path.length === 2 && path[0] === 'rpc') {
    const action = path[1];
    if (!['is_tracking_admin', 'save_vehicle_service_hours', 'save_tracking_map'].includes(action)) {
      return failure(404, 'Tracking action unavailable.');
    }
    const length = Number(request.headers.get('content-length'));
    if (length > maxBodySize) return failure(413, 'This map is too large to save.');
    try {
      body = await request.text();
      if (Buffer.byteLength(body) > maxBodySize) return failure(413, 'This map is too large to save.');
      const value = JSON.parse(body);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return failure(400, 'Invalid tracking request.');
      if (action === 'is_tracking_admin') {
        return Response.json(value.p === projectId, { headers: responseHeaders });
      }
      if (action === 'save_vehicle_service_hours') {
        const week = parseTrackingWeek(value.hours_week);
        if (!vehicleId || value.target_vehicle !== vehicleId || typeof value.hours_enabled !== 'boolean' || !week) {
          return failure(400, 'Invalid vehicle operating hours.');
        }
        body = JSON.stringify({ target_vehicle: vehicleId, hours_enabled: value.hours_enabled, hours_week: week });
      } else {
        if (value.p_project !== projectId || !['draft', 'published'].includes(value.p_status) ||
            value.p_map?.type !== 'FeatureCollection' || !Array.isArray(value.p_map.features) ||
            !mapFields.every(field => Object.hasOwn(value, field))) {
          return failure(400, 'Invalid map save request.');
        }
        body = JSON.stringify(Object.fromEntries(mapFields.map(field => [field, value[field]])));
      }
    } catch {
      return failure(400, 'Invalid tracking request.');
    }
    resource = `rpc/${action}`;
  } else {
    return failure(404, 'Tracking resource unavailable.');
  }

  const upstream = new URL(`/rest/v1/${resource}`, process.env.LIVE_MAP_SUPABASE_URL);
  upstream.search = upstreamQuery.toString();
  try {
    const result = await fetch(upstream, {
      method: request.method, body, signal: AbortSignal.timeout(12000), cache: 'no-store',
      headers: {
        apikey: process.env.LIVE_MAP_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    return new Response(result.body, {
      status: result.status,
      headers: { ...responseHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return Response.json({ message: 'The tracking project could not respond. Check the latest saved version before retrying.' }, {
      status: 503, headers: responseHeaders,
    });
  }
}

export const GET = relay;
export const POST = relay;
