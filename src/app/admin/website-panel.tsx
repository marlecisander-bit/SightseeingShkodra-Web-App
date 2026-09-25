import { getDestinationEditor } from "@/modules/content/destinations-server";
import { getDestinationStops } from "@/modules/content/destination-stops-server";
import { DestinationsEditor } from "./destinations-editor";
import { getWebsiteEditor } from "@/modules/content/website-server";
import { WebsiteWorkspace } from "./website-workspace";
export async function WebsitePanel({ operatorId }: { operatorId: string }) {
  let record;
  try { record = await getWebsiteEditor(operatorId); }
  catch { return <p role="alert">Homepage content is unavailable. Check the database connection and homepage initialization.</p>; }
  const [destinations,source]=await Promise.all([getDestinationEditor(operatorId),getDestinationStops(operatorId)]);
  return <WebsiteWorkspace operatorId={operatorId} record={record} destinationManager={<DestinationsEditor operatorId={operatorId} records={destinations} stops={source.stops} stopsAvailable={source.available}/>}/>;
}
