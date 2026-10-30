import {getEditorPartners} from '@/modules/content/partners-server';
import {WhatsAppContact} from '@/components/public/whatsapp-contact';
import {whatsappLink} from '@/modules/content/whatsapp';
import { FaqPage } from '@/components/public/faq-page';
import {LegalPage} from '@/components/public/legal-page';
import { RouteJourney } from '@/components/public/route-journey';
import {getDestinationStops} from '@/modules/content/destination-stops-server';
import {plannerClock} from '@/modules/content/day-planner';
import { getDestinationEditor } from "@/modules/content/destinations-server";
import { destinationPlace } from "@/modules/content/destinations";
import { ExploreView } from "@/components/public/editorial-pages";
import { PageIntro } from "@/components/public/page-intro";
import { getEditorReviews } from "@/modules/content/reviews-server";
import { getWebsiteEditor } from "@/modules/content/website-server";
import {getSavedPreviewHomepage} from "@/modules/content/saved-preview-server";
import {SavedPreviewBoundary} from "../../saved-preview-boundary";
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
  const home = await getSavedPreviewHomepage(operatorId);
  const route=await getDestinationStops(operatorId);
  const planner={date:home.date??plannerClock().date,title:home.product?.title??'View tickets',times:null,fares:[],stops:route.available?route.stops:null};
  const content = record.body.content;
  const {page}=await searchParams;
  if(page==="tour") redirect(`/admin/${operatorId}/website-preview?page=route`);
  const places=(await getDestinationEditor(operatorId)).filter(r=>r.status!=="archived").map(r=>destinationPlace(r,true));
  const reviews=await getEditorReviews(operatorId);
  return <><a href={`/admin/${operatorId}/content`}>Back to Website</a><SavedPreviewBoundary><p>Private saved draft preview · Booking availability, live maps and operational refresh are disabled. Nothing is published by viewing this page.</p>{["book","route","faq","explore"].includes(page??"")&&<details><summary>Saved search and social preview</summary><p>{content[(page==="route"?"routePage":page+"Page")+".seoTitle"]}</p><p>{content[(page==="route"?"routePage":page+"Page")+".seoDescription"]}</p><p>Social image: {content[(page==="route"?"routePage":page+"Page")+".seoImage"]}</p></details>}<div className="public-site"><BookingProvider content={content} preview><Header content={content} />{page==="privacy-policy"||page==="terms-and-conditions"?<LegalPage content={content} kind={page==="privacy-policy"?"privacy":"terms"} preview/>:page==="route"||page==="live"?<RouteJourney preview content={content} initial={planner} places={places.filter(p=>p.showOnPage)}/>:page==="faq"?<FaqPage content={content} inclusions={home.product?.inclusions??null}/>:page==="explore"?<ExploreView places={places.filter(p=>p.showOnPage)} home={home} c={content}/>:page==="book"||page==="your-day"?<main className="p-container p-section"><PageIntro content={content} prefix={page==="book"?"bookPage":"dayPage"}/><p>Presentation preview. Booking and ticket mechanics are unchanged.</p>{page==="book"&&<BookButton>Preview booking dialog</BookButton>}</main>:<HomepageView preview partners={content["partners.showOnHomepage"]!=="false"?(await getEditorPartners(operatorId)).partners:[]} planner={planner} places={places.filter(p=>p.showOnHomepage)} home={home} content={content} reviews={reviews}/>}<Footer googleReviewsUrl={reviews.settings.google_reviews_url} content={content} /><WhatsAppContact href={whatsappLink(content)} label={content['whatsapp.label']??''} desktop={content['whatsapp.desktop']==='true'} mobile={content['whatsapp.mobile']==='true'}/></BookingProvider></div></SavedPreviewBoundary></>;
}
