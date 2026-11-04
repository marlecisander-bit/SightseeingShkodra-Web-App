import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const output=new URL('./',import.meta.url);
const profile=await mkdtemp(join(tmpdir(),'shkodra-review-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',chunk=>{log+=chunk;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});chrome.on('error',reject);});
 socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('Protocol timeout: '+method));},20000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cmd=(method,params)=>send(method,params,sessionId);
 const evaluate=async expression=>{const r=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+' '+JSON.stringify(r.exceptionDetails.exception));return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Page condition timeout: '+expression);};
 const viewport=async(w,h,mobile=true)=>{await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});await cmd('Emulation.setTouchEmulationEnabled',{enabled:mobile});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');};
 const shot=async name=>{const {data}=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL(name+'.png',output),Buffer.from(data,'base64'));};
 await cmd('Page.enable');await cmd('Network.enable');await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await viewport(390,844);
 await cmd('Page.navigate',{url:'http://127.0.0.1:3000/dev/booking-cms-review'});
 await wait('document.querySelectorAll("#experiences article").length===2');
 await evaluate('document.querySelector("nextjs-portal")?.style.setProperty("display","none")');
 const layouts=[];
 for(const [w,h]of [[320,568],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[390,480],[844,390]]){
  await viewport(w,h,w<1024);await evaluate('window.scrollTo(0,0)');
  const row=await evaluate(`(()=>{const s=document.querySelector('#experiences'),r=s.querySelector('[id]'),cards=[...s.querySelectorAll('article')];return {w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,overlap:document.querySelector('#home-hero').getBoundingClientRect().bottom-s.getBoundingClientRect().top,heights:cards.map(c=>c.getBoundingClientRect().height),actions:cards.map(c=>c.querySelector('a').getBoundingClientRect().bottom),horizontal:innerWidth>=1024?getComputedStyle(cards[0]).flexDirection==='row':null,carousel:r.scrollWidth>r.clientWidth};})()`);
  assert.equal(row.overflow,false);assert.ok(Math.abs(row.heights[0]-row.heights[1])<1);assert.ok(Math.abs(row.actions[0]-row.actions[1])<1);if(w>=1024)assert.equal(row.horizontal,true);layouts.push(row);
  if(w===390&&h===844||w===1440){await evaluate('Promise.all([...document.querySelectorAll("#home-hero img,#experiences img")].map(i=>i.decode().catch(()=>{})))');await shot(`cms-home-${w}`);await evaluate('window.scrollTo(0,250)');await shot(`cms-cards-${w}`);}
 }
 await viewport(390,844);await evaluate(`window.scrollTo(0,250);document.querySelector('#experiences [id]').scrollTo(0,0)`);
 const touch=await evaluate(`(()=>{const r=document.querySelector('#experiences [id]');return {x:300,y:Math.max(80,r.getBoundingClientRect().top+80),before:r.scrollLeft}})()`);
 await cmd('Input.synthesizeScrollGesture',{x:touch.x,y:touch.y,xDistance:-250,yDistance:0,speed:400,gestureSourceType:'touch'});
 await wait('document.querySelector("#experiences [id]").scrollLeft>100');
 const swipe=await evaluate(`({scroll:document.querySelector('#experiences [id]').scrollLeft,current:document.querySelector('#experiences [aria-current=true]')?.getAttribute('aria-label')})`);
 assert.match(swipe.current,/Loop/);
 await cmd('Input.synthesizeScrollGesture',{x:300,y:touch.y,xDistance:0,yDistance:-180,speed:400,gestureSourceType:'touch'});
 const vertical=await evaluate('window.scrollY');assert.ok(vertical>250);
 await evaluate(`document.querySelectorAll('#experiences article a')[1].click()`);
 await wait('!!document.querySelector(".p-flow input[type=date]")');
 await evaluate(`(()=>{const i=document.querySelector('input[type=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'2026-11-05');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await wait('document.querySelectorAll("button[aria-pressed]").length>0');
 await evaluate(`document.querySelectorAll('button[aria-pressed]')[1].click();`);
 await evaluate(`document.querySelector('.p-transaction-action').click()`);
 await wait(`!!document.querySelector('[aria-label="Add one child"]')`);
 await evaluate(`document.querySelector('[aria-label="Add one child"]').click()`);
 await wait(`document.querySelectorAll('output')[1].textContent==='1'`);
 await evaluate(`document.querySelector('[aria-label="Add one infant"]').click()`);
 await wait(`document.querySelector('[data-booking-page-footer]').innerText.includes('€18.00')`);
 assert.equal(await evaluate(`document.querySelector('[aria-label="Remove one adult"]').disabled`),true);
 await evaluate(`document.querySelector('.p-booking-back').click()`);
 const preserved=await evaluate(`({date:document.querySelector('input[type=date]').value,departure:document.querySelector('[aria-pressed=true]').textContent})`);assert.equal(preserved.date,'2026-11-05');assert.match(preserved.departure,/11:00/);
 await evaluate(`document.querySelector('.p-transaction-action').click()`);
 await wait('!document.querySelector(".p-transaction-action").disabled');
 // Exercise a real over-capacity quote, then recover through passenger editing.
 for(let count=2;count<=8;count++){await evaluate(`document.querySelector('[aria-label="Add one adult"]').click()`);await wait(`document.querySelectorAll('output')[0].textContent==='${count}'`);}
 await wait(`document.querySelector('.p-transaction-action').disabled && document.querySelector('.p-availability-status').innerText.includes('No departure has enough seats')`);
 await evaluate(`document.querySelector('.p-booking-back').click()`);
 const unavailable=await evaluate(`({disabled:[...document.querySelectorAll('button[aria-pressed]')].every(b=>b.disabled),canEdit:[...document.querySelectorAll('button')].some(b=>b.textContent==='Edit passengers')})`);
 assert.equal(unavailable.disabled,true);assert.equal(unavailable.canEdit,true);
 await shot('cms-unavailable-mobile');
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit passengers').click()`);
 for(let count=7;count>=1;count--){await evaluate(`document.querySelector('[aria-label="Remove one adult"]').click()`);await wait(`document.querySelectorAll('output')[0].textContent==='${count}'`);}
 await wait(`document.querySelector('[data-booking-page-footer]').innerText.includes('€18.00')`);
 await evaluate(`(()=>{const original=window.fetch;window.__handoff=[];window.fetch=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url,location.origin);if(u.pathname==='/api/public/checkout'){const b=JSON.parse(init.body);window.__handoff.push(b);return b.action==='session'?Response.json({ok:true}):Response.json({error:'INVALID_REQUEST'},{status:403});}return original(input,init);};})()`);
 await shot('cms-who-mobile');
 await evaluate(`document.querySelector('.p-transaction-action').click()`);await wait('window.__handoff.length===2');
 const handoff=await evaluate('window.__handoff');assert.equal(handoff[1].productId,'7d7257f2-ee83-43cf-85bf-5dba3bbf5196');assert.deepEqual(handoff[1].passengers,{adult:1,child:1,infant:1});
 // Contact/confirmation UI uses the exact live quote with a local-only hold response.
 // No production hold, booking, order, payment or communication is created.
 await wait(`!document.querySelector('.p-transaction-action').disabled`);
 await evaluate(`(async()=>{const d=await(await fetch('/dev/booking-cms-review/availability?date=2026-11-05&guests=3&adult=1&child=1&infant=1&productId=7d7257f2-ee83-43cf-85bf-5dba3bbf5196')).json();window.__localHold={id:'local-review-no-reservation',departure_id:'f4f0c150-d44f-4f58-b14c-1f7147ceb09f',quantity:3,status:'active',expires_at:new Date(Date.now()+600000).toISOString(),passengerSnapshot:d.quote.departures[1].passengerQuote};const original=window.fetch;window.__confirmation=[];window.fetch=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url,location.origin);if(u.pathname==='/api/public/checkout'){const b=JSON.parse(init.body);window.__confirmation.push(b);if(b.action==='hold'||b.action==='read')return Response.json({hold:window.__localHold,serverNow:new Date().toISOString()});if(b.action==='session'||b.action==='release')return Response.json({ok:true});return Response.json({error:'INVALID_REQUEST'},{status:403});}return original(input,init);};})()`);
 await evaluate(`document.querySelector('.p-transaction-action').click()`);await wait(`!!document.querySelector('form input[autocomplete=name]')`);
 const required=await evaluate(`({required:document.querySelectorAll('input[required]').length,valid:document.querySelector('form').checkValidity(),associated:document.querySelector('.p-transaction-action').form===document.querySelector('form')})`);
 assert.deepEqual(required,{required:2,valid:false,associated:true});
 await evaluate(`document.querySelector('.p-transaction-action').click()`);assert.equal(await evaluate(`window.__confirmation.some(b=>b.action==='order')`),false);
 for(const [field,value]of [['name','Review Guest'],['email','review@example.test']]){await evaluate(`document.querySelector('input[autocomplete=${field}]').focus()`);await cmd('Input.insertText',{text:value});}
 await evaluate(`document.querySelector('.p-transaction-action').click()`);await wait(`!!document.querySelector('.p-review-contact')`);await shot('cms-review-mobile');
 await evaluate(`document.querySelector('.p-booking-back').click()`);assert.equal(await evaluate(`document.querySelector('input[autocomplete=name]').value`),'Review Guest');
 const footer=[];for(const [w,h]of [[320,568],[390,480],[844,390]]){await viewport(w,h);const f=await evaluate(`(()=>{const b=document.querySelector('[data-booking-page-footer] .p-transaction-action').getBoundingClientRect();return {w:innerWidth,h:innerHeight,top:b.top,bottom:b.bottom,overflow:document.documentElement.scrollWidth>innerWidth}})()`);console.log("footer",f);assert.ok(f.bottom<=h&&f.top>=0);assert.equal(f.overflow,false);footer.push(f);}
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Return to homepage review').click()`);
 await wait(`!!document.querySelector('#experiences')`);
 await viewport(390,844);
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Review Sightseeing Loop Tour dialog').click()`);
 await wait(`!!document.querySelector('dialog[open] form')`);
 await evaluate(`document.querySelector('dialog[open] [data-booking-footer] button:last-child').focus()`);
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Close booking');
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
 assert.equal(await evaluate(`document.activeElement.textContent`),'Review booking');
 const dialogLayouts=[];
 for(const [w,h]of [[320,568],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[390,480],[844,390]]){
  await viewport(w,h,w<1024);
  const row=await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),f=d.querySelector('[data-booking-footer]'),c=d.querySelector('[aria-label="Close booking"]'),heading=d.querySelector('header h2');return {w:innerWidth,h:innerHeight,overflow:d.scrollWidth>d.clientWidth,footerBottom:f.getBoundingClientRect().bottom,closeRight:c.getBoundingClientRect().right,headingRight:heading.getBoundingClientRect().right,closeLeft:c.getBoundingClientRect().left}})()`);
  assert.equal(row.overflow,false);assert.ok(row.footerBottom<=h+1);assert.ok(row.closeRight<=w+1);assert.ok(row.headingRight<=row.closeLeft+1);dialogLayouts.push(row);
  if(w===390&&h===844)await shot('cms-dialog-mobile');if(w===1440)await shot('cms-dialog-desktop');
 }

 await viewport(390,480);await evaluate(`document.querySelector('dialog[open] [class*=content]').scrollTop=100000`);
 const dialog=await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),b=d.querySelector('[class*=content]'),f=d.querySelector('[data-booking-footer]');return {footerBottom:f.getBoundingClientRect().bottom,scroll:b.scrollTop,locked:document.body.style.position}})()`);
 console.log('dialog',dialog);assert.ok(dialog.footerBottom<=481);assert.ok(dialog.scroll>0);assert.equal(dialog.locked,'fixed');await shot('cms-dialog-short');
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(`!document.querySelector('dialog[open]')`);
 assert.equal(await evaluate(`document.activeElement.textContent`),'Review Sightseeing Loop Tour dialog');
 await writeFile(new URL('real-cms-browser-results.json',output),JSON.stringify({layouts,swipe,vertical,preserved,unavailable,handoff,required,dialog,dialogLayouts,footer,limits:['Published CMS snapshot; availability proxied by GET only','All checkout writes blocked; contact UI uses a local-only hold response with the real live quote; no real hold/order/payment','No physical-device or physical keyboard test']},null,2));
 console.log(JSON.stringify({layouts:layouts.length,swipe,preserved,handoffActions:handoff.map(b=>b.action),footer}));
}finally{socket?.close();chrome.kill('SIGTERM');await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true});}
