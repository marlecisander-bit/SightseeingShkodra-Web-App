import { PageIntro } from "@/components/public/page-intro";
import { getPublishedWebsite } from "@/modules/content/website-server";
import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/booking";
export const metadata: Metadata = {
  title: "Book your day | Sightseeing Shkodra",
};

export default async function Book() {
  const c=await getPublishedWebsite();
  return (
    <main id="main-content" className="p-subpage p-container p-book-page">
      <PageIntro content={c} prefix="bookPage"/>
      <BookingFlow />
    </main>
  );
}
