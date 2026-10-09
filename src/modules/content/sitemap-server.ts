import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getPublicDestinations } from './destinations-server';
import { getWebsitePublication } from './website-server';
import { publishedSitemapPaths } from './sitemap';

export const isPublicTourPublished = cache(async () => {
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key, PUBLIC_OPERATOR_ID: operator, PUBLIC_HOMEPAGE_PRODUCT_SLUG: slug } = process.env;
  if (!url || !key || !operator || !slug) throw Error('Sitemap catalog configuration unavailable');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(4000) }) } });
  const { data, error } = await client.from('products').select('id').eq('operator_id', operator).eq('slug', slug).eq('status', 'published').eq('type', 'van_tour').maybeSingle();
  if (error) throw Error('Sitemap catalog temporarily unavailable');
  return Boolean(data);
});

type SitemapSources = {
  website: typeof getWebsitePublication;
  product: typeof isPublicTourPublished;
  destinations: typeof getPublicDestinations;
};
export async function loadPublishedSitemapPaths(sources: SitemapSources) {
  const [website, productPublished, destinations] = await Promise.all([sources.website(), sources.product(), sources.destinations()]);
  if (website.unavailable) throw Error('Sitemap publication temporarily unavailable');
  return publishedSitemapPaths(website, productPublished, destinations);
}

export async function getPublishedSitemapPaths() {
  return loadPublishedSitemapPaths({ website: getWebsitePublication, product: isPublicTourPublished, destinations: getPublicDestinations });
}
