import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readPendingOrder,createPendingOrder} from '../../src/modules/booking/orders-server.ts';
const op='10000000-0000-4000-8000-000000000001',hold='10000000-0000-4000-8000-000000000002',order='10000000-0000-4000-8000-000000000003',departure='10000000-0000-4000-8000-000000000004',token='a'.repeat(64);
test('session-protected recovery and confirmation return the same permanent credential',async()=>{
 const original=globalThis.fetch,url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://qr-test.invalid';process.env.SUPABASE_SECRET_KEY='test-only-secret';
 let reads=0;
 globalThis.fetch=async(input)=>{
  const u=new URL(String(input));let data;
  if(u.pathname.endsWith('/rpc/create_meeting_point_booking_v1'))data={orderId:order,status:'confirmed',bookingStatus:'confirmed',items:[]};
  else if(u.pathname.endsWith('/inventory_holds')){assert.equal(u.searchParams.get('operator_id'),'eq.'+op);assert.equal(u.searchParams.get('id'),'eq.'+hold);if(u.searchParams.get('session_key')!=='eq.valid-session')return Response.json([]);data=[{id:hold,order_id:order,expires_at:'2031-09-25T00:00:00Z'}];}
  else if(u.pathname.endsWith('/orders'))data={id:order,status:'confirmed',currency:'EUR',total:3000,collection_mode:'meeting_point'};
  else if(u.pathname.endsWith('/booking_items'))data=[{id:'item',product_id:'product',departure_id:departure,quantity:3,unit_price:1000,total_price:3000,status:'confirmed'}];
  else if(u.pathname.endsWith('/bookings')){reads++;data=[{booking_reference:'SS-test',status:'confirmed',qr_token:token,qr_created_at:'2026-09-24T00:00:00Z',checked_in_at:null}];}
  else if(u.pathname.endsWith('/payments'))data=[];
  else if(u.pathname.endsWith('/departures'))data=[{id:departure,service_date:'2031-09-25',start_time:'15:00:00'}];
  else throw Error('Unexpected request');
  return Response.json(data);
 };
 try{
  const first=await readPendingOrder(op,hold,'valid-session'),reopened=await readPendingOrder(op,hold,'valid-session');
  assert.deepEqual(first.pass,reopened.pass);assert.equal(first.pass.token,token);assert.equal(first.total,3000);assert.equal(first.pass.departures[0].guests,3);
  const created=await createPendingOrder({operatorId:op,holdId:hold,sessionKey:'valid-session',customer:{name:'Test',email:'test@example.invalid'}},true);
  assert.equal(created.pass.token,token);
  const before=reads;await assert.rejects(readPendingOrder(op,hold,'wrong-session'),e=>e.code==='NOT_FOUND');assert.equal(reads,before);
 }finally{globalThis.fetch=original;if(url===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=url;if(key===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=key;}
});
