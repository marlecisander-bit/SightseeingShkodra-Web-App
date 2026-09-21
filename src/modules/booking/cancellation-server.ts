import 'server-only';
import { withOperatorService } from '../identity/operator-service';
import type { CancellationResult } from './contracts';
export type { CancellationResult, RefundReviewRequested } from './contracts';
export class CancellationError extends Error {
  constructor(public readonly code: 'INVALID_REQUEST' | 'NOT_FOUND' | 'RECONCILIATION_REQUIRED' | 'UNAVAILABLE') { super(code); }
}
export async function cancelOrder(operatorId: string, orderId: string, reason: string): Promise<CancellationResult> {
  if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) throw new CancellationError('INVALID_REQUEST');
  return withOperatorService(operatorId, 'bookings.cancel', async (client, context) => {
    try {
      const { data, error } = await client.rpc('cancel_order_v1', { p_operator_id: context.operatorId,
        p_order_id: orderId, p_actor_id: context.staffProfileId, p_reason: reason.trim() });
      if (error) throw new CancellationError(error.code === 'P0002' ? 'NOT_FOUND' : error.code === 'P0001' ? 'RECONCILIATION_REQUIRED' : 'UNAVAILABLE');
      if (data?.status !== 'cancelled' || data.orderId !== orderId) throw new CancellationError('UNAVAILABLE');
      return data as CancellationResult;
    } catch (error) { if (error instanceof CancellationError) throw error; throw new CancellationError('UNAVAILABLE'); }
  });
}
