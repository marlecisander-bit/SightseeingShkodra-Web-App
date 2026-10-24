import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {bookingMatches,bookingAmount,bookingPaymentLabel,validBookingDay} from '../../src/app/admin/bookings-presentation.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,k)=>String(k)})',shortCircuit:true};return next(url,c);}});
const {BookingsWorkspace}=await import('../../src/app/admin/bookings-workspace.tsx');
const {BookingRecord}=await import('../../src/app/admin/booking-record.tsx');
const {BookingConfirmation}=await import('../../src/app/admin/booking-confirmation.tsx');
const {MutationForm}=await import('../../src/app/admin/mutation-form.tsx');
const op='10000000-0000-4000-8000-000000000001',booking='10000000-0000-4000-8000-000000000050';
const row={id:'order',bookingId:booking,reference:'SS-LOCAL',name:'Synthetic Guest',email:'guest@example.test',phone:'000',status:'confirmed',orderStatus:'confirmed',total:9000,currency:'EUR',collectionMode:'meeting_point',payments:[],hasQr:false,items:[{product:'Local tour',date:'2026-10-24',time:'11:00:00',quantity:3,seats:2,status:'confirmed',snapshot:null}]};
const entries=[{id:'a',status:'confirmed',searchText:'Mira SS-LOCAL mira@example.test 35569',content:React.createElement('p',{},'Mira reservation')},{id:'b',status:'cancelled',searchText:'Alex SS-CANCELLED alex@example.test 123',content:React.createElement('p',{},'Alex reservation')}];
test('loaded search covers existing name/reference/contact data with explicit token semantics',()=>{
 for(const query of ['mira','SS-local','mira@example.test','35569','MIRA LOCAL'])assert(bookingMatches(entries[0],query,'all'));
 assert(!bookingMatches(entries[0],'not-found','all'));assert(!bookingMatches(entries[0],'mira','cancelled'));assert(bookingMatches(entries[1],'alex','cancelled'));
});
test('money and date presentation preserve cents and reject invalid data without inventing totals',()=>{
 assert.equal(bookingAmount(9000,'EUR'),'€90.00');assert.equal(bookingAmount(Number.MAX_SAFE_INTEGER,'EUR'),'€90,071,992,547,409.91');assert.equal(bookingAmount(-1,'EUR'),'Value unavailable');
 assert.equal(validBookingDay('2026-02-30'),undefined);assert.equal(validBookingDay('2028-02-29'),'2028-02-29');
});
test('reservation status and recorded payment are distinct, including refunds, cancellations and mixed evidence',()=>{
 assert.equal(bookingPaymentLabel(row),'Due at meeting point');assert.equal(bookingPaymentLabel({...row,orderStatus:'cancelled'}),'No payment recorded');
 for(const [status,label] of [['paid','Paid'],['refunded','Refunded'],['partially_refunded','Partially refunded'],['unknown','Status unavailable']])assert.equal(bookingPaymentLabel({...row,payments:[{status}]}),label);
 assert.equal(bookingPaymentLabel({...row,payments:[{status:'paid'},{status:'failed'}]}),'Review payment records');
});
test('list card is one canonical keyboard link with passenger/seat distinction and no hidden forms/QR',()=>{
 const d=new JSDOM(renderToStaticMarkup(React.createElement(BookingRecord,{operatorId:op,row})));
 assert.equal(d.window.document.querySelector('a').getAttribute('href'),`/admin/${op}/bookings?booking=${booking}`);
 assert.equal(d.window.document.querySelectorAll('a').length,1);assert.equal(d.window.document.querySelectorAll('form,details').length,0);
 assert.match(d.window.document.body.textContent,/3 passengers · 2 seats/);assert.match(d.window.document.body.textContent,/ConfirmedPayment: Due/);d.window.close();
});
test('canonical detail reuses BookingCard with organized sections, existing calendar links and truthful unavailable breakdown',()=>{
 const d=new JSDOM(renderToStaticMarkup(React.createElement(BookingRecord,{operatorId:op,row,selected:true,communications:React.createElement('p',{},'No recorded delivery')})));
 assert(d.window.document.querySelector(`details#booking-${booking}[open]`));
 assert.deepEqual([...d.window.document.querySelectorAll('h3')].map(e=>e.textContent),['Guest','Tour & passengers','Payment','Communications','Booking pass','Reservation actions']);
 assert.match(d.window.document.body.textContent,/3 passengers · 2 occupied seats/);assert.match(d.window.document.body.textContent,/breakdown unavailable/);
 assert.equal(d.window.document.querySelector('a[href*="departures"]').getAttribute('href'),`/admin/${op}/departures?date=2026-10-24&fromBookings=1`);
 assert.equal(d.window.document.querySelectorAll('button').length,0);assert.doesNotMatch(d.window.document.body.textContent,/Issue refund|Amend booking/);d.window.close();
});
test('workspace makes scope and limits explicit, omits unsupported Upcoming and never claims a global count',()=>{
 const d=new JSDOM(renderToStaticMarkup(React.createElement(BookingsWorkspace,{operatorId:op,today:'2026-10-24',entries,canCreate:false,limited:true})));
 assert.match(d.window.document.body.textContent,/loaded results only/);assert.match(d.window.document.body.textContent,/latest 100/);assert.doesNotMatch(d.window.document.body.textContent,/Upcoming|2 bookings|Create booking/);
 assert(d.window.document.querySelector('input[type=search][aria-describedby]'));assert(d.window.document.querySelector('input[name=email][type=email]'));d.window.close();
});
async function harness(tree,run){
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin'}),saved=new Map();
 for(const name of ['window','self','document','navigator','HTMLElement','Element','Node','Event','MouseEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.querySelector('#root'));
 try{await act(async()=>root.render(tree));await run(dom,root);}finally{await act(async()=>root.unmount());dom.window.close();for(const [n,v]of saved)if(v)Object.defineProperty(globalThis,n,v);else delete globalThis[n];}
}
test('status selection filters locally and can reset empty loaded results without a server call',async()=>{
 await harness(React.createElement(BookingsWorkspace,{operatorId:op,today:'2026-10-24',entries,canCreate:true,limited:false}),async dom=>{
  const select=document.querySelector('select');await act(async()=>{select.value='cancelled';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.match(document.querySelector('.list').textContent,/Alex/);assert.doesNotMatch(document.querySelector('.list').textContent,/Mira/);
  await act(async()=>{select.value='expired';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.match(document.body.textContent,/No loaded bookings match/);
  await act(async()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Reset loaded filters').click());assert.match(document.querySelector('.list').textContent,/Mira/);
 });
});
test('confirmation cancellation prevents the existing mutation handler; accepting calls it once with unchanged form fields',async()=>{
 let calls=0;const tree=React.createElement(BookingConfirmation,{message:'Confirm synthetic action?'},React.createElement(MutationForm,{action:async data=>{calls++;assert.equal(data.get('confirm'),'yes');}},React.createElement('input',{name:'confirm',type:'hidden',value:'yes'}),React.createElement('button',{type:'submit'},'Submit')));
 await harness(tree,async dom=>{const form=document.querySelector('form');dom.window.confirm=()=>false;await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls,0);dom.window.confirm=()=>true;
 // Node FormData lacks the browser form constructor.
 const previous=globalThis.FormData;globalThis.FormData=dom.window.FormData;try{await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls,1);}finally{globalThis.FormData=previous;}
 });
});
