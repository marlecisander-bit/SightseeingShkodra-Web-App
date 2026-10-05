'use client';
import { useActionState } from 'react';
import { sendTestEmail } from './email-actions';
import { Button } from '@/components/ui/button';
export function EmailTestForm({operatorId,recipient,ready}:{operatorId:string;recipient:string;ready:boolean}) {
  const [state,action,pending]=useActionState(sendTestEmail.bind(null,operatorId),{message:'',ok:false});
  return <form action={action}>
    <label>Send test to<input name="recipient" type="email" required maxLength={254} defaultValue={recipient} disabled={pending||!ready}/></label>
    <p>Use the approved test email address. This sends an example booking and does not change automatic emails.</p>
    <Button type="submit" disabled={pending||!ready}>{pending?'Sending...':'Send test email'}</Button>
    {!ready&&<p>Ask your administrator to set up a test recipient before sending a test email.</p>}
    {state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}
  </form>;
}
