import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const site=process.argv[2]??'https://sightseeingshkodra.app';const artifactPrefix=site.includes('www.')?'www-':'';
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

 await cmd('Page.enable');await cmd('Network.enable');await cmd('Fetch.enable',{patterns:[{urlPattern:'*://*/api/public/checkout*',requestStage:'Request'}]});
 await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await viewport(390,844);await cmd('Page.navigate',{url:site+'/'});
 await wait(`document.querySelectorAll('#experiences article').length===2`);
 await wait(`Object.keys(document.querySelector('#experiences a')).some(k=>k.startsWith('__reactProps$'))`);
 const results={layouts:[]};
 for(const [w,h] of [[360,800],[390,844],[768,1024],[1024,768],[1440,900],[390,480],[844,390]]){
 await viewport(w,h,w<1024);await evaluate('window.scrollTo(0,0)');
 await evaluate('Promise.all([...document.querySelectorAll("#home-hero img")].map(i=>i.decode().catch(()=>{})))');
 const row=await evaluate(`(()=>{const hero=document.querySelector('#home-hero').getBoundingClientRect(),head=document.querySelector('h1').getBoundingClientRect(),cards=[...document.querySelectorAll('#experiences article')].map(n=>n.getBoundingClientRect()),rail=document.querySelector('#experiences [id]');return {w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,headBottom:head.bottom,firstTop:cards[0].top,headRight:head.right,firstLeft:cards[0].left,heroBottom:hero.bottom,cardBottom:cards[0].bottom,heights:cards.map(c=>c.height),railOverflow:rail.scrollWidth>rail.clientWidth+1,arrows:[...document.querySelectorAll('[aria-label="Browse experiences"]')].some(n=>n.getBoundingClientRect().height>0)}})()`);
 assert.equal(row.overflow,false);assert.ok(row.cardBottom<=row.heroBottom);assert.ok(Math.abs(row.heights[0]-row.heights[1])<1);if(w>=1024){assert.ok(row.headRight<row.firstLeft);assert.equal(row.railOverflow,false);assert.equal(row.arrows,false);}else assert.ok(row.headBottom<row.firstTop);results.layouts.push(row);
 if(w===390&&h===844||w===1440)await shot('published-home-'+w);
 if(w===390&&h===844){const {cssContentSize}=await cmd('Page.getLayoutMetrics');const {data}=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:390,height:cssContentSize.height,scale:1}});await writeFile(new URL(artifactPrefix+'published-home-mobile-full.png',output),Buffer.from(data,'base64'));}
 }

 await viewport(390,844);await evaluate(`window.scrollTo(0,250);document.querySelector('#experiences [id]').scrollTo(0,0)`);
 const touch=await evaluate(`({x:300,y:document.querySelector('#experiences [id]').getBoundingClientRect().top+80})`);
 await cmd('Input.synthesizeScrollGesture',{...touch,xDistance:-250,yDistance:0,speed:400,gestureSourceType:'touch'});await wait(`document.querySelector('#experiences [id]').scrollLeft>100`);results.swipe=true;
 await evaluate(`window.__opener=document.querySelectorAll('#experiences a')[1];window.__scroll=scrollY;window.__opener.click()`);await wait(`!!document.querySelector('dialog[open] input[type=date]')`);
 assert.equal(await evaluate('location.pathname'),'/');assert.match(await evaluate(`document.querySelector('dialog[open] .p-booking-product').textContent`),/Loop/);
 await evaluate(`(()=>{const i=document.querySelector('dialog[open] input[type=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'2026-11-05');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await wait(`document.querySelectorAll('dialog[open] button[aria-pressed]:not(:disabled)').length>0`);await evaluate(`document.querySelectorAll('dialog[open] button[aria-pressed]:not(:disabled)')[1].click()`);await wait(`!document.querySelector('dialog[open] .p-transaction-action').disabled`);
 await evaluate(`document.querySelector('dialog[open] .p-transaction-action').click()`);await wait(`!!document.querySelector('dialog[open] [aria-label="Add one child"]')`);
 await evaluate(`document.querySelector('dialog[open] [aria-label="Add one child"]').click()`);await wait(`document.querySelectorAll('dialog[open] output')[1].textContent==='1'`);
 await evaluate(`document.querySelector('dialog[open] [aria-label="Add one infant"]').click()`);await wait(`document.querySelector('dialog[open] [data-booking-footer]').innerText.includes('€18.00')`);
 assert.equal(await evaluate(`document.querySelector('dialog[open] [aria-label="Remove one adult"]').disabled`),true);results.realAvailabilityAndPassengerQuote=true;
 await shot('published-dialog-mobile');results.dialogLayouts=[];
 for(const [w,h]of [[360,800],[390,480],[768,1024],[844,390],[1024,768],[1440,900]]){await viewport(w,h,w<1024);const row=await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),b=d.querySelector('.p-transaction-action').getBoundingClientRect();return {w:innerWidth,h:innerHeight,top:b.top,bottom:b.bottom,overflow:document.documentElement.scrollWidth>innerWidth,locked:document.body.style.position}})()`);assert.ok(row.top>=0&&row.bottom<=h);assert.equal(row.overflow,false);assert.equal(row.locked,'fixed');results.dialogLayouts.push(row);if(w===1440)await shot('published-dialog-desktop');if(w===844)await shot('published-dialog-landscape');}
 await evaluate(`document.querySelector('dialog[open] .p-transaction-action').focus()`);await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),'Close booking');
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(`!document.querySelector('dialog[open]')&&document.activeElement===window.__opener&&document.body.style.position!=='fixed'&&!history.state?.ssBookingDialog`);assert.equal(await evaluate('scrollY===window.__scroll'),true);
 await evaluate('window.__opener.click()');await wait(`!!document.querySelector('dialog[open] input[type=date]')`);assert.equal(await evaluate(`document.querySelector('dialog[open] input[type=date]').value`),'2026-11-05');
 await evaluate('history.back()');await wait(`!document.querySelector('dialog[open]')&&document.body.style.position!=='fixed'&&!history.state?.ssBookingDialog`);assert.equal(await evaluate('location.pathname'),'/');results.cleanBack=true;
 await evaluate(`document.querySelectorAll('#experiences a')[0].click()`);await wait(`!!document.querySelector('dialog[open] .p-booking-product')`);assert.match(await evaluate(`document.querySelector('dialog[open] .p-booking-product').textContent`),/Hop On Hop Off/);results.productIsolation=true;
 assert.equal(blockedRequests.length,0);results.checkoutRequests=blockedRequests;results.site=site;
 await writeFile(new URL(artifactPrefix+'published-browser-results.json',output),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{socket?.close();chrome.kill('SIGTERM');await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
