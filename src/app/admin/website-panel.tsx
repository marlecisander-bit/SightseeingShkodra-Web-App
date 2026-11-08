import { requirePermission } from "@/modules/identity/require-permission";
import { hasPermission } from "@/modules/identity/roles";
import { getDestinationEditor } from "@/modules/content/destinations-server";
import Link from "next/link";
import { getWebsiteEditor } from "@/modules/content/website-server";
import { WebsiteWorkspace } from "./website-workspace";
import {getEditorReviewSettings} from "@/modules/content/reviews-server";
import {FooterGoogleEditor} from "./footer-google-editor";
export async function WebsitePanel({ operatorId }: { operatorId: string }) {
  let data;
  try { data = await Promise.all([getWebsiteEditor(operatorId),getDestinationEditor(operatorId),requirePermission(operatorId,"content.manage"),getEditorReviewSettings(operatorId)]); }
  catch (error) { console.error('Admin website content could not be loaded', error); return <p role="alert">Website content could not be loaded. Refresh the page or contact your administrator.</p>; }
  const [record,destinations,context,reviews]=data;
  const canPublish=hasPermission(context.role,"content.publish"), canSensitive=hasPermission(context.role,"content.sensitive");
  const links=destinations.filter(d=>d.status==="published"&&d.published_body).map(d=>({value:"/explore/"+d.published_body!.slug,label:d.published_body!.name}));
  return <WebsiteWorkspace canPublish={canPublish} canSensitive={canSensitive} destinationLinks={links} footerGoogleEditor={<FooterGoogleEditor operatorId={operatorId} url={reviews.google_reviews_url}/>} operatorId={operatorId} record={record} destinationManager={<p>Route stops and destination guides have one editor. <Link prefetch={false} href={`/admin/${operatorId}/route-stops?view=destinations`}>Open Stops &amp; destinations</Link></p>}/>;
}
