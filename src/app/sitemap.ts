import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getHomepage } from "@/modules/content/homepage-server";
import { seoConfig, sitemapPaths } from "@/modules/content/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const config = seoConfig();
  if (!config.index || !config.origin) return [];
  const home = await getHomepage();
  if (home.state === "unavailable" || home.state === "unconfigured") return [];
  return sitemapPaths(home).map((path) => ({ url: `${config.origin}${path}` }));
}
