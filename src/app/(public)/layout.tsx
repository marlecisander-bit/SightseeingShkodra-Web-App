import {timeHomepage} from '@/modules/diagnostics/homepage-server-timing';
import {SeasonalAnnouncement} from '@/components/public/seasonal-announcement';
import {seasonalActive} from '@/modules/content/seasonal-announcement';
import {getBookableProducts} from '@/modules/booking/products-server';
import { PublicAnalytics } from "@/components/public/analytics";
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
  return timeHomepage('layout',async()=>{
  const [content,reviews,currentMeetingPoint,products] = await Promise.all([timeHomepage('layout.content.await',()=>getPublishedWebsite()),timeHomepage('layout.reviews.await',()=>getPublicReviewSettings()),timeHomepage('layout.meeting.await',()=>getCurrentMeetingPoint()),timeHomepage('layout.products.await',()=>getBookableProducts().catch(()=>[]))]);
  return (
    <div className="public-site">
      <BookingProvider products={products} product={products.find(p=>p.slug===process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG)} content={content} currentMeetingPoint={currentMeetingPoint}>
        <a className="p-skip" href="#main-content">
          Skip to content
        </a>
        <SeasonalAnnouncement content={content} initialActive={seasonalActive(content)}><Header content={content} /></SeasonalAnnouncement>
        {process.env.GA4_ENABLED === "true" && process.env.APP_ENV === "production" && process.env.VERCEL_ENV !== "preview" && process.env.NEXT_PUBLIC_SITE_URL === "https://sightseeingshkodra.app" && <PublicAnalytics />}
        {children}
        <Footer content={content} googleReviewsUrl={reviews.google_reviews_url} />
        <WhatsAppContact href={whatsappLink(content)} label={content['whatsapp.label']??''} desktop={content['whatsapp.desktop']==='true'} mobile={content['whatsapp.mobile']==='true'}/>
      </BookingProvider>
    </div>
  );
  });
}
