'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminSiteOrigin } from '@/modules/identity/admin-origin';
import { passwordValidation } from '@/modules/identity/account-setup';
import { requirePermission } from '@/modules/identity/require-permission';
import { disconnectTrackingAdmin, trackingAdminEnabled } from '@/modules/tracking/admin-server';
import { publicMapBinding } from '@/modules/tracking/public-map-binding';

const recoveryPath = '/auth/live-map-recovery';
const verifier = 'live-map-password-recovery-code-verifier';
const cookieOptions = { path: recoveryPath, httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };

async function recoveryClient(requesting: boolean) {
  const operatorId = process.env.PUBLIC_OPERATOR_ID;
  if (!operatorId || !trackingAdminEnabled(operatorId)) throw new Error('Recovery unavailable');
  await requirePermission(operatorId, 'tracking.manage');
  const jar = await cookies();
  const memory = new Map<string, string>();
  const client = createClient(process.env.LIVE_MAP_SUPABASE_URL!, process.env.LIVE_MAP_PUBLISHABLE_KEY!, {
    auth: { storageKey: 'live-map-password-recovery', flowType: 'pkce', autoRefreshToken: false, detectSessionInUrl: false,
      storage: {
        getItem: key => key === verifier ? jar.get(verifier)?.value ?? null : memory.get(key) ?? null,
        setItem(key, value) {
          if (key === verifier && requesting) jar.set(verifier, value, { ...cookieOptions, maxAge: 3600 });
          else memory.set(key, value);
        },
        removeItem(key) {
          if (key === verifier) jar.set(verifier, '', { ...cookieOptions, maxAge: 0 });
          else memory.delete(key);
        },
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }) },
  });
  return { client, operatorId };
}

export async function requestTrackingRecovery(_state: { message: string }, form: FormData) {
  const email = form.get('email');
  if (typeof email !== 'string' || !email.trim() || email.length > 320) return { message: 'Enter your Live Map account email.' };
  try {
    const { client } = await recoveryClient(true);
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: new URL(recoveryPath, adminSiteOrigin()).href });
    if (error) return { message: 'Supabase could not send the recovery email. Try again later.' };
  } catch { return { message: 'Live Map password recovery is temporarily unavailable.' }; }
  return { message: 'If the address matches a Live Map account, check your email and open the newest link in this browser.' };
}

export async function resetTrackingPassword(form: FormData) {
  const error = passwordValidation(form);
  if (error) return { error };
  const code = form.get('code');
  if (typeof code !== 'string' || !/^[a-z0-9-]{20,128}$/i.test(code)) return { error: 'Open the latest recovery link in the browser that requested it.' };
  let operatorId: string;
  try {
    const recovery = await recoveryClient(false);
    operatorId = recovery.operatorId;
    const { client } = recovery;
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error || !exchange.data.session) return { error: 'This link is expired, already used, or was opened in another browser. Request a new link.' };
    const project = await client.from('projects').select('id').eq('slug', publicMapBinding.project).single();
    if (project.error || !project.data) return { error: 'The tracking project could not be verified. Request a new link and try again.' };
    const access = await client.rpc('is_tracking_admin', { p: project.data.id });
    if (access.error || access.data !== true) return { error: 'This account could not be verified as an administrator of the Live Map project.' };
    const update = await client.auth.updateUser({ password: form.get('password') as string });
    if (update.error) return { error: 'Supabase rejected this password. Request a new link and choose a different password.' };
    await disconnectTrackingAdmin(operatorId);
  } catch { return { error: 'The result could not be confirmed. Try the new password before requesting another link.' }; }
  redirect(`/admin/${operatorId}/live-map?result=password-reset`);
}
