import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const mode=process.argv[2]??'baseline',artifactPrefix=mode+'-';
const profile=await mkdtemp(join(tmpdir(),'shkodra-review-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-features=OverlayScrollbar,FluentOverlayScrollbar','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'],{stdio:['ignore','ignore','pipe']});
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


 await cmd('Page.enable');await cmd('Network.enable');await cmd('Fetch.enable',{patterns:[{urlPattern:'*://*/api/public/checkout*',requestStage:'Request'}]});await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await viewport(1710,1000,false);
 await cmd('Page.navigate',{url:'http://localhost:3000/dev/booking-gutter-review'});await wait(`document.querySelectorAll('#experiences article').length===2`);await wait(`Object.keys(document.querySelector('#experiences a')).some(k=>k.startsWith('__reactProps$'))`);
 await evaluate(`document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('#home-hero img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});})))`);await evaluate(`document.querySelector('nextjs-portal')?.style.setProperty('display','none')`);
 if(mode==='probe')await evaluate(`document.documentElement.style.scrollbarGutter='stable'`);
 const measure=()=>evaluate(`(()=>{const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}},body=document.body;return {innerWidth,clientWidth:document.documentElement.clientWidth,scrollY,bodyTop:body.style.top,bodyWidth:body.style.width,bodyPosition:body.style.position,bodyRect:rect(body),rootGutter:getComputedStyle(document.documentElement).scrollbarGutter,rootRect:rect(document.documentElement),hero:rect(document.querySelector('#home-hero')),image:rect(document.querySelector('#home-hero picture img')),heading:rect(document.querySelector('#home-hero h1')),header:rect(document.querySelector('.p-header')),content:rect(document.querySelector('#experiences')),bodyInline:{position:body.style.position,top:body.style.top,width:body.style.width}}})()`);
 const records=[];
 for(const [name,w,h,mobile,custom]of mode==='after'?[['desktop',1710,1000,false,false],['wide-gutter',1440,900,false,true],['mobile',390,844,true,false],['mobile-short',390,480,true,false]]:[['desktop',1710,1000,false,false]]){
 await viewport(w,h,mobile);if(custom)await evaluate(`window.__scrollStyle=document.createElement('style');window.__scrollStyle.textContent='html::-webkit-scrollbar{width:24px}';document.head.append(window.__scrollStyle)`);
 const count=mode==='after'?4:1;
 for(let i=0;i<count;i++){
  await evaluate(`window.scrollTo(0,${i%2?240:120})`);await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  if(mode==='after'&&i===3)await evaluate(`Object.assign(document.body.style,{position:'relative',top:'0px',width:'calc(100% - 2px)'})`);
  const before=await measure();if(!mobile)assert.ok(before.innerWidth-before.clientWidth>0);await shot(name+'-'+i+'-before');
  if(mode==='after')await evaluate(`(()=>{window.__geometryFrames=[];window.__stopGeometry=false;const sample=()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};window.__geometryFrames.push({hero:rect('#home-hero'),image:rect('#home-hero picture img'),header:rect('.p-header')});if(!window.__stopGeometry)requestAnimationFrame(sample);};sample();})()`);
  await evaluate(`window.__opener=document.querySelectorAll('#experiences article a[aria-haspopup=dialog]')[${i%2}];window.__opener.click()`);await wait(`!!document.querySelector('dialog[open] input[type=date]')&&document.body.style.position==='fixed'`);
  assert.match(await evaluate(`document.querySelector('dialog[open] .p-booking-product').textContent`),i%2?/Loop/:/Hop On Hop Off/);
  const during=await measure();await shot(name+'-'+i+'-during');
  if(mode==='after'&&i===0){await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),controls=[...d.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(n=>n.getClientRects().length);controls.at(-1).focus();})()`);await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Close booking');}

  await cmd('Input.dispatchMouseEvent',{type:'mouseWheel',x:20,y:100,deltaX:0,deltaY:300});await evaluate('new Promise(r=>setTimeout(r,100))');const locked=await measure();
  let dialogScroll=null;if(mode==='after'&&name==='mobile-short'){dialogScroll=await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),n=[...d.querySelectorAll('div')].find(n=>getComputedStyle(n).overflowY==='auto'&&n.scrollHeight>n.clientHeight);if(!n)return null;n.scrollTop=30;return {top:n.scrollTop,client:n.clientHeight,scroll:n.scrollHeight}})()`);assert.ok(dialogScroll?.top>0);}
  if(i%3===0){await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});}else if(i%3===1)await evaluate(`document.querySelector('dialog[open] [aria-label="Close booking"]').click()`);else await evaluate('history.back()');
  await wait(`!document.querySelector('dialog[open]')&&document.body.style.position!=='fixed'&&document.activeElement===window.__opener&&!history.state?.ssBookingDialog`);if(mode==='after')await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__stopGeometry=true;r();})))');const after=await measure();await shot(name+'-'+i+'-after');
  const row={name,cycle:i,product:i%2,before,during,locked,after,dialogScroll,frames:mode==='after'?await evaluate('window.__geometryFrames'):[]};records.push(row);
  if(mode==='after'){for(const phase of [during,locked,after]){assert.equal(phase.rootRect.width,before.rootRect.width);for(const key of ['hero','image','heading','header','content'])for(const field of ['x','y','width','height'])assert.ok(Math.abs(phase[key][field]-before[key][field])<.05,`${name} ${i} ${key}.${field}: ${phase[key][field]} vs ${before[key][field]}`);}assert.equal(after.scrollY,before.scrollY);assert.deepEqual(after.bodyInline,before.bodyInline);for(const frame of row.frames)for(const key of ['hero','image','header']){assert.ok(Math.abs(frame[key].x-before[key].x)<.05);assert.ok(Math.abs(frame[key].y-before[key].y)<.05);assert.ok(Math.abs(frame[key].w-before[key].width)<.05);assert.ok(Math.abs(frame[key].h-before[key].height)<.05);}}
 }
 await evaluate(`Object.assign(document.body.style,{position:'',top:'',width:''})`);if(custom)await evaluate('window.__scrollStyle.remove()');
 }
 await writeFile(new URL(mode+'-measurements.json',output),JSON.stringify({records,blockedRequests},null,2));console.log(JSON.stringify(records.map(r=>({name:r.name,cycle:r.cycle,before:r.before.clientWidth,during:r.during.clientWidth,bodyDuring:r.during.bodyRect.width,headerDuring:r.during.header.width,after:r.after.clientWidth}))));
}finally{socket?.close();chrome.kill('SIGTERM');await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
