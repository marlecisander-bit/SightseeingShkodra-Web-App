import { notFound } from "next/navigation";
import { getDestinationEditor } from "@/modules/content/destinations-server";
import { destinationPlace } from "@/modules/content/destinations";
import { GuideView } from "@/components/public/editorial-pages";
import "../../../(public)/public.css";
export const metadata = { title: "Private destination preview", robots: { index: false, follow: false } };
export default async function DestinationPreview({params,searchParams}:{params:Promise<{operatorId:string}>;searchParams:Promise<{id?:string}>}) {
  const {operatorId}=await params,{id}=await searchParams;
  const row=(await getDestinationEditor(operatorId)).find(r=>r.id===id);
  if(!row)notFound();
  const place=destinationPlace(row,true);
  return <div className="public-site"><main className="p-container p-subpage"><p>Private saved draft preview. Viewing does not publish this destination.</p><GuideView place={place} content={{title:place.name,text:place.story||place.detail||place.text,metaTitle:place.seoTitle,metaDescription:place.seoDescription}}/></main></div>;
}
