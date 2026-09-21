import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Booking } from './contracts';
export type { Booking } from './contracts';
export class LifecycleError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'RECONCILIATION_REQUIRED' | 'UNAVAILABLE') { super(code); }
}
async function invoke(name: string, args: Record<string, string>): Promise<Booking> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new LifecycleError('UNAVAILABLE');
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } });
    const { data, error } = await client.rpc(name, args);
    if (error) throw new LifecycleError(error.code === 'P0002' ? 'NOT_FOUND' : error.code === 'P0001' ? 'RECONCILIATION_REQUIRED' : 'UNAVAILABLE');
    if (!data?.id) throw new LifecycleError('UNAVAILABLE');
    return { id: data.id, order_id: data.order_id, booking_reference: data.booking_reference, status: data.status, confirmed_at: data.confirmed_at };
  } catch (error) { if (error instanceof LifecycleError) throw error; throw new LifecycleError('UNAVAILABLE'); }
}
export function prepareBooking(operatorId: string, orderId: string, sessionKey: string) {
  return invoke('prepare_booking_v1', { p_operator_id: operatorId, p_order_id: orderId, p_session_key: sessionKey });
}
// Trusted payment integration only. Never expose this as a browser-callable action.
export function confirmPaidBooking(operatorId: string, orderId: string, paymentId: string) {
  return invoke('confirm_booking_v1', { p_operator_id: operatorId, p_order_id: orderId, p_payment_id: paymentId });
}
