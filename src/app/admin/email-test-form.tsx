'use client';
import { useActionState } from 'react';
import { sendTestEmail } from './email-actions';
import { Button } from '@/components/ui/button';
export function EmailTestForm({operatorId,recipient,ready}:{operatorId:string;recipient:string;ready:boolean}) {
  const [state,action,pending]=useActionState(sendTestEmail.bind(null,operatorId),{message:'',ok:false});
  return <form action={action}>
    <label>Send test to<input name="recipient" type="email" required maxLength={254} defaultValue={recipient} disabled={pending||!ready}/></label>
    <p>Only the server-configured test address is allowed. Uses fictional booking data; automatic emails remain unchanged.</p>
    <Button type="submit" disabled={pending||!ready}>{pending?'Sending...':'Send test email'}</Button>
    {!ready&&<p>Complete server configuration and set EMAIL_TEST_RECIPIENT to enable testing.</p>}
    {state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}
  </form>;
}
