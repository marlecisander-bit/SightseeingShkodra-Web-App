import {notFound} from 'next/navigation';
import {EmailPanelView} from '@/app/admin/email-panel';
import styles from '@/app/admin/admin.module.css';
/** Isolated layout fixture. No database reads and no real message recipients. */
export default function EmailReliabilityPreview(){
 if(process.env.NODE_ENV!=='development')notFound();
 const statuses=['delivered','suppressed','delivery_delayed','bounced','complained','failed','sent',null];
 const data:Parameters<typeof EmailPanelView>[0]['data']={
  config:{bound:true,enabled:true,ready:true,siteConfigured:true,apiKeyConfigured:true,cronConfigured:true,senderName:'Sightseeing Shkodra',senderEmail:'tickets@example.invalid',senderDomain:'example.invalid',replyTo:'help@example.invalid',ownerEmail:'owner@example.invalid',testRecipient:'',startConfigured:true,webhookConfigured:true,statusKeyConfigured:true},
  heartbeat:{started_at:new Date().toISOString(),finished_at:new Date().toISOString(),last_success_at:new Date().toISOString(),status:'live',processed:0},heartbeatAvailable:true,
  health:{providerFailures:4,delayed:1,missingOutcome:2,oldestPending:null,lastProviderEvent:new Date().toISOString()},
  events:[{type:'BOOKING_CREATED',event:'booking.confirmed',label:'New booking',pending:0,sent:8,failed:0},{type:'BOOKING_MODIFIED',event:'booking.modified',label:'Modified booking',pending:0,sent:0,failed:0},{type:'BOOKING_CANCELLED',event:'order.cancelled',label:'Cancelled booking',pending:0,sent:0,failed:0}],
  rows:statuses.map((state,i)=>({id:`synthetic-delivery-${i}`,booking_id:'synthetic-booking',booking_reference:'SS-00000000-0000-4000-8000-000000000001',event_type:'BOOKING_CREATED',recipient_type:i%2?'owner':'customer',status:'accepted',attempt_count:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),recipient_email:i%2?'owner@example.invalid':'guest@example.invalid',provider:'resend',provider_reference:`synthetic-provider-${i}`,sent_at:new Date().toISOString(),last_error_code:null,provider_status:state,provider_updated_at:state?new Date().toISOString():null,provider_reason:state==='suppressed'?'suppressed_by_provider':null,provider_check_count:0,provider_checked_at:null,delivery_state:state&&state!=='sent'?state:'accepted'})),
  providerEvents:[{delivery_id:'synthetic-delivery-0',kind:'delivered',event_at:new Date().toISOString(),created_at:new Date().toISOString(),reason:null,source:'webhook'}],pending:0,lastAccepted:new Date().toISOString(),lastFailed:null,resendable:[],
 };
 return <main className={styles.shell} style={{padding:24,maxWidth:1500,margin:'auto'}}><h1>Email &amp; Notifications</h1><p>Development fixture: synthetic delivery evidence only. No database connection or real sends. Do not submit diagnostic actions.</p><EmailPanelView operatorId="synthetic-fixture" data={data}/></main>;
}
