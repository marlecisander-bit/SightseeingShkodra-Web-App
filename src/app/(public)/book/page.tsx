import { PageIntro } from "@/components/public/page-intro";
import { getPublishedWebsite } from "@/modules/content/website-server";
import {editorialMetadata} from "@/modules/content/seo";
import { BookingFlow } from "@/components/public/booking";
export async function generateMetadata(){return editorialMetadata('/book','bookPage',await getPublishedWebsite());}

export default async function Book() {
  const c=await getPublishedWebsite();
  return (
    <main id="main-content" className="p-subpage p-container p-book-page">
      <PageIntro content={c} prefix="bookPage"/>
      <BookingFlow />
    </main>
  );
}
