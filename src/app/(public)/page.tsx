import {getDayPlanner} from '@/modules/content/day-planner-server';
import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublicReviews } from "@/modules/content/reviews-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { getPublishedWebsite, getWebsitePublication } from "@/modules/content/website-server";
import { HomepageView } from "@/components/public/homepage-view";
import { websiteMetadata } from "@/modules/content/seo";
export async function generateMetadata() {
  const { content: c, published } = await getWebsitePublication();
  return websiteMetadata(c,published);
}
export default async function Home() {
  const [home, content, reviews, planner, places] = await Promise.all([getHomepage(), getPublishedWebsite(), getPublicReviews(), getDayPlanner(), getPublicDestinations()]);
  return <HomepageView planner={planner} home={home} content={content} reviews={reviews} places={places.filter(d=>d.showOnHomepage)} />;
}
