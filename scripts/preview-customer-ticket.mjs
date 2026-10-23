// Local synthetic artifacts only. No provider, database or HTTP client imported.
import {mkdir,writeFile} from 'node:fs/promises';
import {bookingEmailTemplate} from '../src/modules/integrations/booking-email-template.ts';
import {bookingEmailAttachments} from '../src/modules/integrations/booking-email-attachments.ts';
import {ticketBooking,ticketEnvelope} from '../tests/fixtures/customer-ticket.ts';
const destination='private/customer-ticket-preview';await mkdir(destination,{recursive:true});
const variants={single:{adult:1,child:0,infant:0},family:{adult:2,child:1,infant:1}};
for(const [name,counts]of Object.entries(variants)){
 const b={...ticketBooking,items:[{...ticketBooking.items[0],counts,guests:Object.values(counts).reduce((a,b)=>a+b,0)}]};
 const result=bookingEmailTemplate('BOOKING_CREATED','customer',b,ticketEnvelope,'fixture','fixture');
 const [qr]=await bookingEmailAttachments('BOOKING_CREATED','customer',b,ticketEnvelope);
 await writeFile(`${destination}/${name}.html`,result.html.replace('cid:booking-qr',`data:image/png;base64,${qr.content}`));
 await writeFile(`${destination}/${name}.txt`,result.text);
 await writeFile(`${destination}/${name}.png`,Buffer.from(qr.content,'base64'));
}
const beforeBooking={...ticketBooking,items:[{...ticketBooking.items[0],counts:variants.family,guests:4}]};
const before=bookingEmailTemplate('BOOKING_CREATED','customer',beforeBooking,{...ticketEnvelope,customerConfirmationDesign:undefined},'fixture','fixture');
const [qr]=await bookingEmailAttachments('BOOKING_CREATED','customer',ticketBooking,ticketEnvelope);
await writeFile(`${destination}/before.html`,before.html.replace('cid:booking-qr',`data:image/png;base64,${qr.content}`));await writeFile(`${destination}/before.txt`,before.text);
console.info('Synthetic before/single/family previews generated. Browser preview embeds the same PNG; sent email retains its CID attachment. No emails sent.');
