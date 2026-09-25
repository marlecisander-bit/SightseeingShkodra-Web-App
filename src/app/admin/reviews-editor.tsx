'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/public/guest-reviews';
import { reviewSources, type GuestReview, type ReviewSettings } from '@/modules/content/reviews';
import { saveReview, saveReviewSettings } from './review-actions';
import { uploadWebsiteImage } from './website-actions';
import styles from './reviews-editor.module.css';
const blank:GuestReview={id:'',author:'',rating:5,body:'',source:'Google Maps',review_date:null,original_url:null,avatar_url:null,language:null,featured:false,published:false,display_order:0,updated_at:''};
export function ReviewEditor({operatorId,review}:{operatorId:string;review?:GuestReview}) {
 const [value,setValue]=useState(review??blank),[message,setMessage]=useState(''),[pending,start]=useTransition();const router=useRouter();
 return <form className={styles.form} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget,(e.nativeEvent as SubmitEvent).submitter);start(async()=>{const r=await saveReview(operatorId,data);setMessage(r.error??r.saved??'');if(!r.error){if(!review)setValue({...blank});router.refresh();}});}}>
 <input type="hidden" name="id" value={value.id}/><input type="hidden" name="updated_at" value={value.updated_at}/>
 <fieldset disabled={pending}><div className={styles.grid}>
 <label>Source<select name="source" value={value.source} onChange={e=>setValue({...value,source:e.target.value})}>{reviewSources.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Reviewer name<input name="author" required maxLength={160} value={value.author} onChange={e=>setValue({...value,author:e.target.value})}/></label>
 <label>Rating<select name="rating" value={value.rating} onChange={e=>setValue({...value,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} stars</option>)}</select></label>
 <label>Review date<input name="review_date" type="date" value={value.review_date??''} onChange={e=>setValue({...value,review_date:e.target.value})}/></label>
 <label className={styles.wide}>Review text<textarea name="body" required rows={5} maxLength={10000} value={value.body} onChange={e=>setValue({...value,body:e.target.value})}/><small>Copy the genuine review exactly; do not rewrite it.</small></label>
 <label className={styles.wide}>Original {value.source==='Google Maps'?'Google ':''}review URL<input name="original_url" type="url" maxLength={2000} value={value.original_url??''} onChange={e=>setValue({...value,original_url:e.target.value})}/></label>
 <label>Language<input name="language" placeholder="en" value={value.language??''} onChange={e=>setValue({...value,language:e.target.value})}/></label>
 <label>Display order<input name="display_order" type="number" min="0" max="100000" required value={value.display_order} onChange={e=>setValue({...value,display_order:Number(e.target.value)})}/></label>
 <label>Reviewer photo / Media Library path<input name="avatar_url" value={value.avatar_url??''} onChange={e=>setValue({...value,avatar_url:e.target.value})}/></label>
 <label>Upload reviewer photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(!file)return;e.target.value='';start(async()=>{try{if(file.size>8*1024*1024)throw Error('Image must be 8 MB or smaller.');const data=new FormData();data.set('image',file);const result=await uploadWebsiteImage(operatorId,data);if('url' in result)setValue(v=>({...v,avatar_url:result.url}));else setMessage(result.error??'Upload failed.');}catch(e){setMessage(e instanceof Error?e.message:'Upload failed.');}});}}/></label>
 <label className={styles.check}><input type="checkbox" name="featured" checked={value.featured} onChange={e=>setValue({...value,featured:e.target.checked})}/>Featured</label>
 <label className={styles.check}><input type="checkbox" name="published" checked={value.published} onChange={e=>setValue({...value,published:e.target.checked})}/>Published</label>
 </div><div className={styles.actions}><Button type="button" onClick={()=>{setValue(review??blank);setMessage('Changes discarded.');}}>Cancel</Button><Button name="operation" value="save">Save review</Button>{review&&<Button name="operation" value="delete" formNoValidate>Delete review</Button>}</div></fieldset>
 {message&&<p role="status">{message}</p>}
 {value.author&&value.body&&<aside className={styles.preview}><h3>Homepage preview</h3><ReviewCard review={{...value,original_url:null,avatar_url:value.avatar_url?.startsWith('/images/')||value.avatar_url?.startsWith('https://')?value.avatar_url:null}}/></aside>}
 </form>;
}
export function ReviewSettingsEditor({operatorId,settings}:{operatorId:string;settings:ReviewSettings}) {
 const [message,setMessage]=useState(''),[pending,start]=useTransition();const router=useRouter();
 return <form className={styles.form} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);start(async()=>{const r=await saveReviewSettings(operatorId,data);setMessage(r.error??r.saved??'');if(!r.error)router.refresh();});}}><fieldset disabled={pending}><div className={styles.grid}><label>Reviews displayed<select name="display_limit" defaultValue={settings.display_limit}>{[3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label><label>Google Maps listing / reviews URL<input type="url" name="google_reviews_url" defaultValue={settings.google_reviews_url??''}/></label><label>Leave a review URL<input type="url" name="leave_review_url" defaultValue={settings.leave_review_url??''}/></label></div><Button>Save review settings</Button></fieldset>{message&&<p role="status">{message}</p>}</form>;
}
