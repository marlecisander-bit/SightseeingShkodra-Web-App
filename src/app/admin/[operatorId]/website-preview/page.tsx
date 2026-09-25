import { getDestinationEditor } from "@/modules/content/destinations-server";
import { destinationPlace } from "@/modules/content/destinations";
import { TourView, ExploreView } from "@/components/public/editorial-pages";
import { PageIntro } from "@/components/public/page-intro";
import { getEditorReviews } from "@/modules/content/reviews-server";
import { getWebsiteEditor } from "@/modules/content/website-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { HomepageView } from "@/components/public/homepage-view";
import { BookingProvider, Header } from "@/components/public/booking";
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
  return <><p>Private saved draft preview · Nothing is published by viewing this page.</p><div className="public-site"><BookingProvider><Header content={content} />{page==="tour"?<TourView places={places.filter(p=>p.showOnPage)} tour={home} c={content} reviews={reviews}/>:page==="explore"?<ExploreView places={places.filter(p=>p.showOnPage)} home={home} c={content}/>:page==="book"||page==="your-day"?<main className="p-container p-section"><PageIntro content={content} prefix={page==="book"?"bookPage":"dayPage"}/><p>Presentation preview. Booking and ticket mechanics are unchanged.</p></main>:<HomepageView places={places.filter(p=>p.showOnHomepage)} home={home} content={content} reviews={reviews}/>}<Footer content={content} /></BookingProvider></div></>;
}
