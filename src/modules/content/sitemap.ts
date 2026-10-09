import type { Destination } from './destinations';
/** Only authoritative published editorial/catalog projections; no availability quotes. */
export function publishedSitemapPaths(
  website: { published: boolean; content: Record<string, string> },
  productPublished: boolean,
  destinations: Pick<Destination, 'slug' | 'guidePublished'>[],
) {
  const paths = website.published ? ['/', '/route', '/explore', '/faq'] : [];
  if (productPublished) paths.push('/tour');
  if (website.published && productPublished) paths.push('/book');
  for (const [kind, path] of [['privacy', '/privacy-policy'], ['terms', '/terms-and-conditions']]) {
    if (website.published && website.content[`legal.${kind}.status`] === 'published' && website.content[`legal.${kind}.text`]?.trim()) paths.push(path);
  }
  for (const destination of destinations) {
    if (destination.guidePublished && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(destination.slug)) paths.push('/explore/' + destination.slug);
  }
  return [...new Set(paths)];
}
