import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicAvailability} from '../../src/modules/booking/public-availability.ts';
import {resolveBookableProduct} from '../../src/modules/booking/products-server.ts';
const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000002';
test('availability passes only a bounded product selector; mismatch/unpublished offers never reach quote',async()=>{
 let calls=0;
 const sources={resolve:async(id)=>{calls++;assert.equal(id,product);return {operatorId:op,productId:product,timezone:'Europe/Tirane'};},quote:async q=>({version:1,productId:q.productId,date:q.date,guests:q.guests,departures:[]})};
 const url='http://localhost/api/public/availability?date=2030-06-01&guests=1&productId='+product;
 const response=await publicAvailability(new Request(url),sources);assert.equal(response.status,200);assert.equal((await response.json()).quote.productId,product);
 for(const suffix of ['&operatorId='+op,'&productId='+product])assert.equal((await publicAvailability(new Request(url+suffix),sources)).status,400);
 assert.equal((await publicAvailability(new Request(url.replace(product,'not-a-uuid')),sources)).status,400);assert.equal(calls,1);
 let quoted=false;const mismatch=await publicAvailability(new Request(url),{resolve:async()=>({operatorId:op,productId:op,timezone:'Europe/Tirane'}),quote:async()=>{quoted=true;}});assert.equal(mismatch.status,404);assert.equal(quoted,false);
});
test('public directory resolver fixes operator binding and rejects arbitrary unpublished product IDs',async()=>{
 const previous={fetch:globalThis.fetch,...Object.fromEntries(['PUBLIC_OPERATOR_ID','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY','PUBLIC_HOMEPAGE_PRODUCT_SLUG'].map(k=>[k,process.env[k]]))};
 Object.assign(process.env,{PUBLIC_OPERATOR_ID:op,NEXT_PUBLIC_SUPABASE_URL:'https://synthetic.supabase.co',SUPABASE_SECRET_KEY:'synthetic-test-server-key',PUBLIC_HOMEPAGE_PRODUCT_SLUG:'loop'});
 const requests=[];globalThis.fetch=async(url,init)=>{requests.push({url:String(url),body:JSON.parse(init.body)});return Response.json([{id:product,title:'Loop',slug:'loop',mode:'selected_departure',minutes:120}]);};
 try {
  assert.equal((await resolveBookableProduct(product)).id,product);assert.equal((await resolveBookableProduct()).id,product);assert.equal(await resolveBookableProduct(op),null);
  assert.equal(await resolveBookableProduct('bad'),null);
  assert(requests.every(r=>r.url.endsWith('/rpc/read_public_products_v1')&&r.body.p_operator===op));
 }finally{globalThis.fetch=previous.fetch;for(const [key,value]of Object.entries(previous)){if(key==='fetch')continue;if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
