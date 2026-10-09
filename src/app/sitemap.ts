import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { seoConfig } from "@/modules/content/seo";
import { getPublishedSitemapPaths } from "@/modules/content/sitemap-server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const config = seoConfig();
  if (!config.index || !config.origin) return [];
  // Surface dependency failures as a retryable HTTP error instead of an empty 200.
  // No stale cache: withdrawals must take effect immediately.
  const paths = await getPublishedSitemapPaths();
  if (!paths.length) throw Error("No published sitemap content available");
  return paths.map(path => ({ url: `${config.origin}${path}` }));
}
