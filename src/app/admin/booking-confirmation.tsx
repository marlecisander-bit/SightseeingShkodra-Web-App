'use client';

import {useId, useRef, type FormEvent, type ReactNode} from 'react';
import styles from './booking-confirmation.module.css';

type Submission = {form: HTMLFormElement; submitter: HTMLElement | null};

/** Review a valid submission, then pass it back through the original form. */
export function BookingConfirmation({message, children}: {message:string; children:ReactNode}) {
 const id=useId();
 const dialog=useRef<HTMLDialogElement>(null);
 const cancelButton=useRef<HTMLButtonElement>(null);
 const pending=useRef<Submission|null>(null);
 const confirmed=useRef<HTMLFormElement|null>(null);

 function review(event:FormEvent<HTMLDivElement>) {
  const form=event.target;
  if(!(form instanceof HTMLFormElement)||confirmed.current===form||event.defaultPrevented)return;
  event.preventDefault();
  event.stopPropagation();
  if(!dialog.current||dialog.current.open)return;
  pending.current={form,submitter:(event.nativeEvent as SubmitEvent).submitter??null};
  dialog.current.showModal();
  cancelButton.current?.focus({preventScroll:true});
 }

 function dismiss() {
  pending.current=null;
  dialog.current?.close();
 }

 function confirm() {
  const submission=pending.current;
  dismiss();
  if(!submission?.form.isConnected)return;
  const {form,submitter}=submission;
  confirmed.current=form;
  try {
   form.requestSubmit(submitter?.isConnected?submitter:undefined);
  } finally {
   confirmed.current=null;
  }
 }

 return <div onSubmitCapture={review}>
  {children}
  <dialog className={styles.dialog} ref={dialog} aria-labelledby={id+'-title'} aria-describedby={id+'-message'} onCancel={event=>{event.preventDefault();dismiss();}}>
   <h2 id={id+'-title'}>Confirm action</h2>
   <p id={id+'-message'}>{message}</p>
   <div className={styles.actions}>
    <button type="button" ref={cancelButton} onClick={dismiss}>Go back</button>
    <button type="button" data-admin-action="primary" onClick={confirm}>Confirm</button>
   </div>
  </dialog>
 </div>;
}
