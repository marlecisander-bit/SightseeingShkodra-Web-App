import { createClient } from '@supabase/supabase-js';
import { matchesPublicMapProject, publicMapBinding } from '@/modules/tracking/public-map-binding';
import { projectPublishedMap } from '@/modules/tracking/published-map';
import type { Position } from '@/modules/tracking/positions';

function publicPosition(value: unknown, vehicleId: string): Position | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const { latitude, longitude, source_recorded_at: observedAt } = row;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      typeof observedAt !== 'string' || !Number.isFinite(Date.parse(observedAt)) ||
      row.ui_observation_valid === false) return null;
  return { vehicleId, lat: latitude, lng: longitude, updatedAt: observedAt };
}

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const unavailable = () => Response.json({ error: 'Live map unavailable' }, { status: 503, headers });
  const { LIVE_MAP_SUPABASE_URL, LIVE_MAP_PUBLISHABLE_KEY } = process.env;
  if (process.env.LIVE_MAP_NATIVE_ROUTE !== '1') return new Response(null, { status: 404, headers });
  if (!matchesPublicMapProject(process.env.LIVE_MAP_PROJECT_SLUG) ||
      !LIVE_MAP_SUPABASE_URL || !LIVE_MAP_PUBLISHABLE_KEY) return unavailable();
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
    const client = createClient(LIVE_MAP_SUPABASE_URL, LIVE_MAP_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: project, error } = await client.from('projects').select('id,default_vehicle_id')
      .eq('slug', publicMapBinding.project).eq('is_public', true).abortSignal(signal).single();
    if (error || !project) return unavailable();
    const [map, tracking] = await Promise.all([
      client.from('map_versions').select('id,map_data').eq('project_id', project.id).eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false }).limit(1).abortSignal(signal).maybeSingle(),
      project.default_vehicle_id
        ? client.from('tracking_live_snapshots').select('snapshot').eq('vehicle_id', project.default_vehicle_id)
          .abortSignal(signal).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (map.error) return unavailable();
    const position = publicPosition(tracking.data?.snapshot?.position, project.default_vehicle_id);
    const snapshot = {
      state: tracking.error ? 'unavailable' : position ? 'ready' : 'empty',
      positions: position ? [position] : [],
    };
    return Response.json({ mapVersion: map.data?.id ?? null, map: projectPublishedMap(map.data?.map_data), snapshot }, { headers });
  } catch {
    return unavailable();
  }
}
