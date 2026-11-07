'use client';
import {useState} from 'react';
import {Media} from '@/components/public/ui';
import cardStyles from '@/components/public/product-booking-cards.module.css';
import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {saveProductAvailability} from './products-actions';
import {availabilityLabels,availabilityStates,validateAvailability,type AvailabilityPresentation,type AvailabilityState} from '@/modules/booking/product-availability';
import {AvailabilityBadge,AvailabilityDetails} from '@/components/public/product-availability-status';
export function ProductAvailabilityForm({operatorId,id,stamp,active=true,message='',presentation,previewCard,saveAction}:{operatorId:string;id:string;stamp:string;active?:boolean;message?:string;presentation?:AvailabilityPresentation;previewCard?:{title:string;image:string;alt:string;description:string};saveAction?:(data:FormData)=>Promise<{error:string}|void>}){
 const [state,setState]=useState<AvailabilityState>(active?'available':presentation?.state&&presentation.state!=='available'?presentation.state:'temporarily_unavailable');
 const [label,setLabel]=useState(presentation?.label??''),[text,setText]=useState(message),[precision,setPrecision]=useState<'none'|'month'|'day'>(presentation?.reopening?.precision??'none'),[date,setDate]=useState(presentation?.reopening?.value??''),[actionLabel,setActionLabel]=useState(presentation?.actionLabel??''),[actionUrl,setActionUrl]=useState(presentation?.actionUrl??'');
 const value:AvailabilityPresentation={state,label,actionLabel,actionUrl,...(precision!=='none'&&date?{reopening:{precision,value:date}}:{})};
 let error='';try{validateAvailability(value);}catch(e){error=e instanceof Error?e.message:'Check the status settings.';}
 return <MutationForm action={saveAction??saveProductAvailability.bind(null,operatorId,id)}>
 <input type="hidden" name="updated_at" value={stamp}/><input type="hidden" name="availability" value={JSON.stringify(value)}/><input type="hidden" name="unavailable_message" value={text}/>
 <label>Availability status<select value={state} onChange={event=>setState(event.target.value as AvailabilityState)}>{availabilityStates.map(s=><option key={s} value={s}>{availabilityLabels[s]}</option>)}</select></label>
 <p>Only Available permits new bookings. Displayed reopening dates are information only; they never reopen sales automatically. Sold out here pauses the whole tour; date-specific capacity remains in Calendar &amp; Pricing.</p>
 {state!=='available'&&<>
 <label>Public status label (optional)<input maxLength={80} value={label} onChange={e=>setLabel(e.target.value)} placeholder={availabilityLabels[state]}/></label>
 <label>Explanatory message (optional)<textarea maxLength={160} value={text} onChange={e=>setText(e.target.value)} rows={2}/></label><p>Leave overrides blank to use the shared status text. Your previous unavailable message is preserved.</p>
 <label>Reopening information<select value={precision} onChange={e=>{setPrecision(e.target.value as 'none'|'month'|'day');setDate('');}}><option value="none">No date</option><option value="month">Month only</option><option value="day">Exact date</option></select></label>
 {precision!=='none'&&<label>{precision==='month'?'Expected reopening month':'Expected reopening date'}<input type={precision==='month'?'month':'date'} required value={date} onChange={e=>setDate(e.target.value)}/></label>}
 <label>Secondary action destination (optional)<input maxLength={2048} value={actionUrl} onChange={e=>setActionUrl(e.target.value)} placeholder="/route"/></label><p>Use a supported site path, such as /route or /explore/destination, or a full HTTPS URL. Without a destination no action is shown.</p>
 {actionUrl&&<label>Secondary action label (optional)<input maxLength={80} value={actionLabel} onChange={e=>setActionLabel(e.target.value)} placeholder="Explore the route"/></label>}
 <fieldset><legend>Tour-card status preview</legend><article className={`${cardStyles.card} ${cardStyles.statusPreview}`} data-inactive="true"><AvailabilityBadge product={{active:false,availability:value,unavailableMessage:text}}/>{previewCard?.image?<Media src={previewCard.image} alt={previewCard.alt}/>:<div className={cardStyles.placeholder}>Product photo</div>}<div className={cardStyles.body}>{previewCard&&<><h3>{previewCard.title}</h3><p className={cardStyles.description}>{previewCard.description}</p></>}<AvailabilityDetails product={{active:false,availability:value,unavailableMessage:text}}/></div></article></fieldset>
 </>}
 {error&&<p role="alert">{error}</p>}
 <SubmitButton disabled={!!error}>Save availability</SubmitButton>
 </MutationForm>;
}
