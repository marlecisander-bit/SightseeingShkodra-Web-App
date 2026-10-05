'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requestRecipientEmail } from '@/modules/integrations/booking-email-server';
import { sendAdminTestEmail } from '@/modules/integrations/email-admin-test';
export async function sendTestEmail(operatorId: string, _previous: {message:string;ok:boolean}, form: FormData) {
  try {
    const recipient=form.get('recipient');
    if(typeof recipient!=='string') throw Error();
    await sendAdminTestEmail(operatorId,recipient.trim());
    return {ok:true,message:'Test email sent successfully to Resend. Provider acceptance does not confirm inbox delivery. Identical requests in the same five-minute window are deduplicated.'};
  } catch { return {ok:false,message:'Unable to send test email. Check your access, server configuration and configured test recipient.'}; }
}

export async function resendRecipientEmail(operatorId: string, deliveryId: string, form: FormData) {
  try {
    const requestId = form.get('request_id');
    if (form.get('confirm') !== 'yes' || typeof requestId !== 'string') throw Error('Confirmation required');
    await requestRecipientEmail(operatorId,deliveryId,requestId);
  } catch {
    return {error:'Email was not queued. Check delivery is enabled, the message matches the current booking, and no email for this recipient is already pending. Wait five minutes between resends.'};
  }
  const path = `/admin/${encodeURIComponent(operatorId)}/email`;
  revalidatePath(path);
  redirect(`${path}?result=email_queued`);
}
