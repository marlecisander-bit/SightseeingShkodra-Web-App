import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {EmailConfig} from './booking-email-config';
import {providerKinds,type ProviderKind} from './resend-webhook';
/** One read-only lookup per existing worker run; four attempts/message, six hours apart. */
export async function reconcileEmailOutcome(client:Pick<SupabaseClient,'rpc'>,config:EmailConfig,transport:typeof fetch=fetch,log:(status:string)=>void=status=>console.info(JSON.stringify({component:'email_reconciliation',status}))){
 if(!config.enabled)return;
 if(!config.statusApiKey){log('read_permission_required');return;}
 try{
  const claim=await client.rpc('claim_email_provider_check_v1',{p_operator_id:config.operatorId});
  if(claim.error)throw Error();const row=claim.data?.[0];if(!row)return;
  if(!/^[A-Za-z0-9_-]{1,200}$/.test(row.provider_reference))throw Error();
  const response=await transport(`https://api.resend.com/emails/${encodeURIComponent(row.provider_reference)}`,{method:'GET',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000),headers:{Authorization:`Bearer ${config.statusApiKey}`}});
  if(!response.ok){log(response.status===401||response.status===403?'read_permission_required':'lookup_failed');return;}
  const body=await response.json();
  const kind=body?.last_event as ProviderKind;
  if(body?.id!==row.provider_reference||!providerKinds.includes(kind)){log('outcome_unavailable');return;}
  const reason=({failed:'provider_failed',suppressed:'suppressed_by_provider',complained:'recipient_complaint',delivery_delayed:'delivery_delayed',bounced:'bounce'} as Partial<Record<ProviderKind,string>>)[kind]??null;
  const save=await client.rpc('record_email_provider_event_v1',{p_operator_id:config.operatorId,p_event_id:`lookup_${row.id}_${row.provider_check_count}`,p_message_id:row.provider_reference,p_kind:kind,p_event_at:new Date().toISOString(),p_reason:reason,p_source:'reconciliation'});
  if(save.error)throw Error();
 }catch{log('lookup_failed');}
}
