'use client';
import type {ReactNode} from 'react';
/** Only intercept valid form submission; existing payload validation and actions remain authoritative. */
export function BookingConfirmation({message,children}:{message:string;children:ReactNode}){
 return <div onSubmitCapture={event=>{if(!window.confirm(message)){event.preventDefault();event.stopPropagation();}}}>{children}</div>;
}
