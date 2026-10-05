import { AuthorizationError } from '@/modules/identity/authorization';
import { changeNotification, readInbox, readNotificationSettings } from '@/modules/notifications/server';
export const dynamic='force-dynamic';
function failure(error:unknown){return Response.json({error:error instanceof AuthorizationError?'Access denied':'Notifications temporarily unavailable'},{status:error instanceof AuthorizationError?403:400,headers:{'Cache-Control':'no-store'}});}
export async function GET(request:Request){try{const u=new URL(request.url),op=u.searchParams.get('operator')??'';return Response.json(u.searchParams.get('settings')==='1'?await readNotificationSettings(op):await readInbox(op,u.searchParams.get('filter')??'all',u.searchParams.get('cursor')??undefined),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{const raw=await request.text();if(raw.length>6000)throw Error('Request too large');const {operator,action}=JSON.parse(raw);return Response.json(await changeNotification(operator,action),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}
}
