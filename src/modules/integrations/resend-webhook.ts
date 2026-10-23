import 'server-only';
import {Webhook} from 'svix';

export const providerKinds = ['sent','delivered','delivery_delayed','bounced','failed','suppressed','complained'] as const;
export type ProviderKind = typeof providerKinds[number];
export type ProviderEvent = {id:string;messageId:string;kind:ProviderKind;at:string;reason:string|null};
const identifier=/^[A-Za-z0-9_-]{1,200}$/;
/** Verify exact raw bytes before interpreting or persisting any payload data. */
export function verifyResendEvent(raw:string,headers:Headers,secret:string):ProviderEvent|null {
 const id=headers.get('svix-id')??'';
 if(!identifier.test(id))throw Error('invalid_webhook');
 new Webhook(secret).verify(raw,{
  'svix-id':id,'svix-timestamp':headers.get('svix-timestamp')??'',
  'svix-signature':headers.get('svix-signature')??'',
 });
 const body=JSON.parse(raw) as {type?:unknown;created_at?:unknown;data?:{email_id?:unknown;bounce?:{type?:unknown}}};
 if(typeof body?.type!=='string')throw Error('invalid_webhook');
 const kind=body.type.replace(/^email\./,'') as ProviderKind;
 if(!body.type.startsWith('email.')||!providerKinds.includes(kind))return null;
 if(typeof body.created_at!=='string'||!Number.isFinite(Date.parse(body.created_at))
  ||typeof body.data?.email_id!=='string'||!identifier.test(body.data.email_id))throw Error('invalid_webhook');
 const reason=kind==='bounced'?(body.data.bounce?.type==='Permanent'?'hard_bounce':body.data.bounce?.type==='Transient'?'soft_bounce':'bounce')
  :({failed:'provider_failed',suppressed:'suppressed_by_provider',complained:'recipient_complaint',delivery_delayed:'delivery_delayed'} as Partial<Record<ProviderKind,string>>)[kind]??null;
 return {id,messageId:body.data.email_id,kind,at:new Date(body.created_at).toISOString(),reason};
}

export async function receiveResendWebhook(request:Request,dependencies:{secret?:string;save:(event:ProviderEvent)=>Promise<void>;log?:(status:string)=>void}) {
 const log=dependencies.log??(status=>console.info(JSON.stringify({component:'email_webhook',status})));
 if(!dependencies.secret){log('configuration_missing');return Response.json({error:'Unavailable'},{status:503});}
 // Bound memory even for chunked bodies. Do not use req.json() before verification.
 const reader=request.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
 if(!reader)return Response.json({error:'Invalid webhook'},{status:400});
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();return Response.json({error:'Too large'},{status:413});}chunks.push(value);}
 }catch{return Response.json({error:'Invalid webhook'},{status:400});}
 let event:ProviderEvent|null;
 try{event=verifyResendEvent(Buffer.concat(chunks).toString('utf8'),request.headers,dependencies.secret);}
 catch{log('verification_failed');return Response.json({error:'Invalid webhook'},{status:401});}
 if(!event)return Response.json({received:true});
 try{await dependencies.save(event);return Response.json({received:true});}
 catch{log('persistence_failed');return Response.json({error:'Unavailable'},{status:503});}
}
