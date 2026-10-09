import { isPublicTourPublished } from "@/modules/content/sitemap-server";
import { PageIntro } from "@/components/public/page-intro";
import { getWebsitePublication, getPublishedWebsite } from "@/modules/content/website-server";
import {editorialMetadata} from "@/modules/content/seo";
import { BookingFlow } from "@/components/public/booking";
export async function generateMetadata(){const [{content,published},product]=await Promise.all([getWebsitePublication(),isPublicTourPublished().catch(()=>false)]);return editorialMetadata('/book','bookPage',content,published&&product);}

export default async function Book() {
  const c=await getPublishedWebsite();
  return (
    <main id="main-content" className="p-subpage p-container p-book-page">
      <PageIntro content={c} prefix="bookPage"/>
      <BookingFlow />
    </main>
  );
}
