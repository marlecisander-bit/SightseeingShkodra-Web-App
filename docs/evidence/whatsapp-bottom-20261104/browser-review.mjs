import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const site=process.argv[2]??'http://localhost:3000/dev/whatsapp-bottom-review';const artifactPrefix=site.includes('localhost')?'local-':site.includes('www.')?'www-':'app-';
const profile=await mkdtemp(join(tmpdir(),'shkodra-review-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;const blockedRequests=[];
try{
 const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',chunk=>{log+=chunk;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});chrome.on('error',reject);});
 socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Fetch.requestPaused'){blockedRequests.push({url:m.params.request.url,method:m.params.request.method});void send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Aborted'},m.sessionId).catch(()=>{});return;}if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('Protocol timeout: '+method));},20000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cmd=(method,params)=>send(method,params,sessionId);
 const evaluate=async expression=>{const r=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+' '+JSON.stringify(r.exceptionDetails.exception));return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Page condition timeout: '+expression);};
 const viewport=async(w,h,mobile=true)=>{await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});await cmd('Emulation.setTouchEmulationEnabled',{enabled:mobile});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');};
 const shot=async name=>{const {data}=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL(artifactPrefix+name+'.png',output),Buffer.from(data,'base64'));};

 await cmd('Page.enable');await cmd('Network.enable');await cmd('Fetch.enable',{patterns:[{urlPattern:'*://*/api/public/checkout*',requestStage:'Request'}]});await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});


 const rows=[];
 for(const [w,h]of [[320,568],[390,844],[430,932],[768,1024],[1440,900]]){
  await viewport(w,h,w<768);await cmd('Page.navigate',{url:site});await wait(`document.querySelectorAll('#experiences article').length===2&&Object.keys(document.querySelector('#experiences a')).some(k=>k.startsWith('__reactProps$'))`);await evaluate(`document.querySelector('nextjs-portal')?.style.setProperty('display','none')`);
  for(const position of [0,100,250,400,700,1200,99999]){
   await evaluate(`window.scrollTo(0,${position})`);await evaluate('new Promise(r=>setTimeout(r,120))');const row=await evaluate(`(()=>{const n=document.querySelector('[aria-label="Contact Sightseeing Shkodra on WhatsApp"]'),r=n.getBoundingClientRect(),s=getComputedStyle(n),controls=[...document.querySelectorAll('[data-product-booking],#home-hero [aria-label="Choose experience"] button,#home-hero [data-product-details]>summary,.p-booking-action,.p-transaction-action')];return {w:innerWidth,h:innerHeight,scroll:scrollY,gap:innerHeight-r.bottom,top:r.top,position:s.position,visible:s.visibility!=='hidden'&&s.display!=='none',clearance:n.style.getPropertyValue('--whatsapp-clearance'),overlap:controls.some(c=>{const b=c.getBoundingClientRect();return b.width&&b.height&&b.top<innerHeight&&b.bottom>0&&r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top}),overflow:document.documentElement.scrollWidth>innerWidth}})()`);assert.equal(row.position,'fixed');assert.ok(Math.abs(row.gap-(w<768?16:24))<1);assert.equal(row.clearance,'');assert.equal(row.overflow,false);if(row.visible)assert.equal(row.overlap,false);if(position===99999)assert.equal(row.visible,true);rows.push(row);if([0,400,99999].includes(position)&&[390,1440].includes(w))await shot(w+'-scroll-'+position);
  }
  await evaluate(`window.__opener=document.querySelector('#experiences a[aria-haspopup=dialog]');window.__opener.click()`);await wait(`document.querySelector('dialog[open]')!==null`);assert.equal(await evaluate(`getComputedStyle(document.querySelector('[aria-label="Contact Sightseeing Shkodra on WhatsApp"]')).display`),'none');await evaluate(`document.querySelector('[aria-label="Close booking"]').click()`);await wait(`!document.querySelector('dialog[open]')&&document.body.style.position!=='fixed'`);
 }
 assert.equal(blockedRequests.length,0);await writeFile(new URL(artifactPrefix+'results.json',output),JSON.stringify({site,rows,bookingDialogHidden:true,checkoutRequests:blockedRequests},null,2));console.log(JSON.stringify({site,measurements:rows.length,checkoutRequests:0}));
}finally{socket?.close();chrome.kill('SIGTERM');chrome.stderr.destroy();chrome.unref();await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
