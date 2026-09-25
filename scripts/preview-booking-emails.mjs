// Synthetic previews only: no database or delivery, even when EMAIL_ENABLED=true.
import { mkdir, writeFile } from 'node:fs/promises';
import { bookingEmailPreview } from '../src/modules/integrations/booking-email-preview.ts';
await mkdir('private/email-preview',{recursive:true});
for(const event of ['BOOKING_CREATED','BOOKING_MODIFIED','BOOKING_CANCELLED']) for(const recipient of ['customer','owner']){
 const result=bookingEmailPreview(event,recipient);
 for(const format of ['html','text']) await writeFile(`private/email-preview/${event.toLowerCase()}-${recipient}.${format==='text'?'txt':'html'}`,result[format]);
}
console.info('Six synthetic email previews written to private/email-preview. No emails sent.');
