import {notFound} from 'next/navigation';
import {readFile} from 'node:fs/promises';
import {BookingPassCard} from '@/components/public/booking-pass';
import type {PendingOrder} from '@/modules/booking/contracts';
export const dynamic='force-dynamic';
export default async function BookingPassPreview(){
 if(process.env.NODE_ENV!=='development')notFound();
 let order:PendingOrder;
 try{order=JSON.parse(await readFile('private/qr-pass-preview.json','utf8'));}catch{return <main><p>Run node scripts/preview-booking-pass.mjs to create an isolated booking fixture.</p></main>;}
 return <main style={{padding:'24px 16px',maxWidth:900}}><p style={{textAlign:'center'}}>Local preview - confirmed in an isolated test database. Not a travel ticket.</p><BookingPassCard order={order}/></main>;
}
