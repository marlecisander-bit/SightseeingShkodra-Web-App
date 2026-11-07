import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {registerHooks} from 'node:module';
import {NextRequest} from 'next/server';
import {canonicalAdminRedirect,canonicalAdminOrigin} from '../../src/modules/identity/admin-origin.ts';
import {safeAdminReturn,bookingTarget} from '../../src/modules/notifications/contracts.ts';
const prod={VERCEL_ENV:'production',APP_ENV:'production'};
registerHooks({load(url,context,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.split(',')[1]),shortCircuit:true};return next(url,context);},resolve(spec,context,next){if(spec==='@supabase/ssr')return {url:'data:text/javascript,'+encodeURIComponent('export const createServerClient=(...args)=>globalThis.transitionAuth(...args);'),shortCircuit:true};return next(spec,context);}});
const {proxy}=await import('../../src/proxy.ts');
test('canonical redirect terminates before auth; refresh writes all cookies with no-store and leaves canonical URLs unchanged',async()=>{
 const keys=['VERCEL_ENV','APP_ENV','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 Object.assign(process.env,prod,{NEXT_PUBLIC_SUPABASE_URL:'https://synthetic.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic'});
 let calls=0;globalThis.transitionAuth=(_url,_key,{cookies})=>({auth:{getClaims:async()=>{calls++;cookies.setAll([{name:'session-part-1',value:'synthetic-a',options:{path:'/',httpOnly:true,secure:true}}]);cookies.setAll([{name:'session-part-2',value:'synthetic-b',options:{path:'/',httpOnly:true,secure:true}}]);return {data:{claims:{}}};}}});
 try{
  const path='/auth/sign-in?next='+encodeURIComponent('/admin');
  const redirected=await proxy(new NextRequest('https://sightseeingshkodra.app'+path));assert.equal(redirected.status,307);assert.equal(redirected.headers.get('location'),canonicalAdminOrigin+path);assert.equal(calls,0);
  const refreshed=await proxy(new NextRequest(canonicalAdminOrigin+path));assert.equal(calls,1);assert.equal(refreshed.headers.get('location'),null);assert.equal(refreshed.cookies.getAll().length,2);assert.equal(refreshed.headers.get('cache-control'),'private, no-store');
  globalThis.transitionAuth=()=>({auth:{getClaims:async()=>{throw Error('synthetic outage');}}});assert.equal((await proxy(new NextRequest(canonicalAdminOrigin+'/admin'))).status,503);
 }finally{delete globalThis.transitionAuth;for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});
test('old .app and new .com worker clicks retain exact booking through the candidate redirect and sign-in return allowlist',async()=>{
 const source=await readFile(new URL('../../public/admin/sw.js',import.meta.url),'utf8'),target=bookingTarget('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
 for(const origin of ['https://sightseeingshkodra.app',canonicalAdminOrigin]){
  const handlers={},opened=[];runInNewContext(source,{URL,self:{location:{origin},addEventListener:(name,fn)=>handlers[name]=fn,clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)}}});
  let work;handlers.notificationclick({notification:{close(){},data:{url:target}},waitUntil:p=>work=p});await work;
  const clicked=opened[0];assert.equal(clicked,origin+target);const destination=canonicalAdminRedirect(clicked,'GET',prod)??clicked;assert.equal(destination,canonicalAdminOrigin+target);assert.equal(canonicalAdminRedirect(destination,'GET',prod),null);
  const returned=safeAdminReturn(new URL(destination).pathname+new URL(destination).search);assert.equal(returned,target);assert.equal(new URL('/auth/sign-in?next='+encodeURIComponent(returned),canonicalAdminOrigin).origin,canonicalAdminOrigin);
 }
});
