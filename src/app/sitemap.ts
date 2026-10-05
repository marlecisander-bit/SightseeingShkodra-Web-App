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
  const [home, website, destinations] = await Promise.all([getHomepage(), getWebsitePublication(), getPublicDestinations()]);
  const paths = sitemapPaths(home, destinations);
  if (website.published && !paths.includes("/")) paths.unshift("/");
  if (website.published) paths.push('/faq');
  for(const [kind,path] of [['privacy','/privacy-policy'],['terms','/terms-and-conditions']])if(website.published&&website.content['legal.'+kind+'.status']==='published'&&website.content['legal.'+kind+'.text']?.trim())paths.push(path);
  return paths.map((path) => ({ url: `${config.origin}${path}` }));
}
