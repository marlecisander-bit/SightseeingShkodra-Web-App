// Pure synthetic rendering: no database, queue, credentials, provider calls or email sends.
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {bookingEmailTemplate} from '../src/modules/integrations/booking-email-template.ts';
const output=resolve(process.argv[2]||'/tmp/owner-email-preview');
await mkdir(resolve(output,'brand'),{recursive:true});
await copyFile('public/brand/email-logo-v2.png',resolve(output,'brand/email-logo-v2.png'));
const booking={reference:'SS-DEMO-ONLY',status:'confirmed',name:'Haru Nguyen',email:'guest@example.invalid',phone:'+1 202 555 0123',createdAt:'2026-10-20T10:00:00Z',cancelledAt:null,currency:'EUR',total:3600,collectionMode:'meeting_point',paid:false,paymentStatuses:[],refundStatuses:[],refundReview:false,source:'Online',initiatedBy:null,reason:null,items:[{title:'Sightseeing Shkodra',description:'Enjoy a full day discovering the lake, castle and historic streets of Shkodra. Hop on and off at the published stops and explore at your own pace.',inclusions:'All-day access, five sightseeing stops, live van tracking and destination information.',date:'2026-10-25',time:'09:00:00',timezone:'Europe/Tirane',guests:4,seats:4,counts:{adult:2,child:2,infant:0}}]};
const envelope={version:2,from:'bookings@example.invalid',owner:'owner@example.invalid',replyTo:'support@example.invalid',siteUrl:'http://127.0.0.1:3021',testRecipient:null};
const scenarios={
 family:booking,
 adults:{...booking,items:[{...booking.items[0],guests:2,seats:2,counts:{adult:2,child:0,infant:0}}]},
 infants:{...booking,items:[{...booking.items[0],guests:5,counts:{adult:2,child:2,infant:1}}]},
 'no-phone':{...booking,phone:null},
 'invalid-phone':{...booking,phone:'0691234567'},
 paid:{...booking,paid:true,paymentStatuses:['paid']},
 pending:{...booking,status:'pending',collectionMode:'online',paymentStatuses:['pending']},
 cancelled:{...booking,status:'cancelled'},
 'long-name':{...booking,name:'Alexandria-Christina Long-Example '.repeat(4).trim()},
 missing:{...booking,name:'',email:null,phone:null,items:[]},
 usd:{...booking,currency:'USD'},
 'two-services':{...booking,items:[booking.items[0],{...booking.items[0],time:'11:00:00',date:'2026-10-26'}]},
};
const subjects={};
for(const [name,data] of Object.entries(scenarios)){
 const result=bookingEmailTemplate('BOOKING_CREATED','owner',data,{...envelope,ownerNewBookingDesign:1},'demo-operator','demo-booking');
 await writeFile(resolve(output,`${name}.html`),result.html);await writeFile(resolve(output,`${name}.txt`),result.text);subjects[name]=result.subject;
}
const before=bookingEmailTemplate('BOOKING_CREATED','owner',booking,envelope,'demo-operator','demo-booking');
await writeFile(resolve(output,'before.html'),before.html);await writeFile(resolve(output,'before.txt'),before.text);await writeFile(resolve(output,'subjects.json'),JSON.stringify(subjects,null,2));
await writeFile(resolve(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Owner email previews</title><body style="font:16px Arial,sans-serif;max-width:700px;margin:24px auto;padding:16px"><h1>Owner NEW BOOKING email</h1><p>Synthetic fixtures only. No email was sent. Phone is a reserved fictional US number; emails use example.invalid.</p><p><a href="before.html">Before</a></p><ul>${Object.keys(scenarios).map(name=>`<li><a href="${name}.html">${name}</a> — <a href="${name}.txt">plain text</a></li>`).join('')}</ul></body></html>`);
console.info(`Synthetic owner previews written to ${output}. No emails sent.`);
