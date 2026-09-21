import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { PendingOrder, CreatePendingOrderRequest } from './contracts';
export type { PendingOrder } from './contracts';
export class CheckoutError extends Error {
  constructor(public readonly code: 'INVALID_REQUEST' | 'NOT_FOUND' | 'HOLD_INACTIVE' | 'CONFLICT' | 'UNAVAILABLE') { super(code); }
}
// Session keys come from trusted server session handling, not arbitrary browser input.
export async function createPendingOrder(input: CreatePendingOrderRequest): Promise<PendingOrder> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new CheckoutError('UNAVAILABLE');
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (request, init) => fetch(request, { ...init, cache: 'no-store' }) } });
    const { data, error } = await client.rpc('create_pending_order_v1', { p_operator_id: input.operatorId,
      p_hold_id: input.holdId, p_session_key: input.sessionKey, p_customer_name: input.customer.name,
      p_customer_email: input.customer.email, p_customer_phone: input.customer.phone ?? null });
    if (error) {
      const codes: Record<string, ConstructorParameters<typeof CheckoutError>[0]> = { '22023': 'INVALID_REQUEST', '22P02': 'INVALID_REQUEST', P0002: 'NOT_FOUND', P0001: 'HOLD_INACTIVE', '23505': 'CONFLICT' };
      throw new CheckoutError(codes[error.code] ?? 'UNAVAILABLE');
    }
    if (!data?.orderId || !Array.isArray(data.items)) throw new CheckoutError('UNAVAILABLE');
    return data as PendingOrder;
  } catch (error) { if (error instanceof CheckoutError) throw error; throw new CheckoutError('UNAVAILABLE'); }
}
