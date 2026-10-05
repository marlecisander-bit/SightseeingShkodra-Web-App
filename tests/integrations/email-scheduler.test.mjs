import assert from 'node:assert/strict';
import {test} from 'node:test';
import {invokeEmailWorker,config as schedule} from '../../netlify/functions/booking-email-schedule.mjs';
import {workerHealth,withEmailHeartbeat} from '../../src/modules/integrations/email-worker-heartbeat.ts';
import {GET} from '../../src/app/api/internal/booking-emails/route.ts';
const context={deploy:{context:'production',published:true},site:{url:'https://example.invalid'}};
const env={APP_ENV:'production',EMAIL_ENABLED:'true',CRON_SECRET:'test-only-secret-'.repeat(3),NEXT_PUBLIC_SITE_URL:'https://example.invalid'};
test('one-minute scheduler stays off in previews, unpublished deploys and disabled environments',async()=>{
  assert.equal(schedule.schedule,'* * * * *');const send=()=>{throw Error('must not call');};
  assert.equal((await invokeEmailWorker(context,{...env,EMAIL_ENABLED:'false'},send)).status,'disabled');
  assert.equal((await invokeEmailWorker({...context,deploy:{context:'deploy-preview',published:false}},env,send)).status,'not_production');
  assert.equal((await invokeEmailWorker(context,{...env,APP_ENV:'development'},send)).status,'not_production');
});
test('scheduler calls only the existing worker with server bearer auth, no redirects or sensitive output',async()=>{
  const result=await invokeEmailWorker(context,env,async(url,options)=>{
    assert.equal(String(url),'https://example.invalid/api/internal/booking-emails');
    assert.equal(options.headers.Authorization,`Bearer ${env.CRON_SECRET}`);assert.equal(options.redirect,'error');assert(options.signal);
    return Response.json({status:'test',processed:4});
  });assert.deepEqual(result,{status:'test',processed:4});assert(!JSON.stringify(result).includes(env.CRON_SECRET));
  await assert.rejects(invokeEmailWorker(context,{...env,NEXT_PUBLIC_SITE_URL:'https://other.invalid'},()=>{throw Error('must not send');}),/configuration/);
  await assert.rejects(invokeEmailWorker(context,env,async()=>new Response('private details',{status:503})),/worker_unconfirmed/);
  await assert.rejects(invokeEmailWorker(context,env,async()=>{throw Error(env.CRON_SECRET);}),e=>!e.message.includes(env.CRON_SECRET));
});
test('actual route rejects unauthorized requests and accepts authorized disabled calls without sending',async()=>{
  const previous={CRON_SECRET:process.env.CRON_SECRET,EMAIL_ENABLED:process.env.EMAIL_ENABLED};
  try {process.env.CRON_SECRET=env.CRON_SECRET;process.env.EMAIL_ENABLED='false';
    assert.equal((await GET(new Request('http://localhost/api/internal/booking-emails'))).status,401);
    const response=await GET(new Request('http://localhost/api/internal/booking-emails',{headers:{Authorization:`Bearer ${env.CRON_SECRET}`}}));
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'disabled',processed:0});
  }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('heartbeat is completed only after work resolves, including empty runs; failed runs stay failed',async()=>{
  const calls=[];const client={rpc:async(name,args)=>{calls.push({name,...args});return {data:'token',error:null};}};
  await withEmailHeartbeat(client,'operator',async()=>{assert.equal(calls.length,1);return {status:'test',processed:0};});
  assert.equal(calls[1].p_status,'test');assert.equal(calls[1].p_processed,0);
  await assert.rejects(withEmailHeartbeat(client,'operator',async()=>{throw Error('sensitive');}),/email_worker_failed/);
  assert.equal(calls.at(-1).p_status,'failed');
});
test('admin health never treats old, missing, failed or running evidence as operational',()=>{
  const now=Date.parse('2026-09-25T14:00:00Z'),row={started_at:'2026-09-25T13:59:00Z',finished_at:'2026-09-25T13:59:30Z',status:'live',last_success_at:null,processed:0};
  assert.equal(workerHealth(row,true,now),'Operational');assert.equal(workerHealth({...row,status:'test'},true,now),'Operational (test mode)');
  assert.equal(workerHealth(null,true,now),'Unverified');assert.equal(workerHealth(row,false,now),'Disabled');
  assert.equal(workerHealth({...row,status:'failed'},true,now),'Last run failed');
  assert.equal(workerHealth(row,true,now+300000),'No recent successful run');
  assert.equal(workerHealth({...row,status:'running'},true,now+300000),'Run overdue');
});
