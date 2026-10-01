import 'server-only';
import { cache } from 'react';
import { connection } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** The FAQ consumes only published product inclusions, never a seat/price quote. */
export const getFaqInclusions = cache(async (): Promise<string | null> => {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const operator = process.env.PUBLIC_OPERATOR_ID;
  const slug = process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG;
  if (!url || !key || !operator || !slug) return null;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(4000) }) },
    });
    const { data, error } = await client.from('products').select('inclusions')
      .eq('operator_id', operator).eq('slug', slug).eq('status', 'published').eq('type', 'van_tour').maybeSingle();
    if (error) return null;
    return typeof data?.inclusions === 'string' && data.inclusions.trim() ? data.inclusions : null;
  } catch { return null; }
});
