export type EmailDelivery = {status:string;provider_status?:string|null;provider_reference?:string|null};
export function emailDeliveryState(row:EmailDelivery){
 return row.provider_status&&row.provider_status!=='sent'?row.provider_status:row.status;
}
export function emailOutcomeLabel(row:EmailDelivery){
 const state=emailDeliveryState(row);
 return ({pending:'Queued',leased:'Processing',sending:'Processing',retry:'Retry queued',accepted:'Accepted by Resend',delivered:'Delivered to receiving server',delivery_delayed:'Delivery delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint received',uncertain:'Uncertain — review required',skipped:'Skipped'} as Record<string,string>)[state]??'Unknown';
}
/** Unknown acceptance is never evidence that a duplicate send is safe. */
export function canRetryEmail(row:EmailDelivery){
 if(row.status==='uncertain'||['sent','delivered','delivery_delayed','suppressed','complained'].includes(row.provider_status??''))return false;
 return row.status==='failed'||['bounced','failed'].includes(row.provider_status??'');
}
