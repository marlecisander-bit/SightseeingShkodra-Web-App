import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requirePermission } from '@/modules/identity/require-permission';
import { matchesPublicMapProject, publicMapBinding } from './public-map-binding';

const cookieName = 'shkodra-tracking-admin';
const cookiePath = '/admin';

function sessionSecret() {
  return process.env.LIVE_MAP_ADMIN_SESSION_SECRET || process.env.CHECKOUT_SESSION_SECRET;
}

export function trackingAdminEnabled(operatorId: string) {
  return process.env.VERCEL_ENV !== 'preview' && operatorId === process.env.PUBLIC_OPERATOR_ID &&
    !!process.env.LIVE_MAP_SUPABASE_URL && !!process.env.LIVE_MAP_PUBLISHABLE_KEY &&
    (sessionSecret()?.length ?? 0) >= 32 &&
    matchesPublicMapProject(process.env.LIVE_MAP_PROJECT_SLUG);
}

function signature(operatorId: string, userId: string, token: string) {
  return createHmac('sha256', sessionSecret()!)
    .update(JSON.stringify(['live-map-admin:v1', operatorId, userId, token])).digest('hex');
}

function clientFor(token?: string) {
  return createClient(process.env.LIVE_MAP_SUPABASE_URL!, process.env.LIVE_MAP_PUBLISHABLE_KEY!, {
    ...(token ? { accessToken: async () => token } : { auth: { persistSession: false, autoRefreshToken: false } }),
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }),
    },
  });
}

async function authorizedProject(client: ReturnType<typeof clientFor>) {
  const { data, error } = await client.from('projects').select('id,default_vehicle_id')
    .eq('slug', publicMapBinding.project).eq('is_public', true).single();
  if (error) throw new Error('Tracking project lookup failed');
  if (!data) return null;
  const access = await client.rpc('is_tracking_admin', { p: data.id });
  if (access.error) throw new Error('Tracking administrator check failed');
  return access.data === true ? { projectId: data.id as string, vehicleId: data.default_vehicle_id as string | null } : null;
}

export async function connectTrackingAdmin(operatorId: string, email: string, password: string) {
  const { userId } = await requirePermission(operatorId, 'tracking.manage');
  if (!trackingAdminEnabled(operatorId)) return 'connection-unavailable';
  const { data, error } = await clientFor().auth.signInWithPassword({ email, password });
  const token = data.session?.access_token;
  if (error?.code === 'invalid_credentials') return 'invalid-credentials';
  if (error?.code === 'email_not_confirmed') return 'email-not-confirmed';
  if (error?.status === 429) return 'try-later';
  if (error || !token || !data.session) return 'connection-unavailable';
  if (!await authorizedProject(clientFor(token))) return 'tracking-access-denied';
  (await cookies()).set(cookieName, `${signature(operatorId, userId, token)}:${token}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', path: cookiePath, maxAge: Math.min(data.session.expires_in, 3600),
  });
  return 'connected';
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
  const project = await authorizedProject(client).catch(() => null);
  return project ? { client, token, ...project } : null;
}
