import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requirePermission } from '@/modules/identity/require-permission';
import { parseTrackingWeek, trackingWeekdays } from './service-hours';
import { matchesPublicMapProject, publicMapBinding } from './public-map-binding';

const cookieName = 'shkodra-tracking-admin';
const cookiePath = '/admin';

export function trackingAdminEnabled(operatorId: string) {
  return process.env.VERCEL_ENV !== 'preview' && process.env.LIVE_MAP_NATIVE_ROUTE === '1' && operatorId === process.env.PUBLIC_OPERATOR_ID &&
    !!process.env.LIVE_MAP_SUPABASE_URL && !!process.env.LIVE_MAP_PUBLISHABLE_KEY &&
    (process.env.LIVE_MAP_ADMIN_SESSION_SECRET?.length ?? 0) >= 32 &&
    matchesPublicMapProject(process.env.LIVE_MAP_PROJECT_SLUG);
}

function signature(operatorId: string, userId: string, token: string) {
  return createHmac('sha256', process.env.LIVE_MAP_ADMIN_SESSION_SECRET!)
    .update(JSON.stringify([operatorId, userId, token])).digest('hex');
}

function clientFor(token?: string) {
  return createClient(process.env.LIVE_MAP_SUPABASE_URL!, process.env.LIVE_MAP_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }),
    },
  });
}

async function authorizedProject(client: ReturnType<typeof clientFor>) {
  const { data, error } = await client.from('projects').select('id,default_vehicle_id')
    .eq('slug', publicMapBinding.project).eq('is_public', true).single();
  if (error || !data) return null;
  const access = await client.rpc('is_tracking_admin', { p: data.id });
  return !access.error && access.data === true ? { projectId: data.id as string, vehicleId: data.default_vehicle_id as string | null } : null;
}

export async function connectTrackingAdmin(operatorId: string, email: string, password: string) {
  const { userId } = await requirePermission(operatorId, 'tracking.manage');
  if (!trackingAdminEnabled(operatorId)) return false;
  const { data, error } = await clientFor().auth.signInWithPassword({ email, password });
  const token = data.session?.access_token;
  if (error || !token || !data.session || !await authorizedProject(clientFor(token))) return false;
  (await cookies()).set(cookieName, `${signature(operatorId, userId, token)}:${token}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', path: cookiePath, maxAge: Math.min(data.session.expires_in, 3600),
  });
  return true;
}

export async function disconnectTrackingAdmin(operatorId: string) {
  await requirePermission(operatorId, 'tracking.manage');
  (await cookies()).set(cookieName, '', { path: cookiePath, maxAge: 0 });
}

export async function trackingAdminSession(operatorId: string) {
  const { userId } = await requirePermission(operatorId, 'tracking.manage');
  if (!trackingAdminEnabled(operatorId)) return null;
  const value = (await cookies()).get(cookieName)?.value ?? '';
  const [mac, token] = value.split(':');
  if (!token || !/^[a-f0-9]{64}$/.test(mac) ||
      !timingSafeEqual(Buffer.from(mac), Buffer.from(signature(operatorId, userId, token)))) return null;
  const client = clientFor(token);
  const project = await authorizedProject(client);
  return project ? { client, ...project } : null;
}

export async function readTrackingVersions({ client, projectId }: NonNullable<Awaited<ReturnType<typeof trackingAdminSession>>>) {
  const query = () => client.from('map_versions').select('id,status').eq('project_id', projectId);
  const [head, published, draft] = await Promise.all([
    client.from('map_versions').select('id,status,map_data').eq('project_id', projectId).order('id', { ascending: false }).limit(1).maybeSingle(),
    query().eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(1).maybeSingle(),
    query().eq('status', 'draft').order('id', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (head.error || published.error || draft.error) throw Error('Map versions unavailable');
  return { head: head.data, published: published.data?.id ?? null, draft: draft.data?.id ?? null };
}

export async function readTrackingHours({ client, vehicleId }: NonNullable<Awaited<ReturnType<typeof trackingAdminSession>>>) {
  if (!vehicleId) return null;
  const { data, error } = await client.from('vehicle_service_hours').select('enabled,week')
    .eq('vehicle_id', vehicleId).maybeSingle();
  if (error) throw Error('Tracking hours unavailable');
  const week = data ? parseTrackingWeek(data.week) : trackingWeekdays.map(() => null);
  if (!week || (data && typeof data.enabled !== 'boolean')) throw Error('Invalid tracking hours');
  return { enabled: data?.enabled === true, week };
}
