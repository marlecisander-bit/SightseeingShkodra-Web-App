import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {withOperatorService} from '../identity/operator-service';
import {visiblePartners, type Partner} from './partners';
export const partnerFields='id,name,logo_url,website_url,description,display_order,is_active,updated_at';
export async function loadPublicPartners(enabled:boolean, env:NodeJS.ProcessEnv=process.env, transport:typeof fetch=fetch):Promise<Partner[]> {
 if(!enabled||!env.PUBLIC_OPERATOR_ID||!env.NEXT_PUBLIC_SUPABASE_URL||!env.SUPABASE_SECRET_KEY)return [];
 try {
 const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false},global:{fetch:(input,init)=>transport(input,{...init,cache:'no-store',signal:AbortSignal.timeout(4000)})}});
 const result=await client.from('partners').select(partnerFields).eq('operator_id',env.PUBLIC_OPERATOR_ID).eq('is_active',true).neq('logo_url','').order('display_order').order('id');
 if(result.error){console.error(JSON.stringify({component:'partners',reason:'query_failed'}));return [];}
 return visiblePartners(result.data??[]);
 }catch{console.error(JSON.stringify({component:'partners',reason:'unavailable'}));return [];}
}
export async function getEditorPartners(operatorId:string) {
 return withOperatorService(operatorId,'content.manage',async(client,context)=>{
 const result=await client.from('partners').select(partnerFields).eq('operator_id',context.operatorId).order('display_order').order('id');
 if(result.error)throw Error('Partner management is unavailable. Apply the prepared migration before using this section.');
 return {partners:result.data as Partner[],role:context.role};
 });
}
