'use client';
import {BookingPushDevice} from '@/app/admin/booking-push-device';
/** Disposable browser API seams are injected by the local test, never this component. */
export function AlertFixture(){
 const request=async(_query?:string,action?:unknown)=>{const a=action as {kind:string};return a.kind==='device-status'?{id:'10000000-0000-4000-8000-000000000080',enabled:true}:a.kind==='test-push'?{status:'accepted',code:'accepted'}:{ok:true};};
 return <main style={{maxWidth:680,margin:'32px auto',padding:16}}><p>Local synthetic preview — no real registration or sends.</p><BookingPushDevice settings={{publicKey:'BAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A',pushEnabled:true,configured:true,automaticDelivery:{state:'Needs attention',reason:'Recent successful automatic processing has not been verified. Ask the owner to check the existing scheduler.'}}} request={request} onChanged={async()=>{}}/></main>;
}
