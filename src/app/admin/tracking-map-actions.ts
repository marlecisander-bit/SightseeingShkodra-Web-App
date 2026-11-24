'use server';

import { redirect } from 'next/navigation';
import { requirePermission } from '@/modules/identity/require-permission';
import { connectTrackingAdmin, disconnectTrackingAdmin, readTrackingVersions, trackingAdminSession } from '@/modules/tracking/admin-server';

function finish(operatorId: string, result: string): never {
  redirect(`/admin/${encodeURIComponent(operatorId)}/live-map?result=${result}`);
}

export async function connectMapAccount(operatorId: string, form: FormData) {
  await requirePermission(operatorId, 'tracking.manage');
  const email = form.get('email');
  const password = form.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password ||
      email.length > 320 || password.length > 1024) finish(operatorId, 'connection-failed');
  let connected = false;
  try { connected = await connectTrackingAdmin(operatorId, email.trim(), password); }
  catch { /* The sign-in outcome is presented without upstream error details. */ }
  finish(operatorId, connected ? 'connected' : 'connection-failed');
}

export async function disconnectMapAccount(operatorId: string) {
  await disconnectTrackingAdmin(operatorId);
  finish(operatorId, 'disconnected');
}

export async function saveTrackingMap(operatorId: string, form: FormData) {
  const session = await trackingAdminSession(operatorId);
  if (!session) finish(operatorId, 'connection-failed');
  const status = form.get('status');
  const requestId = form.get('requestId');
  if ((status !== 'draft' && status !== 'published') || typeof requestId !== 'string' ||
      !/^[a-f0-9-]{36}$/i.test(requestId)) finish(operatorId, 'invalid');
  let result = 'save-failed';
  try {
    const versions = await readTrackingVersions(session);
    if (String(versions.head?.id ?? '') !== form.get('head') ||
        String(versions.published ?? '') !== form.get('published') ||
        String(versions.draft ?? '') !== form.get('draft')) {
      result = 'conflict';
    } else {
      const submitted = form.get('geojson');
      const map = status === 'published' && versions.head?.status === 'draft'
        ? versions.head.map_data
        : status === 'draft' && typeof submitted === 'string' && submitted.length <= 500_000
          ? JSON.parse(submitted) : null;
      if (map?.type !== 'FeatureCollection' || !Array.isArray(map.features)) {
        result = 'invalid';
      } else {
        const { error } = await session.client.rpc('save_tracking_map', {
          p_project: session.projectId, p_expected_head: versions.head?.id ?? null,
          p_expected_published: versions.published, p_expected_draft: versions.draft,
          p_status: status, p_map: map, p_request: requestId,
        });
        result = error?.code === '40001' ? 'conflict' : error?.code === '22023' ? 'invalid' :
          error ? 'save-failed' : status === 'draft' ? 'draft-saved' : 'published';
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) result = 'invalid';
  }
  finish(operatorId, result);
}
