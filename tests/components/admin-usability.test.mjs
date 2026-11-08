import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks,createRequire} from 'node:module';
import React,{act,useState} from 'react';
import {JSDOM} from 'jsdom';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {summarizeDepartures,operatingSlots,activeScheduleOffers} from '../../src/modules/dashboard/daily-departures.ts';
import {calendarDayOverview} from '../../src/app/admin/calendar-presentation.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const require=createRequire(import.meta.url),saves=[];
const actionsPath=require.resolve('../../src/app/admin/website-actions.ts');
require.cache[actionsPath]={id:actionsPath,filename:actionsPath,loaded:true,exports:{saveWebsiteSection:async(op,section,form)=>{saves.push({op,section,operation:form.get('operation'),title:form.get('seo.title')});return {saved:'Saved'};},uploadWebsiteImage:()=>{throw Error('Unexpected upload');}}};
const navigation=require.resolve('next/navigation');require(navigation);require.cache[navigation].exports={...require(navigation),useRouter:()=>({refresh(){}})};
const {WebsiteSectionEditor}=await import('../../src/app/admin/website-editor.tsx');
test('Website publishing requires a review of saved sections; cancellation and changed fields cannot publish',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/',pretendToBeVisual:true}),saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Event','Node','FormData','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.querySelector('#root'));
 function Fixture(){const [values,setValues]=useState(initialWebsiteContent);return React.createElement(WebsiteSectionEditor,{operatorId:'fixture',sectionId:'seo',stamp:'version-1',content:initialWebsiteContent,values,setValues,canPublish:true,publicationSections:['Homepage search settings','Footer']});}
 const button=text=>[...document.querySelectorAll('button')].find(button=>button.textContent===text);
 try{
  await act(()=>root.render(React.createElement(Fixture)));
  await act(()=>button('Review & publish').click());assert.equal(saves.length,0);assert.match(document.querySelector('[aria-label="Review website publication"]').textContent,/Footer/);
  await act(()=>button('Keep editing').click());assert.equal(document.querySelector('[aria-label="Review website publication"]'),null);assert.equal(saves.length,0);
  await act(()=>button('Review & publish').click());
  const title=document.querySelector('input[name="seo.title"]');
  await act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(title,'A changed search title');title.dispatchEvent(new Event('input',{bubbles:true}));title.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(document.querySelector('[aria-label="Review website publication"]'),null);assert.equal(saves.length,0);
  await act(()=>button('Review & publish').click());await act(async()=>{button('Publish these changes').click();await new Promise(resolve=>setTimeout(resolve,0));});assert.deepEqual(saves,[{op:'fixture',section:'seo',operation:'publish',title:'A changed search title'}]);
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
test('scheduled summary distinguishes complete zero, closed departures and the next local time across shared schedules',()=>{
 const days=[{date:'2026-10-25',slots:[{time:'09:00',open:true},{time:'11:00',open:false},{time:'15:00',open:true}]}];
 const result=summarizeDepartures([{id:'schedule',title:'Tour',days}],'2026-10-25','10:30');assert.equal(result.count,2);assert.equal(result.next.time,'15:00');
 assert.equal(summarizeDepartures([{id:'schedule',title:'Tour',days}],'2026-10-25','16:00').next,null);
 assert.deepEqual(summarizeDepartures([],'2026-10-25','10:30'),{state:'ready',count:0,next:null});assert.throws(()=>summarizeDepartures([{id:'missing',title:'Tour',days:[]}],'2026-10-25','10:30'));
});
test('product pause takes precedence over available inventory without erasing seats or changing historical state',()=>{
 const day={date:'2030-01-02',range:null,exception:null,slots:[{open:true,time:'09:00',capacity:8,booked:2,held:1,remaining:5,quote:{total:1000}}]},service={status:'active',start_date:'2030-01-01',end_date:'2030-12-31'};
 const available=calendarDayOverview(day,'2030-01-01',service),paused=calendarDayOverview(day,'2030-01-01',service,true);
 assert.equal(available.label,'Available');assert.equal(paused.label,'Sales paused');assert.equal(paused.remaining,5);assert.equal(paused.booked,2);assert.equal(calendarDayOverview(day,'2030-01-03',service,true).label,'Past');
});


test('email summary separates historical provider issues from current sending health and tolerates a fresh queue',async()=>{
 const {emailProcessingSummary}=await import('../../src/modules/integrations/email-processing-summary.ts');
 const now=Date.parse('2030-01-01T10:00:00Z'),base={enabled:true,processing:'Operational',pending:0,queueFailures:0,health:{providerFailures:11,delayed:0,missingOutcome:0,oldestPending:null}};
 assert.equal(emailProcessingSummary(base,now),'Working');
 assert.equal(emailProcessingSummary({...base,pending:1,health:{...base.health,oldestPending:'2030-01-01T09:59:00Z'}},now),'Working');
 assert.equal(emailProcessingSummary({...base,pending:1,health:{...base.health,oldestPending:'2030-01-01T09:50:00Z'}},now),'Needs attention');
 for(const patch of [{queueFailures:1},{queueFailures:undefined},{health:null},{processing:'No recent successful run'},{health:{...base.health,missingOutcome:1}}])assert.equal(emailProcessingSummary({...base,...patch},now),'Needs attention');
 assert.equal(emailProcessingSummary({...base,enabled:false},now),'Paused');
});

test('operating summaries honor day and per-time closures with exception precedence and independent shared offers',()=>{
 const slots=[{time:'09:00',open:true},{time:'15:00',open:true},{time:'18:00',open:false}];
 assert.equal(operatingSlots({slots,range:{closed:true},exception:null}).length,0);
 assert.equal(operatingSlots({slots,range:{closed:true},exception:{closed:false,calendar_settings:{departures:{'09:00':{closed:true}}}}}).length,1);
 assert.equal(operatingSlots({slots,range:null,exception:{closed:true,calendar_settings:{}}}).length,0);
 const products=[{id:'base',title:'Paused',active:false,status:'published'},{id:'offer',title:'Shared',active:true,status:'published',inventory_product_id:'base'},{id:'draft',title:'Draft',active:true,status:'draft',inventory_product_id:'base'}];
 assert.deepEqual(activeScheduleOffers('base',products).map(p=>p.id),['offer']);
});
