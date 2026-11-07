import {resolveTxt} from 'node:dns/promises';
import {createHash} from 'node:crypto';
// Read-only public evidence. No credentials, provider sends or configuration mutations.
const origins=['https://sightseeingshkodra.app','https://www.sightseeingshkodra.app','https://sightseeingshkodra.com','https://www.sightseeingshkodra.com'];
const resources=await Promise.all(origins.flatMap(origin=>['/admin/manifest.webmanifest','/admin/sw.js'].map(async path=>{
 try{const response=await fetch(origin+path,{signal:AbortSignal.timeout(10000)}),body=await response.text();return {origin,path,status:response.status,finalOrigin:new URL(response.url).origin,redirected:response.redirected,type:response.headers.get('content-type'),cache:response.headers.get('cache-control'),sha256:createHash('sha256').update(body).digest('hex'),...(path.endsWith('webmanifest')&&response.ok?{manifest:JSON.parse(body)}:{pushHandler:body.includes("addEventListener('push'")})};}catch{return {origin,path,status:'unavailable'};}
})));
const dns=await Promise.all(['sightseeingshkodra.app','sightseeingshkodra.com'].flatMap(domain=>['send.','resend._domainkey.','_dmarc.'].map(async prefix=>{
 const name=prefix+domain;try{return {name,records:(await resolveTxt(name)).map(parts=>parts.join(''))};}catch{return {name,records:[],status:'not resolved'};}
})));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),resources,dns,scope:'Public-only evidence. Account/provider/deployed configuration observations are recorded separately. DNS presence is not proof of received SPF/DKIM/DMARC alignment or inbox placement.'},null,2));
