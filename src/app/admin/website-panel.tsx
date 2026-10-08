import { requirePermission } from "@/modules/identity/require-permission";
import { hasPermission } from "@/modules/identity/roles";
import { getDestinationEditor } from "@/modules/content/destinations-server";
import { getDestinationStops } from "@/modules/content/destination-stops-server";
import { DestinationsEditor } from "./destinations-editor";
import { getWebsiteEditor } from "@/modules/content/website-server";
import { WebsiteWorkspace } from "./website-workspace";
import {getEditorReviewSettings} from "@/modules/content/reviews-server";
import {FooterGoogleEditor} from "./footer-google-editor";
export async function WebsitePanel({ operatorId }: { operatorId: string }) {
  let record;
  try { record = await getWebsiteEditor(operatorId); }
  catch (error) { console.error('Admin website content could not be loaded', error); return <p role="alert">Website content could not be loaded. Refresh the page or contact your administrator.</p>; }
  const [destinations,source]=await Promise.all([getDestinationEditor(operatorId),getDestinationStops(operatorId)]);
  const context=await requirePermission(operatorId,"content.manage");
  const canPublish=hasPermission(context.role,"content.publish"), canSensitive=hasPermission(context.role,"content.sensitive");
  const links=destinations.filter(d=>d.status==="published"&&d.published_body).map(d=>({value:"/explore/"+d.published_body!.slug,label:d.published_body!.name}));
  const reviews=await getEditorReviewSettings(operatorId);
  return <WebsiteWorkspace canPublish={canPublish} canSensitive={canSensitive} destinationLinks={links} footerGoogleEditor={<FooterGoogleEditor operatorId={operatorId} url={reviews.google_reviews_url}/>} operatorId={operatorId} record={record} destinationManager={<DestinationsEditor canPublish={canPublish} operatorId={operatorId} records={destinations} stops={source.stops} stopsAvailable={source.available}/>}/>;
}
