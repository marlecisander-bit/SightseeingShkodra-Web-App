import { bookingTarget, validPushSubscription } from './contracts';
export type PushJob={id:string;operator_id:string;notification_id:string;subscription_id:string;lease_token:string};
export type PushData={subscription:{endpoint:string;p256dh:string;auth:string};notification:{id:string;title:string;message:string;booking_id:string}};
export interface PushStore {claim():Promise<PushJob|null>;read(job:PushJob):Promise<PushData|null>;finish(job:PushJob,result:string,code:string):Promise<void>}
export type PushSender=(subscription:{endpoint:string;keys:{p256dh:string;auth:string}},payload:string)=>Promise<unknown>;
/** Ambiguous acceptance is terminal: never blindly resend a possibly delivered push. */
export function pushFailure(error:unknown){const code=(error as {statusCode?:number})?.statusCode;return code===404||code===410?{result:'expired',code:'subscription_expired'}:code===429||code!==undefined&&code>=500?{result:'retry',code:'provider_temporary'}:code?{result:'failed',code:'provider_rejected'}:{result:'uncertain',code:'acceptance_unknown'};}
export async function processPush(store:PushStore,send:PushSender,limit=8){
 let processed=0;const started=Date.now();
 for(let i=0;i<Math.min(limit,8)&&Date.now()-started<6000;i++){
  const job=await store.claim();if(!job)break;
  let data:PushData|null;try{data=await store.read(job);}catch{await store.finish(job,'retry','read_unavailable');continue;}
  if(!data){await store.finish(job,'skipped','access_revoked');continue;}
  const subscription={endpoint:data.subscription.endpoint,keys:{p256dh:data.subscription.p256dh,auth:data.subscription.auth}};
  if(!validPushSubscription(subscription)){await store.finish(job,'expired','unsupported_endpoint');continue;}
  const payload=JSON.stringify({title:'Sightseeing Shkodra',body:`${data.notification.title}\n${data.notification.message}`.slice(0,500),tag:data.notification.id,url:bookingTarget(job.operator_id,data.notification.booking_id)});
  let result='accepted',code='accepted';
  try{await send(subscription,payload);}catch(error){({result,code}=pushFailure(error));}
  await store.finish(job,result,code);processed++;
 }
 return processed;
}
