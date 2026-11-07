'use client';
import {useState} from 'react';
import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {saveProductAvailability} from './products-actions';
export function ProductAvailabilityForm({operatorId,id,stamp,active=true,message='',saveAction}:{operatorId:string;id:string;stamp:string;active?:boolean;message?:string;saveAction?:(data:FormData)=>Promise<{error:string}|void>}){
 const [enabled,setEnabled]=useState(active);
 return <MutationForm action={saveAction??saveProductAvailability.bind(null,operatorId,id)}>
 <input type="hidden" name="updated_at" value={stamp}/>
 <label>Product availability<select name="active" value={String(enabled)} onChange={event=>setEnabled(event.target.value==='true')}><option value="true">Active</option><option value="false">Inactive</option></select></label>
 <label>Unavailable ribbon message<textarea name="unavailable_message" required={!enabled} maxLength={160} defaultValue={message} rows={2}/></label>
 <p>Inactive products stay visible in their chosen position. New bookings are disabled. Existing reservations are preserved. The ribbon is hidden while active.</p>
 <SubmitButton>Save availability</SubmitButton>
 </MutationForm>;
}
