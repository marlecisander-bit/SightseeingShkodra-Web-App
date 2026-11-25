import {preloadHomepageHero} from '@/components/public/homepage-hero-images';
import {getBookableProducts} from '@/modules/booking/products-server';
import {loadPublicPartners} from '@/modules/content/partners-server';
import {homepageVisible} from '@/modules/content/website-schema';
import {Suspense} from "react";
import {getDestinationStops} from "@/modules/content/destination-stops-server";
import type {WebsiteContent} from "@/modules/content/website-schema";
import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublicReviews } from "@/modules/content/reviews-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { getWebsitePublication } from "@/modules/content/website-server";
import { HomepageDetails, HomepageView } from "@/components/public/homepage-view";
import {businessStructuredData} from "@/modules/content/business-structured-data";
import {safeJsonLd,seoConfig} from "@/modules/content/seo";
import { websiteMetadata } from "@/modules/content/seo";
export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return websiteMetadata(content, published);
}
async function PublishedHomepageDetails({ content }: { content: WebsiteContent }) {
  const showRoute = homepageVisible(content, "route");
  const [route, places, reviews, partners] = await Promise.all([
    showRoute ? getDestinationStops(process.env.PUBLIC_OPERATOR_ID ?? "") : undefined,
    showRoute ? getPublicDestinations().catch(() => []) : [],
    homepageVisible(content, "reviews") ? getPublicReviews() : undefined,
    loadPublicPartners(homepageVisible(content, "partners")),
  ]);
  return <HomepageDetails content={content} stops={route?.available ? route.stops : null}
    reviews={reviews} places={places.filter(place => place.showOnHomepage)} partners={partners}/>;
}

export default async function Home() {
  const publication = await getWebsitePublication();
  if (!publication.published) return <main id="main-content" className="p-section p-container"><p role="alert">Website content is temporarily unavailable. Please try again later.</p></main>;
  const content = publication.content;
  preloadHomepageHero(content);
  const [home, products] = await Promise.all([getHomepage(), getBookableProducts().catch(() => [])]);
  return <><HomepageView products={products} home={home} content={content}
    details={<Suspense fallback={null}><PublishedHomepageDetails content={content}/></Suspense>}/>
    {seoConfig().origin&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(businessStructuredData(seoConfig().origin!,content))}}/>}</>;
}
