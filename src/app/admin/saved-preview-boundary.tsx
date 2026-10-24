'use client';
import {useState,type ReactNode} from 'react';
/** Saved preview is presentation-only. Explicit public navigation happens outside this view. */
export function SavedPreviewBoundary({children}:{children:ReactNode}){
 const [message,setMessage]=useState('');
 return <div data-saved-preview onClickCapture={event=>{const a=(event.target as Element).closest('a');if(!a)return;const href=a.getAttribute('href');if(href?.startsWith('#'))return;event.preventDefault();event.stopPropagation();setMessage('Public navigation is disabled in saved draft preview. Return to Website to choose another preview.');}} onSubmitCapture={event=>{event.preventDefault();event.stopPropagation();setMessage('Forms are disabled in saved draft preview.');}}>{message&&<p role="status">{message}</p>}{children}</div>;
}
