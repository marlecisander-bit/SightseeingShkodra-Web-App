'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import type {Partner} from '@/modules/content/partners';
import {ImageField} from './image-field';
import {savePartner} from './partner-actions';
import styles from './reviews-editor.module.css';
const blank:Partner={id:'',name:'',logo_url:'',website_url:'',description:'',display_order:0,is_active:false,updated_at:''};
export function PartnerEditor({operatorId,partner}:{operatorId:string;partner?:Partner}) {
 const [value,setValue]=useState(partner??blank),[message,setMessage]=useState(''),[confirmDelete,setConfirmDelete]=useState(false),[pending,start]=useTransition();const router=useRouter();
 return <form className={styles.form} onSubmit={e=>{
 e.preventDefault();const data=new FormData(e.currentTarget,(e.nativeEvent as SubmitEvent).submitter);
 start(async()=>{const result=await savePartner(operatorId,data);setMessage(result.error??result.saved??'');if(!result.error){setConfirmDelete(false);if(!partner)setValue({...blank});router.refresh();}});
 }}>
 <input type="hidden" name="id" value={value.id}/><input type="hidden" name="updated_at" value={value.updated_at}/>
 <fieldset disabled={pending}><div className={styles.grid}>
 <label>Partner name<input name="name" required maxLength={160} value={value.name} onChange={e=>setValue({...value,name:e.target.value})}/></label>
 <label>Website URL<input name="website_url" type="url" maxLength={2000} placeholder="https://" value={value.website_url} onChange={e=>setValue({...value,website_url:e.target.value})}/><small>Leave empty to display a logo without a link.</small></label>
 <ImageField operatorId={operatorId} name="logo_url" label="Partner logo" value={value.logo_url} onChange={logo_url=>setValue(v=>({...v,logo_url}))}/>
 <label>Display order<input name="display_order" type="number" required min="0" max="100000" step="1" value={value.display_order} onChange={e=>setValue({...value,display_order:Number(e.target.value)})}/><small>Lower numbers appear first.</small></label>
 <label className={styles.wide}>Short description (optional)<textarea name="description" rows={3} maxLength={300} value={value.description} onChange={e=>setValue({...value,description:e.target.value})}/></label>
 <label className={styles.check}><input type="checkbox" name="is_active" checked={value.is_active} onChange={e=>setValue({...value,is_active:e.target.checked})}/>Active</label>
 </div><p>Save applies this partner immediately when active and the homepage section is enabled. A logo is required to activate. PNG, JPEG, WebP and AVIF use the existing website media upload; SVG is not supported.</p>
 <div className={styles.actions}><Button type="button" onClick={()=>{setValue(partner??blank);setConfirmDelete(false);setMessage('Changes discarded.');}}>Discard</Button><Button name="operation" value="save">{pending?'Saving…':'Save partner'}</Button>{partner&&<Button type="button" onClick={()=>setConfirmDelete(true)}>Delete partner</Button>}</div>
 {confirmDelete&&<div role="group" aria-label="Confirm partner deletion"><p>Delete {partner?.name}? This removes the partner from the website. Its media file is retained because it may be shared.</p><input type="hidden" name="confirm_delete" value="yes"/><div className={styles.actions}><Button type="button" onClick={()=>setConfirmDelete(false)}>Keep partner</Button><Button name="operation" value="delete" formNoValidate>Confirm delete</Button></div></div>}
 </fieldset>{message&&<p role="status">{message}</p>}
 </form>;
}
