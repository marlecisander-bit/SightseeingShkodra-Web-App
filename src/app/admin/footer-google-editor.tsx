'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {saveGoogleReviewsUrl} from './review-actions';
export function FooterGoogleEditor({operatorId,url}:{operatorId:string;url:string|null}){const [message,setMessage]=useState(''),[pending,start]=useTransition(),router=useRouter();return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);start(async()=>{const r=await saveGoogleReviewsUrl(operatorId,data);setMessage(r.error??r.saved??'');if(!r.error)router.refresh();});}}><fieldset disabled={pending}><legend>Google Reviews</legend><p>Shared with Guest Reviews. This setting saves immediately, separately from website drafts. Leave empty to hide the footer icon.</p><label>Google Reviews link<input type="url" name="google_reviews_url" defaultValue={url??''} maxLength={2000}/></label><Button>Save Google Reviews link</Button></fieldset>{message&&<p role="status">{message}</p>}</form>;}
