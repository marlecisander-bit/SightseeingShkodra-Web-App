import {requirePermission} from '@/modules/identity/require-permission';
import {hasPermission} from '@/modules/identity/roles';
import {getDestinationEditor} from '@/modules/content/destinations-server';
import {getDestinationStops} from '@/modules/content/destination-stops-server';
import {DestinationsWorkspace} from './destinations-workspace';

export async function RouteStopsPanel({operatorId,view}:{operatorId:string;view?:string}) {
 const context=await requirePermission(operatorId,'content.manage');
 let data;
 try {
  data=await Promise.all([getDestinationEditor(operatorId),getDestinationStops(operatorId)]);
 } catch {
  return <p role="alert">Stop presentation could not be loaded. Refresh the page or contact your administrator.</p>;
 }
 const [records,source]=data;
 return <DestinationsWorkspace initialView={view==='destinations'?'destinations':'stops'} operatorId={operatorId} records={records} stops={source.stops} stopsAvailable={source.available} canPublish={hasPermission(context.role,'content.publish')}/>;
}
