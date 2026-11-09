import type { MetadataRoute } from "next";
import { seoConfig, robotsPolicy } from "@/modules/content/seo";
import { connection } from "next/server";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  return robotsPolicy(seoConfig());
}
