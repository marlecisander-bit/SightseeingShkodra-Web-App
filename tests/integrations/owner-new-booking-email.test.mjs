import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingEmailTemplate} from '../../src/modules/integrations/booking-email-template.ts';
import {bookingEmailTemplateV2} from '../../src/modules/integrations/booking-email-template-v2.ts';
import {ownerNewBookingEmail,ownerContactPhone} from '../../src/modules/integrations/owner-new-booking-email.ts';
const envelope={version:2,ownerNewBookingDesign:1,from:'bookings@example.invalid',owner:'owner@example.invalid',replyTo:'support@example.invalid',siteUrl:'https://example.invalid',testRecipient:null};
const booking={reference:'SS-EXAMPLE',status:'confirmed',name:'Haru Nguyen',email:'haru@example.invalid',phone:'+355 69 123 4567',createdAt:'2026-10-20T10:00:00Z',cancelledAt:null,currency:'EUR',total:3600,collectionMode:'meeting_point',paid:false,paymentStatuses:[],refundStatuses:[],refundReview:false,source:'Online',initiatedBy:null,reason:null,items:[{title:'Sightseeing Shkodra',description:'Long ticket description',inclusions:'Long inclusions',date:'2026-10-25',time:'09:00:00',timezone:'Europe/Tirane',guests:4,seats:4,counts:{adult:2,child:2,infant:0}}]};
const render=changes=>ownerNewBookingEmail({...booking,...changes},envelope,'operator','booking');
test('five-second owner summary uses authoritative totals, seats, local calendar date and contact/deep links',()=>{
 const out=render();assert.equal(out.subject,'New Booking · 09:00 · 4 seats · €36 · Haru Nguyen');
 assert.match(out.text,/Sunday, 25 October 2026/);assert.match(out.text,/2 adults · 2 children/);assert.match(out.text,/€36.00/);assert.match(out.text,/Payment due at meeting point/);
 assert.ok(!out.text.includes('infant'));for(const removed of ['Long ticket description','Long inclusions',booking.createdAt,'maps.google','Show your booking QR'])assert.ok(!out.html.includes(removed));
 assert.ok(out.html.includes('https://wa.me/355691234567?text='));assert.ok(out.html.includes('mailto:haru%40example.invalid'));
 assert.ok(out.html.includes('/admin/operator/bookings?booking=booking#booking-booking'));
 const link=new URL(out.html.match(/href="(https:\/\/wa.me\/[^\"]+)"/)[1].replaceAll('&amp;','&'));
 assert.equal(link.searchParams.get('text'),'Hello Haru Nguyen, this is Sightseeing Shkodra regarding your booking for Sunday, 25 October 2026 at 09:00.');
});
test('stored seats and total are never independently repriced or recomputed from passenger counts',()=>{
 const out=render({total:12345,items:[{...booking.items[0],seats:7}]});assert.ok(out.subject.includes('7 seats'));assert.match(out.text,/€123.45/);
});
test('adults only and infants keep a single breakdown and distinguish non-seated infants',()=>{
 for(const [counts,seats,expected] of [[{adult:2,child:0,infant:0},2,'2 adults'],[{adult:2,child:2,infant:1},4,'2 adults · 2 children · 1 infant (no seats)']]){
  const out=render({items:[{...booking.items[0],counts,seats}]});assert.ok(out.text.includes(expected));assert.ok(out.text.includes(`${seats} seats`));
 }
});
test('phone normalization is conservative; no country assumption, extension, URL or generic WhatsApp target',()=>{
 assert.equal(ownerContactPhone('00355 (69) 123-4567'),'+355691234567');assert.equal(ownerContactPhone('+1 202 555 0123'),'+12025550123');
 for(const phone of [null,'','0691234567','+000123456','https://wa.me/123','+355691234567 ext 1','+355691234567?text=bad','+1234567890123456']){assert.equal(ownerContactPhone(phone),null);const out=render({phone});assert.ok(!out.html.includes('wa.me'));assert.ok(out.html.includes('Email Customer'));}
});
test('payment/status combinations never describe paid or cancelled bookings as payment due',()=>{
 for(const changes of [{paid:true},{paymentStatuses:['paid']},{status:'cancelled'},{status:'expired'},{paymentStatuses:['refunded']},{paymentStatuses:['pending']},{paymentStatuses:['failed']}])assert.ok(!render(changes).text.includes('Payment due'));
 assert.match(render({paid:true,paymentStatuses:['pending']}).text,/Payment received/);
 assert.match(render({status:'pending'}).html,/>Pending</);assert.match(render({status:'cancelled'}).html,/>Cancelled</);
 assert.match(render({paymentStatuses:['partially_refunded']}).text,/Partially refunded/);
});
test('missing optional values do not fabricate contacts, counts, seats, dates or amounts',()=>{
 const out=render({name:'',email:null,phone:null,items:[]});assert.ok(!out.html.includes('wa.me'));assert.ok(!out.html.includes('mailto:'));assert.match(out.text,/Customer name not recorded/);assert.match(out.text,/Occupied seats not recorded/);assert.ok(!out.subject.includes('09:00'));
 const missing=render({items:[{title:'Service',date:null,time:null,timezone:'Europe/Tirane',guests:1}]});assert.ok(!missing.text.includes('null'));assert.ok(!missing.text.includes('undefined'));assert.match(missing.text,/Departure time not recorded/);
 for(const email of ['a@example.invalid?bcc=other@example.invalid','.name@example.invalid','name..suffix@example.invalid','name@bad..invalid'])assert.ok(!render({email}).html.includes('mailto:'));
});
test('long and unsafe text remains escaped, header-safe and reasonably bounded',()=>{
 const out=render({name:'<script>alert(1)</script>\r\nBCC: bad'.repeat(12)});assert.ok(out.subject.length<=160);assert.ok(!/[\r\n]/.test(out.subject));assert.ok(!out.html.includes('<script>'));assert.ok(out.html.includes('&lt;script&gt;'));
});
test('summer and DST-transition service dates are local wall-clock values, not UTC conversion',()=>{
 for(const date of ['2026-03-29','2026-07-01','2026-10-25'])assert.ok(render({items:[{...booking.items[0],date,time:'00:15:00'}]}).subject.includes('00:15'));
 assert.ok(!render({items:[{...booking.items[0],date:'2026-02-30'}]}).text.includes('March'));
 assert.ok(!render({items:[{...booking.items[0],timezone:'UTC'}]}).subject.includes('09:00'));
});
test('supported money formatting and multi-service summaries preserve stored data without misleading first-departure subject',()=>{
 for(const currency of ['USD','GBP'])assert.ok(!render({currency}).text.includes('€'));
 const out=render({items:[booking.items[0],{...booking.items[0],date:'2026-10-26',time:'11:00:00'}]});assert.ok(out.subject.includes('2 departures'));assert.ok(out.subject.includes('8 seats'));assert.ok(out.text.includes('11:00'));assert.ok(out.text.includes('€36.00'));
});
test('design dispatch is owner-created-only and legacy/customer/modified/cancelled output stays byte-identical',()=>{
 for(const recipient of ['owner','customer'])for(const event of ['BOOKING_CREATED','BOOKING_MODIFIED','BOOKING_CANCELLED']){
  const marked=bookingEmailTemplate(event,recipient,booking,envelope,'operator','booking');
  const old={...envelope,ownerNewBookingDesign:undefined};
  if(event==='BOOKING_CREATED'&&recipient==='owner')assert.notEqual(marked.html,bookingEmailTemplateV2(event,recipient,booking,old,'operator','booking').html);
  else assert.deepEqual(marked,bookingEmailTemplate(event,recipient,booking,old,'operator','booking'));
  assert.deepEqual(bookingEmailTemplate(event,recipient,booking,old,'operator','booking'),bookingEmailTemplateV2(event,recipient,booking,old,'operator','booking'));
 }
 const customer={...envelope,customerConfirmationDesign:3};assert.deepEqual(bookingEmailTemplate('BOOKING_CREATED','customer',booking,customer,'operator','booking'),bookingEmailTemplate('BOOKING_CREATED','customer',booking,{...customer,ownerNewBookingDesign:undefined},'operator','booking'));
});
