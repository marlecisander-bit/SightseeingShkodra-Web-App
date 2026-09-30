import { BookingProvider, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "./public.css";
import { getPublishedWebsite } from "@/modules/content/website-server";

import {getPublicReviews} from "@/modules/content/reviews-server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content,reviews] = await Promise.all([getPublishedWebsite(),getPublicReviews()]);
  return (
    <div className="public-site">
      <BookingProvider>
        <a className="p-skip" href="#main-content">
          Skip to content
        </a>
        <Header content={content} />
        {children}
        <Footer content={content} googleReviewsUrl={reviews.settings.google_reviews_url} />
      </BookingProvider>
    </div>
  );
}
