import {getCurrentMeetingPoint} from "@/modules/booking/meeting-point-server";
import { BookingProvider, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "./public.css";
import { getPublishedWebsite } from "@/modules/content/website-server";
import {whatsappLink} from '@/modules/content/whatsapp';
import {WhatsAppContact} from '@/components/public/whatsapp-contact';

import {getPublicReviewSettings} from "@/modules/content/reviews-server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content,reviews,currentMeetingPoint] = await Promise.all([getPublishedWebsite(),getPublicReviewSettings(),getCurrentMeetingPoint()]);
  return (
    <div className="public-site">
      <BookingProvider content={content} currentMeetingPoint={currentMeetingPoint}>
        <a className="p-skip" href="#main-content">
          Skip to content
        </a>
        <Header content={content} />
        {children}
        <Footer content={content} googleReviewsUrl={reviews.google_reviews_url} />
        <WhatsAppContact href={whatsappLink(content)} label={content['whatsapp.label']??''} desktop={content['whatsapp.desktop']==='true'} mobile={content['whatsapp.mobile']==='true'}/>
      </BookingProvider>
    </div>
  );
}
