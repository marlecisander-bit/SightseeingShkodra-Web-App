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
    const { data, error } = await client.rpc('read_passenger_availability_v1', {p_operator:request.operatorId,p_product:request.productId,p_date:request.date,p_counts:request.passengers??{adult:request.guests,child:0,infant:0}});
    if (error) throw new AvailabilityError(error.code==='22023'?'INVALID_CONFIGURATION':'UNAVAILABLE');
    return quoteAvailability(request, data as AvailabilitySnapshot | null);
  } catch (error) {
    if (error instanceof AvailabilityError) throw error;
    throw new AvailabilityError('UNAVAILABLE');
  }
}
