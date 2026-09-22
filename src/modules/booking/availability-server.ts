import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { AvailabilityError, quoteAvailability, validateAvailabilityRequest, type AvailabilityRequest, type AvailabilitySnapshot } from './availability';

// Shared server API for future public/admin/partner handlers. Returns only saleable data.
export async function getAvailability(request: AvailabilityRequest, signal?: AbortSignal) {
  validateAvailabilityRequest(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new AvailabilityError('UNAVAILABLE');
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', ...(signal ? { signal } : {}) }) } });
    const { data, error } = await client.rpc('read_availability_v1', {
      p_operator_id: request.operatorId, p_product_id: request.productId, p_date: request.date,
    });
    if (error) throw new AvailabilityError('UNAVAILABLE');
    return quoteAvailability(request, data as AvailabilitySnapshot | null);
  } catch (error) {
    if (error instanceof AvailabilityError) throw error;
    throw new AvailabilityError('UNAVAILABLE');
  }
}
