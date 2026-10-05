'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { imageUploadMessage } from './presentation';
import { Button } from '@/components/ui/button';
import { prepareWebsiteImage } from '@/modules/content/image-upload';
import { uploadWebsiteImage } from './website-actions';
import styles from './website-editor.module.css';

/** Uses the existing upload action and preserves the original saved reference. */
export function ImageField({operatorId,label,name,value,onChange,optional=false}:{operatorId:string;label:string;name?:string;value:string;onChange:(value:string)=>void;optional?:boolean}) {
  const [pending,start]=useTransition(),[message,setMessage]=useState('');
  const field = useRef<HTMLFieldSetElement>(null);
  useEffect(()=>{
    if(!pending)return;
    const form=field.current?.closest('form');
    const wait=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();setMessage('Please wait for the image upload to finish before saving.');};
    const click=(event:Event)=>{if(event.target instanceof Element&&event.target.closest('button'))wait(event);};
    form?.addEventListener('submit',wait,true);form?.addEventListener('click',click,true);
    return()=>{form?.removeEventListener('submit',wait,true);form?.removeEventListener('click',click,true);};
  },[pending]);
  return <fieldset ref={field} disabled={pending} className={styles.field}>
    <legend>{label}</legend>
    {name&&<input type="hidden" name={name} value={value}/>}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {value&&<img className={styles.imagePreview} src={value} alt={`Current ${label}`}/>}
    <label className={`${styles.replaceButton} ss-button`}>{value?'Replace image':'Choose image'}<input aria-label={`Replace ${label}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{
      const file=e.target.files?.[0];if(!file)return;e.target.value='';
      start(async()=>{try{setMessage('Uploading image…');const prepared=await prepareWebsiteImage(file,false);const form=new FormData();form.set('image',prepared);const result=await uploadWebsiteImage(operatorId,form);if('url' in result){onChange(result.url);setMessage('Image ready. Save your changes to use it.');}else setMessage(result.error??'Image could not be uploaded. Please try again.');}catch(error){console.error('Admin image upload failed',error);setMessage(imageUploadMessage(error));}});
    }}/></label>
    {optional&&value&&<Button type="button" onClick={()=>onChange('')}>Remove image</Button>}
    <details><summary>Technical details</summary><label>Existing image link<input maxLength={2000} value={value} onChange={e=>onChange(e.target.value)}/></label></details>
    {message&&<p role="status">{message}</p>}
  </fieldset>;
}

export function SavedImageField({operatorId,name,label,initial}:{operatorId:string;name:string;label:string;initial:string}) {
  const [value,setValue]=useState(initial);
  return <ImageField operatorId={operatorId} label={label} name={name} value={value} onChange={setValue} optional/>;
}
