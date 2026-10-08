import {WhatsAppContact} from '@/components/public/whatsapp-contact';
import {whatsappLink} from '@/modules/content/whatsapp';
import { FaqPage } from '@/components/public/faq-page';
import {LegalPage} from '@/components/public/legal-page';
import { RouteJourney } from '@/components/public/route-journey';
import { getDayPlanner } from '@/modules/content/day-planner-server';
import { getDestinationEditor } from "@/modules/content/destinations-server";
import { destinationPlace } from "@/modules/content/destinations";
import { TourView, ExploreView } from "@/components/public/editorial-pages";
import { PageIntro } from "@/components/public/page-intro";
import { getEditorReviews } from "@/modules/content/reviews-server";
import { getWebsiteEditor } from "@/modules/content/website-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { HomepageView } from "@/components/public/homepage-view";
import { BookingProvider, BookButton, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "../../../(public)/public.css";
import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/identity/require-permission";
export const metadata = { title: "Private homepage draft preview", robots: { index: false, follow: false } };
export default async function WebsitePreview({ params,searchParams }: { params: Promise<{ operatorId: string }>; searchParams:Promise<{page?:string}> }) {
  const { operatorId } = await params;
  try { await requirePermission(operatorId, "content.manage"); }
  catch { redirect("/auth/sign-in"); }
  const record = await getWebsiteEditor(operatorId);
  const home = await getHomepage();
  const content = record.body.content;
  const {page}=await searchParams;
  const places=(await getDestinationEditor(operatorId)).filter(r=>r.status!=="archived").map(r=>destinationPlace(r,true));
  const reviews=await getEditorReviews(operatorId);
  return <><p>Private saved draft preview · Nothing is published by viewing this page.</p>{["book","route","faq","explore"].includes(page??"")&&<details><summary>Saved search and social preview</summary><p>{content[(page==="route"?"routePage":page+"Page")+".seoTitle"]}</p><p>{content[(page==="route"?"routePage":page+"Page")+".seoDescription"]}</p><p>Social image: {content[(page==="route"?"routePage":page+"Page")+".seoImage"]}</p></details>}<div className="public-site"><BookingProvider content={content} preview><Header content={content} />{page==="privacy-policy"||page==="terms-and-conditions"?<LegalPage content={content} kind={page==="privacy-policy"?"privacy":"terms"} preview/>:page==="route"||page==="live"?<RouteJourney content={content} product={home.product} fare={home.heroFare} initial={await getDayPlanner()} places={places.filter(p=>p.showOnPage)}/>:page==="faq"?<FaqPage content={content} inclusions={home.product?.inclusions??null}/>:page==="tour"?<TourView places={places.filter(p=>p.showOnPage)} tour={home} c={content}/>:page==="explore"?<ExploreView places={places.filter(p=>p.showOnPage)} home={home} c={content}/>:page==="book"||page==="your-day"?<main className="p-container p-section"><PageIntro content={content} prefix={page==="book"?"bookPage":"dayPage"}/><p>Presentation preview. Booking and ticket mechanics are unchanged.</p>{page==="book"&&<BookButton>Preview booking dialog</BookButton>}</main>:<HomepageView planner={await getDayPlanner()} places={places.filter(p=>p.showOnHomepage)} home={home} content={content} reviews={reviews}/>}<Footer googleReviewsUrl={reviews.settings.google_reviews_url} content={content} previewPathname={page && ["faq", "privacy-policy", "terms-and-conditions", "route", "live", "tour", "explore", "book", "your-day"].includes(page) ? `/${page}` : "/"} /><WhatsAppContact href={whatsappLink(content)} label={content['whatsapp.label']??''} desktop={content['whatsapp.desktop']==='true'} mobile={content['whatsapp.mobile']==='true'}/></BookingProvider></div></>;
}
