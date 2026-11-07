import {writeFile} from 'node:fs/promises';
const op='10000000-0000-4000-8000-000000000001',booking='10000000-0000-4000-8000-000000000002';
const origins=['https://sightseeingshkodra.app','https://www.sightseeingshkodra.app','https://sightseeingshkodra.com','https://www.sightseeingshkodra.com'];
const paths=['/admin',`/admin/${op}/bookings?booking=${booking}`,'/auth/sign-in?next='+encodeURIComponent(`/admin/${op}/bookings?booking=${booking}`),'/auth/forgot-password','/auth/activate','/admin/sw.js','/admin/manifest.webmanifest'];
async function trace(input){let current=input;const chain=[],seen=new Set();for(let i=0;i<8;i++){if(seen.has(current))return {input,chain,loop:true};seen.add(current);const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(15000)});const location=r.headers.get('location');chain.push({url:current,status:r.status,location,cache:r.headers.get('cache-control')});await r.body?.cancel();if(![301,302,303,307,308].includes(r.status)||!location)return {input,chain,loop:false};current=new URL(location,current).href;}return {input,chain,loop:'limit'};}
const results=[];for(const path of paths)results.push(...await Promise.all(origins.map(origin=>trace(origin+path).catch(error=>({input:origin+path,error:error.name})))));
const report={checkedAt:new Date().toISOString(),scope:'Anonymous read-only live routing; candidate code not deployed; synthetic booking IDs are URL context only, no booking created',results};
await writeFile('docs/evidence/notification-readiness-20261107/live-routing.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({requests:results.length,loops:results.filter(r=>r.loop).length,errors:results.filter(r=>r.error).length,terminal:results.map(r=>({input:r.input,end:r.chain?.at(-1)}))},null,2));
