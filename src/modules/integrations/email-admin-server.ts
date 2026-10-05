import 'server-only';
import { withOperatorService } from '../identity/operator-service';
import { emailAdminStatus, deliveryGroups, emailEvents } from './email-admin-status';
import type { WorkerEvidence } from './email-worker-heartbeat';

export async function getEmailAdmin(operatorId: string, filter?: string, recipient?: string, run = withOperatorService) {
  return run(operatorId, 'integrations.manage', async client => {
    const config = emailAdminStatus(operatorId);
    const heartbeat = await client.from('email_worker_status').select('started_at,finished_at,last_success_at,status,processed').eq('operator_id',operatorId).maybeSingle();
    const base = () => client.from('notification_deliveries').select('id,booking_id,booking_reference,event_type,recipient_type,status,attempt_count,created_at,updated_at,recipient_email,provider,provider_reference,sent_at,last_error_code')
      .eq('operator_id', operatorId).in('recipient_type', ['customer','owner']);
    let history = base().order('created_at', {ascending:false}).limit(100);
    if (filter && filter in deliveryGroups) history = history.in('status', deliveryGroups[filter as keyof typeof deliveryGroups]);
    if (recipient === 'customer' || recipient === 'owner') history = history.eq('recipient_type', recipient);
    const count = async (states: string[], event?: string) => {
      let query = client.from('notification_deliveries').select('id',{count:'exact',head:true}).eq('operator_id',operatorId).in('recipient_type',['customer','owner']).in('status',states);
      if(event) query=query.eq('event_type',event);
      const result=await query; if(result.error) throw Error('Email activity unavailable'); return result.count ?? 0;
    };
    const [rows, accepted, failed, pending, events] = await Promise.all([
      history, base().eq('status','accepted').order('updated_at',{ascending:false}).limit(1),
      base().in('status',['failed','uncertain']).order('updated_at',{ascending:false}).limit(1),
      count(deliveryGroups.pending),
      Promise.all(emailEvents.map(async event=>({...event,pending:await count(deliveryGroups.pending,event.type),sent:await count(deliveryGroups.sent,event.type),failed:await count(deliveryGroups.failed,event.type)}))),
    ]);
    if(rows.error || accepted.error || failed.error) throw Error('Email activity unavailable');
    const ids=[...new Set((rows.data??[]).filter(r=>r.status==='failed'||r.status==='uncertain').map(r=>r.booking_id))];
    const bookings=ids.length?await client.from('bookings').select('id').eq('operator_id',operatorId).eq('status','confirmed').in('id',ids):{data:[],error:null};
    if(bookings.error) throw Error('Email activity unavailable');
    return {config,heartbeat:heartbeat.error?null:heartbeat.data as WorkerEvidence|null,heartbeatAvailable:!heartbeat.error,rows:rows.data??[],events,pending,lastAccepted:accepted.data?.[0]?.updated_at??null,lastFailed:failed.data?.[0]?.updated_at??null,resendable:(bookings.data??[]).map(b=>b.id)};
  });
}
