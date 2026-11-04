import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const mode='interaction';const artifactPrefix=mode+'-';
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

 const geometry=()=>evaluate(`(()=>{const h=document.querySelector('#home-hero'),rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}},img=h.querySelector('picture img');return {hero:rect(h),image:rect(img),header:rect(document.querySelector('.p-header')),crop:getComputedStyle(img).objectPosition,source:img.currentSrc}})()`);
 const cycles=[],dock=[];
 for(const [w,h]of [[390,844],[375,812],[390,480],[568,320],[1440,900]]){
  await viewport(w,h,w<600);await cmd('Page.navigate',{url:'http://localhost:3000/dev/mobile-hero-review'});await wait(`document.querySelectorAll('#experiences article').length===2&&Object.keys(document.querySelector('#experiences a')).some(k=>k.startsWith('__reactProps$'))`);await evaluate(`document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('#home-hero img')].map(i=>i.decode().catch(()=>{}))))`);await evaluate(`document.querySelector('nextjs-portal')?.style.setProperty('display','none');window.scrollTo(0,80)`);
  for(let product=0;product<2;product++)for(let cycle=0;cycle<2;cycle++){
   await evaluate(`document.querySelectorAll('[aria-label="Choose experience"] button')[${product}]?.click()`);await evaluate('new Promise(r=>setTimeout(r,150))');
   await evaluate('new Promise(r=>setTimeout(r,600))');const before=await geometry();await evaluate(`window.__opener=document.querySelectorAll('#experiences a[aria-haspopup=dialog]')[${product}];window.__scroll=scrollY;window.__opener.click()`);await wait(`document.body.style.position==='fixed'&&!!document.querySelector('dialog[open] [data-booking-footer] .p-transaction-action')`);
   const during=await geometry();assert.deepEqual(during,before);await evaluate(`document.querySelector('[aria-label="Close booking"]').click()`);await wait(`!document.querySelector('dialog[open]')&&document.body.style.position!=='fixed'&&!history.state?.ssBookingDialog`);assert.equal(await evaluate('scrollY===window.__scroll'),true);assert.equal(await evaluate('document.activeElement===window.__opener'),true);assert.deepEqual(await geometry(),before);cycles.push({w,h,product,cycle,zeroGeometryDelta:true});
  }
 }
 await viewport(390,844);await evaluate(`window.scrollTo(0,0);document.querySelector('[aria-label="Choose experience"] button').click()`);await wait(`document.querySelector('#experiences [id]').scrollLeft<=3`);
 const rail=await evaluate(`(()=>{const r=document.querySelector('#experiences [id]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
 await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rail.x+rail.w*.85,y:rail.y+50}]});
 for(let i=1;i<=8;i++){await cmd('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rail.x+rail.w*(.85-.7*i/8),y:rail.y+50}]});await new Promise(r=>setTimeout(r,20));}
 await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(`document.querySelector('[aria-label="Choose experience"] [aria-current=true]').getAttribute('aria-label').includes('Loop')`);
 for(let i=0;i<2;i++){await evaluate(`document.querySelectorAll('[aria-label="Choose experience"] button')[${i}].click()`);await wait(`document.querySelectorAll('[aria-label="Choose experience"] button')[${i}].getAttribute('aria-current')==='true'`);}
 for(const y of [0,100,250,450,650]){await evaluate(`window.scrollTo(0,${y})`);await new Promise(r=>setTimeout(r,100));const row=await evaluate(`(()=>{const n=document.querySelector('[aria-label="Contact Sightseeing Shkodra on WhatsApp"]'),r=n.getBoundingClientRect(),visible=getComputedStyle(n).visibility!=='hidden'&&getComputedStyle(n).display!=='none';return {y:scrollY,visible,overlap:visible&&[...document.querySelectorAll('#home-hero [data-product-booking],#home-hero [aria-label="Choose experience"] button')].some(n=>{const b=n.getBoundingClientRect();return b.width&&b.height&&b.top<innerHeight&&b.bottom>0&&r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top})}})()`);assert.equal(row.overlap,false);dock.push(row);}
 await evaluate(`window.scrollTo(0,0);window.__sizes=[...document.querySelectorAll('#home-hero *')].map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const [n,size]of window.__sizes)n.style.setProperty('font-size',size*2+'px','important')`);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);await evaluate(`document.querySelector('#experiences a[aria-haspopup=dialog]').scrollIntoView({block:'center'})`);assert.equal(await evaluate(`(()=>{const n=document.querySelector('#experiences article strong'),r=n.getBoundingClientRect();return r.height<=parseFloat(getComputedStyle(n).fontSize)*1.3&&r.right<=n.closest('article').getBoundingClientRect().right})()`),true);await shot('200-percent-text');
 assert.equal(await evaluate(`(()=>{const n=document.querySelector('#experiences a[aria-haspopup=dialog]'),r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()`),true);
 await cmd('Page.navigate',{url:'http://localhost:3000/dev/mobile-hero-review?count=4'});await wait(`document.querySelectorAll('#experiences article').length===4`);await wait(`Object.keys(document.querySelector('[aria-label="Choose experience"] button')).some(k=>k.startsWith('__reactProps$'))`);
 await evaluate(`for(const n of document.querySelectorAll('#experiences h3'))n.textContent+=' — A longer experience title for narrow-screen layout verification';document.querySelector('[data-product-details] p').textContent+=' Additional descriptive content. '.repeat(20);document.querySelector('[data-product-details] summary').click()`);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);await evaluate(`document.querySelector('#experiences a[aria-haspopup=dialog]').scrollIntoView({block:'center'})`);await shot('long-card-content');
 for(let i=0;i<4;i++){await evaluate(`document.querySelectorAll('[aria-label="Choose experience"] button')[${i}].click()`);await wait(`document.querySelectorAll('[aria-label="Choose experience"] button')[${i}].getAttribute('aria-current')==='true'`);}
 assert.equal(blockedRequests.length,0);await writeFile(new URL('interactions.json',output),JSON.stringify({cycles,dock,nativeTouchSwipe:true,allProductsPagination:true,futureProducts:4,text200Percent:true,longDetailsReachable:true,checkoutRequests:blockedRequests},null,2));console.log('Interactions passed');
}finally{socket?.close();chrome.kill('SIGTERM');chrome.stderr.destroy();chrome.unref();await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
