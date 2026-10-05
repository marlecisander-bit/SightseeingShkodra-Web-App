import { authorizedEmailWorker } from '@/modules/integrations/booking-email-server';
import { runAdminNotifications } from '@/modules/notifications/worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
export async function GET(request:Request){
 if(!authorizedEmailWorker(request.headers.get('authorization')))return Response.json({error:'Unauthorized'},{status:401});
 try{return Response.json(await runAdminNotifications(),{headers:{'Cache-Control':'no-store'}});}catch{console.error(JSON.stringify({component:'admin_notifications',status:'worker_failed'}));return Response.json({error:'Notification worker unavailable'},{status:503});}
}
