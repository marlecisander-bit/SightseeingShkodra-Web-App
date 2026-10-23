import 'server-only';
import { withOperatorService } from '../identity/operator-service';
import { emailAdminStatus, deliveryGroups, emailEvents } from './email-admin-status';
import type { WorkerEvidence } from './email-worker-heartbeat';

export async function getEmailAdmin(operatorId: string, filter?: string, recipient?: string, run = withOperatorService, booking?:string) {
  return run(operatorId, 'integrations.manage', async client => {
    const config = emailAdminStatus(operatorId);
    const heartbeat = await client.from('email_worker_status').select('started_at,finished_at,last_success_at,status,processed').eq('operator_id',operatorId).maybeSingle();
    const base = () => client.from('notification_deliveries').select('id,booking_id,booking_reference,event_type,recipient_type,status,attempt_count,created_at,updated_at,recipient_email,provider,provider_reference,sent_at,last_error_code,provider_status,provider_updated_at,provider_reason,delivery_state,provider_checked_at,provider_check_count')
      .eq('operator_id', operatorId).in('recipient_type', ['customer','owner']);
    let history = base().order('created_at', {ascending:false}).limit(100);
    if (filter && ['delivered','delivery_delayed','bounced','suppressed','complained','accepted','processing','failed','uncertain'].includes(filter)) history=history.eq('delivery_state',filter);
    else if (filter && filter in deliveryGroups) history = history.in('status', deliveryGroups[filter as keyof typeof deliveryGroups]);
    if(booking && /^SS-[a-f0-9-]{36}$/i.test(booking))history=history.eq('booking_reference',booking);
    if (recipient === 'customer' || recipient === 'owner') history = history.eq('recipient_type', recipient);
    const count = async (states: string[], event?: string) => {
      let query = client.from('notification_deliveries').select('id',{count:'exact',head:true}).eq('operator_id',operatorId).in('recipient_type',['customer','owner']).in(states===deliveryGroups.failed?'delivery_state':'status',states===deliveryGroups.failed?['failed','uncertain','bounced','suppressed','complained']:states);
      if(event) query=query.eq('event_type',event);
      const result=await query; if(result.error) throw Error('Email activity unavailable'); return result.count ?? 0;
    };
    const [rows, accepted, failed, pending, events] = await Promise.all([
      history, base().eq('status','accepted').order('sent_at',{ascending:false}).limit(1),
      base().in('delivery_state',['failed','uncertain','bounced','suppressed','complained']).order('updated_at',{ascending:false}).limit(1),
      count(deliveryGroups.pending),
      Promise.all(emailEvents.map(async event=>({...event,pending:await count(deliveryGroups.pending,event.type),sent:await count(deliveryGroups.sent,event.type),failed:await count(deliveryGroups.failed,event.type)}))),
    ]);
    if(rows.error || accepted.error || failed.error) throw Error('Email activity unavailable');
    const ids=[...new Set((rows.data??[]).filter(r=>r.status==='failed'||r.status==='uncertain').map(r=>r.booking_id))];
    const health=await client.rpc('email_delivery_health_v1',{p_operator_id:operatorId});
    const providerEvents=await client.from('email_provider_events').select('delivery_id,kind,event_at,created_at,reason,source').eq('operator_id',operatorId).order('event_at',{ascending:false}).limit(500);
    const bookings=ids.length?await client.from('bookings').select('id').eq('operator_id',operatorId).eq('status','confirmed').in('id',ids):{data:[],error:null};
    if(bookings.error) throw Error('Email activity unavailable');
    return {health:health.error?null:health.data as {providerFailures:number;delayed:number;missingOutcome:number;oldestPending:string|null;lastProviderEvent:string|null}|null,providerEvents:providerEvents.error?[]:providerEvents.data??[],config,heartbeat:heartbeat.error?null:heartbeat.data as WorkerEvidence|null,heartbeatAvailable:!heartbeat.error,rows:rows.data??[],events,pending,lastAccepted:accepted.data?.[0]?.sent_at??accepted.data?.[0]?.updated_at??null,lastFailed:failed.data?.[0]?.updated_at??null,resendable:(bookings.data??[]).map(b=>b.id)};
  });
}
