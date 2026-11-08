import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks,createRequire} from 'node:module';
registerHooks({load(url,c,next){
 if(url.endsWith('/server-only/index.js'))return {format:'module',source:'export {};',shortCircuit:true};
 if(url.includes('next/headers'))return {format:'module',source:'export async function cookies(){return {get:()=>({value:"test"})}}',shortCircuit:true};
 if(url.endsWith('/checkout-session.ts'))return {format:'module',source:'export const checkoutCookie="test";export const issueCheckoutSession=()=>"test";export const verifyCheckoutSession=()=>"synthetic-session";',shortCircuit:true};
 if(url.endsWith('/orders-server.ts'))return {format:'module',source:'export class CheckoutError extends Error{};export const readPendingOrder=()=>null;export async function createPendingOrder(input){globalThis.phoneOrderCalls.push(input);return {version:1};}',shortCircuit:true};
 return next(url,c);
}});
const require=createRequire(import.meta.url);
for(const [name,exports] of [
 ['next/headers',{cookies:async()=>({get:()=>({value:'test'})})}],
 ['../../src/modules/booking/checkout-session.ts',{checkoutCookie:'test',issueCheckoutSession:()=>'test',verifyCheckoutSession:()=>'synthetic-session'}],
 ['../../src/modules/booking/orders-server.ts',{CheckoutError:class extends Error{},readPendingOrder:()=>null,createPendingOrder:async input=>{globalThis.phoneOrderCalls.push(input);return {version:1};}}]
]){const key=require.resolve(name);require(key);require.cache[key].exports=exports;}
const {POST}=await import('../../src/app/api/public/checkout/route.ts');
test('public order API rejects absent/local phones and passes normalized international contact to the existing booking engine',async()=>{
 const previous=[process.env.CHECKOUT_SESSION_SECRET,process.env.PUBLIC_OPERATOR_ID];
 process.env.CHECKOUT_SESSION_SECRET='x'.repeat(32);process.env.PUBLIC_OPERATOR_ID='10000000-0000-4000-8000-000000000001';globalThis.phoneOrderCalls=[];
 const request=phone=>new Request('http://localhost/api/public/checkout',{method:'POST',headers:{host:'localhost',origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({action:'order',holdId:'10000000-0000-4000-8000-000000000002',customer:{name:'Synthetic Guest',email:'guest@example.test',phone}})});
 try{
  for(const phone of [undefined,'','0691234567','+355']){const response=await POST(request(phone));assert.equal(response.status,400);assert.equal((await response.json()).error,'INVALID_PHONE');}
  assert.equal(globalThis.phoneOrderCalls.length,0);
  assert.equal((await POST(request('+355 69 123 4567'))).status,200);
  assert.equal(globalThis.phoneOrderCalls[0].customer.phone,'+355691234567');
 }finally{['CHECKOUT_SESSION_SECRET','PUBLIC_OPERATOR_ID'].forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});delete globalThis.phoneOrderCalls;}
});
