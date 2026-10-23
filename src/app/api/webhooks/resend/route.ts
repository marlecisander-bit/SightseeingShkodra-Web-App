import {createClient} from '@supabase/supabase-js';
import {receiveResendWebhook} from '@/modules/integrations/resend-webhook';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=15;
export async function POST(request:Request){
 if(process.env.VERCEL_ENV && (process.env.VERCEL_ENV!=='production'||process.env.APP_ENV!=='production'))return Response.json({error:'Unavailable'},{status:503});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,operator=process.env.PUBLIC_OPERATOR_ID;
 return receiveResendWebhook(request,{
  secret:process.env.RESEND_WEBHOOK_SECRET,
  async save(event){
   if(!url||!key||!operator||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(operator))throw Error('configuration_missing');
   const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(5000)})}});
   const {error}=await client.rpc('record_email_provider_event_v1',{p_operator_id:operator,p_event_id:event.id,p_message_id:event.messageId,p_kind:event.kind,p_event_at:event.at,p_reason:event.reason});
   if(error)throw Error('provider_event_unavailable');
  },
 });
}
