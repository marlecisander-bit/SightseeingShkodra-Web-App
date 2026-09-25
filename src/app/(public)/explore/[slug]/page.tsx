import { GuideView } from "@/components/public/editorial-pages";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicDestinations } from "@/modules/content/destinations-server";


import {
  pageMetadata,
  guideStructuredData,
  safeJsonLd,
  seoConfig,
} from "@/modules/content/seo";
import { ActionLink } from "@/components/public/ui";
type Props = { params: Promise<{ slug: string }> };
async function guide(slug: string) {
  const destinations=await getPublicDestinations();
  const place=destinations.find(d=>d.slug===slug || d.aliases.includes(slug));
  if(!place || !place.guidePublished)notFound();
  if(place.slug!==slug)permanentRedirect('/explore/'+place.slug);
  const content={title:place.name,text:place.story||place.detail||place.text,metaTitle:place.seoTitle,metaDescription:place.seoDescription,ogImage:place.socialImage||place.image,ogImageAlt:place.alt};
  return { place, content };
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { content } = await guide(slug);
  const metadata = pageMetadata(
    `/explore/${slug}`,
    content.metaTitle ?? `${content.title} | Sightseeing Shkodra`,
    content.metaDescription ?? content.text.slice(0, 160),
  );
  return {...metadata,openGraph:{...metadata.openGraph,...(content.ogImage?{images:[{url:content.ogImage,alt:content.ogImageAlt??""}]}:{})}};
}
export default async function Guide({ params }: Props) {
  const { slug } = await params;
  const { place, content } = await guide(slug);
  const { origin } = seoConfig();
  return (
    <main id="main-content" className="p-subpage p-container">
      <GuideView content={content} place={place}/>
      <ActionLink href="/tour">View the day tour</ActionLink>
      {origin && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              guideStructuredData(
                origin,
                slug,
                content.title,
                content.metaDescription ?? content.text.slice(0, 160),
              ),
            ),
          }}
        />
      )}
    </main>
  );
}
