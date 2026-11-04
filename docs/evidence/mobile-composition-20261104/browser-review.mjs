import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const mode=process.argv[2]??'baseline';const artifactPrefix=mode+'-';
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
 await viewport(390,844);await cmd('Page.navigate',{url:'http://localhost:3000/dev/mobile-hero-review'});await wait(`document.querySelectorAll('#experiences article').length===2`);await wait(`Object.keys(document.querySelector('#experiences a')).some(k=>k.startsWith('__reactProps$'))`);
 await evaluate(`for(const img of document.querySelectorAll('#home-hero img'))img.loading='eager'`);await evaluate(`document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('#home-hero img')].map(i=>i.decode().catch(()=>{}))))`);await evaluate(`document.querySelector('nextjs-portal')?.style.setProperty('display','none')`);
 const rows=[];
 for(const [w,h]of [[320,568],[360,640],[375,812],[390,844],[430,932],[390,480],[568,320],[768,1024],[1280,800],[1440,900]]){
 await viewport(w,h,w<600);await evaluate('window.scrollTo(0,0)');await evaluate(`document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('#home-hero img')].map(i=>i.decode().catch(()=>{}))))`);await wait(`[...document.querySelectorAll('#home-hero img')].every(i=>i.complete&&i.naturalWidth>0)`);await evaluate('new Promise(r=>setTimeout(r,150))');
 const row=await evaluate(`(()=>{const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}},hero=document.querySelector('#home-hero'),h=hero.querySelector('h1'),cards=[...document.querySelectorAll('#experiences article')],rail=document.querySelector('#experiences [id]');return {w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,hero:rect(hero),media:rect(hero.querySelector("picture")),pagination:rect(hero.querySelector('[aria-label="Choose experience"]')),following:rect(hero.nextElementSibling),headline:rect(h),headlineParts:[...h.children].map(n=>({rect:rect(n),color:getComputedStyle(n).color})),subtitle:rect(h.nextElementSibling),eyebrow:getComputedStyle(h.previousElementSibling).display,cards:cards.map(n=>rect(n)),cta:cards.map(n=>rect(n.querySelector('a[aria-haspopup=dialog]'))),rail:rect(rail),railColumns:getComputedStyle(rail).gridAutoColumns,header:rect(document.querySelector('.p-header')),image:hero.querySelector('picture img').currentSrc,imageFilter:getComputedStyle(hero.querySelector('picture img')).filter,whatsapp:document.querySelector('[aria-label="Contact Sightseeing Shkodra on WhatsApp"]')?rect(document.querySelector('[aria-label="Contact Sightseeing Shkodra on WhatsApp"]')):null};})()`);
 assert.equal(row.overflow,false);rows.push(row);await shot('home-'+w+'x'+h);
 }
 await writeFile(new URL(mode+'-layouts.json',output),JSON.stringify(rows,null,2));console.log(JSON.stringify({mode,layouts:rows.length}));
}finally{socket?.close();chrome.kill('SIGTERM');chrome.stderr.destroy();chrome.unref();await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
