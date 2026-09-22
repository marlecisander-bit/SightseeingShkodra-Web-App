import type { MetadataRoute } from "next";
import { seoConfig } from "@/modules/content/seo";
import { connection } from "next/server";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const config = seoConfig();
  if (!config.index) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth/", "/api/", "/book", "/your-day"],
    },
    sitemap: `${config.origin}/sitemap.xml`,
  };
}
