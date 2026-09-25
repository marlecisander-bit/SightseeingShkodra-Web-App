import { getPublicDestinations } from "@/modules/content/destinations-server";
import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getHomepage } from "@/modules/content/homepage-server";
import { seoConfig, sitemapPaths } from "@/modules/content/seo";
import { getWebsitePublication } from "@/modules/content/website-server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const config = seoConfig();
  if (!config.index || !config.origin) return [];
  const [home, website] = await Promise.all([getHomepage(), getWebsitePublication()]);
  const paths = home.state === "unavailable" || home.state === "unconfigured" ? [] : sitemapPaths(home).filter(path=>!path.startsWith("/explore/"));
  for(const destination of await getPublicDestinations())if(destination.guidePublished)paths.push(`/explore/${destination.slug}`);
  if (website.published && !paths.includes("/")) paths.unshift("/");
  return paths.map((path) => ({ url: `${config.origin}${path}` }));
}
