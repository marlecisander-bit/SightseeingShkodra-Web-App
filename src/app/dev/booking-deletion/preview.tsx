'use client';
import {useState} from 'react';
import {BookingDeletionForm} from '@/app/admin/booking-deletion-form';
import {hasPermission,staffRoles,type StaffRole} from '@/modules/identity/roles';
import admin from '@/app/admin/admin.module.css';
import bookings from '@/app/admin/bookings.module.css';
export function DeletionPreview(){
 const [role,setRole]=useState<StaffRole>('owner'),[deleted,setDeleted]=useState(false),[fail,setFail]=useState(false);
 const reference='SS-SYNTHETIC-DELETE';
 return <main className={admin.shell}><section className={admin.panel}><div className={bookings.workspace}><h1>Booking deletion review</h1><p>Local synthetic fixture. No database, booking, payment, email or push actions. Reload restores the fixture.</p><label>Review role<select value={role} onChange={e=>setRole(e.target.value as StaffRole)}>{staffRoles.map(r=><option key={r}>{r}</option>)}</select></label><label className={bookings.check}><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Simulate busy payment or delivery</label>{deleted?<p role="status">Synthetic booking removed. Financial history retained.</p>:<><h2>{reference}</h2><p>Recorded payment: €15.00 · illustrative paid reservation</p>{hasPermission(role,'bookings.delete')?<BookingDeletionForm reference={reference} action={async form=>{if(form.get('reference')!==reference)return {error:'The booking reference does not match.'};if(fail)return {error:'A payment or message delivery is in progress. Retry later.'};setDeleted(true);}}/>:<p>Permanent deletion is available to the owner only.</p>}</>}</div></section></main>;
}
