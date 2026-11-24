'use server';

import { redirect } from 'next/navigation';
import { requirePermission } from '@/modules/identity/require-permission';
import { connectTrackingAdmin, disconnectTrackingAdmin } from '@/modules/tracking/admin-server';

function finish(operatorId: string, result: string): never {
  redirect(`/admin/${encodeURIComponent(operatorId)}/live-map?result=${result}`);
}

export async function connectMapAccount(operatorId: string, form: FormData) {
  await requirePermission(operatorId, 'tracking.manage');
  const email = form.get('email');
  const password = form.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password ||
      email.length > 320 || password.length > 1024) finish(operatorId, 'invalid-credentials');
  const result = await connectTrackingAdmin(operatorId, email.trim(), password).catch(() => 'connection-unavailable');
  finish(operatorId, result);
}

export async function disconnectMapAccount(operatorId: string) {
  await disconnectTrackingAdmin(operatorId);
  finish(operatorId, 'disconnected');
}
