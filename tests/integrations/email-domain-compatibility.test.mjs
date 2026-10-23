import assert from 'node:assert/strict';
import {test} from 'node:test';
import {POST as checkout} from '../../src/app/api/public/checkout/route.ts';
import {POST as webhook} from '../../src/app/api/webhooks/resend/route.ts';
test('both public checkout hosts pass same-origin guard and reject cross-host requests without storage',async()=>{
 for(const host of ['sightseeingshkodra.app','www.sightseeingshkodra.com']){
  // A malformed content type stops immediately after the origin guard: no cookies,
  // database, inventory holds, bookings or outbound provider operations are invoked.
  const request=origin=>new Request(`https://${host}/api/public/checkout`,{method:'POST',headers:{host,origin},body:'synthetic'});
  assert.equal((await checkout(request(`https://${host}`))).status,400);
  assert.equal((await checkout(request('https://untrusted.invalid'))).status,403);
 }
});
test('webhook authentication behaves equally on both domains; previews fail closed',async()=>{
 const keys=['VERCEL_ENV','APP_ENV','RESEND_WEBHOOK_SECRET'];const previous=keys.map(k=>process.env[k]);
 try{
  Object.assign(process.env,{VERCEL_ENV:'production',APP_ENV:'production',RESEND_WEBHOOK_SECRET:'whsec_'+Buffer.alloc(32,3).toString('base64')});
  for(const host of ['sightseeingshkodra.app','www.sightseeingshkodra.com'])assert.equal((await webhook(new Request(`https://${host}/api/webhooks/resend`,{method:'POST',body:'{}'}))).status,401);
  process.env.VERCEL_ENV='preview';assert.equal((await webhook(new Request('https://preview.invalid/api/webhooks/resend',{method:'POST',body:'{}'}))).status,503);
 }finally{keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];});}
});
