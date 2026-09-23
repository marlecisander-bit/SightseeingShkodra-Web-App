import { getHomepage } from "@/modules/content/homepage-server";
import { getPublishedWebsite, getWebsitePublication } from "@/modules/content/website-server";
import { HomepageView } from "@/components/public/homepage-view";
import { pageMetadata } from "@/modules/content/seo";
export async function generateMetadata() {
  const { content: c, published } = await getWebsitePublication();
  const metadata = pageMetadata("/", c["seo.title"], c["seo.description"], published);
  return { ...metadata, title: c["seo.title"], openGraph: { ...metadata.openGraph, images: [{ url: c["seo.image"], alt: c["seo.alt"] }] } };
}
export default async function Home() {
  const [home, content] = await Promise.all([getHomepage(), getPublishedWebsite()]);
  return <HomepageView home={home} content={content} />;
}
