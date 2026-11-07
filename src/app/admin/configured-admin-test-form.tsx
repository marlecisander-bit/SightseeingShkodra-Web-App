'use client';
import {useActionState} from 'react';
import {sendConfiguredAdminEmail} from './email-actions';
import {Button} from '@/components/ui/button';
export function ConfiguredAdminTestForm({operatorId,recipient,ready}:{operatorId:string;recipient:string;ready:boolean}){
 const [state,action,pending]=useActionState(sendConfiguredAdminEmail.bind(null,operatorId),{message:'',ok:false});
 return <form action={action}><p>Send a labelled delivery check only to the configured admin address: <strong>{recipient||'Not configured'}</strong>. No booking is created and no customer is contacted.</p><Button type="submit" disabled={!ready||pending}>{pending?'Sending…':'Send test email to admin'}</Button>{!ready&&<p>Sender and admin email configuration are required. Outside production, the approved test recipient must be the admin address.</p>}{state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}</form>;
}
