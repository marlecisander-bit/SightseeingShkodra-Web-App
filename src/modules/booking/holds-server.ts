import 'server-only';
import { createClient } from '@supabase/supabase-js';

import type { Hold, CreateHoldRequest } from './contracts';
export type { Hold } from './contracts';
export class HoldError extends Error {
  constructor(public readonly code: 'INVALID_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'SOLD_OUT' | 'UNAVAILABLE') { super(code); }
}
async function call(name: string, args: Record<string, unknown>): Promise<Hold> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new HoldError('UNAVAILABLE');
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } });
    const { data, error } = await client.rpc(name, args);
    if (error) {
      const codes: Record<string, ConstructorParameters<typeof HoldError>[0]> = {
        '22023': 'INVALID_REQUEST', '22P02': 'INVALID_REQUEST', P0002: 'NOT_FOUND', '23505': 'CONFLICT', P0001: 'SOLD_OUT',
      };
      throw new HoldError(codes[error.code] ?? 'UNAVAILABLE');
    }
    if (!data?.id) throw new HoldError('UNAVAILABLE');
    // Never return the private session key or internal order/request metadata.
    return { id: data.id, departure_id: data.departure_id, quantity: data.quantity, status: data.status, expires_at: data.expires_at };
  } catch (error) { if (error instanceof HoldError) throw error; throw new HoldError('UNAVAILABLE'); }
}
// Trusted server callers must derive sessionKey from a secure server-issued session.
export function createHold(input: CreateHoldRequest) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 2147483647) throw new HoldError('INVALID_REQUEST');
  return call('create_hold_v1', { p_operator_id: input.operatorId, p_departure_id: input.departureId,
    p_session_key: input.sessionKey, p_request_id: input.requestId, p_quantity: input.quantity });
}
export function readHold(operatorId: string, holdId: string, sessionKey: string) {
  return call('manage_hold_v1', { p_operator_id: operatorId, p_hold_id: holdId, p_session_key: sessionKey, p_release: false });
}
export function releaseHold(operatorId: string, holdId: string, sessionKey: string) {
  return call('manage_hold_v1', { p_operator_id: operatorId, p_hold_id: holdId, p_session_key: sessionKey, p_release: true });
}
