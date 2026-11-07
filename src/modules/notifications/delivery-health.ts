/** Processing health is independent of registration and provider/device acceptance. */
export type DeliveryHealth={state:'Active'|'Paused'|'Needs attention';reason:string;lastSuccess?:string};
export type WorkerHealth={status:string;started_at:string;last_success_at:string|null};
export function automaticBookingHealth(input:{pushEnabled:boolean;workerEnabled:boolean;paused:boolean;startValid:boolean;worker?:WorkerHealth|null;queueIssue?:boolean;unavailable?:boolean},now=Date.now()):DeliveryHealth{
 if(input.paused||!input.workerEnabled)return {state:'Paused',reason:'Automatic processing is switched off. Device registration is separate.'};
 if(!input.pushEnabled||!input.startValid)return {state:'Needs attention',reason:'The owner must check push configuration and the activation timestamp.'};
 const w=input.worker,t=w?.last_success_at?Date.parse(w.last_success_at):NaN;
 if(input.unavailable||!w||!Number.isFinite(t)||t>now||now-t>180000||w.status==='failed'||(w.status==='running'&&now-Date.parse(w.started_at)>120000))return {state:'Needs attention',reason:'Recent successful automatic processing has not been verified. Ask the owner to check the existing scheduler.',lastSuccess:w?.last_success_at??undefined};
 if(input.queueIssue)return {state:'Needs attention',reason:'A delayed, failed or uncertain push delivery needs review.',lastSuccess:w.last_success_at!};
 return {state:'Active',reason:'The worker completed successfully within the last three minutes. This does not confirm notification display or sound.',lastSuccess:w.last_success_at!};
}
