'use server';
import { sendAdminTestEmail } from '@/modules/integrations/email-admin-test';
export async function sendTestEmail(operatorId: string, _previous: {message:string;ok:boolean}, form: FormData) {
  try {
    const recipient=form.get('recipient');
    if(typeof recipient!=='string') throw Error();
    await sendAdminTestEmail(operatorId,recipient.trim());
    return {ok:true,message:'Test email sent successfully to Resend. Provider acceptance does not confirm inbox delivery. Identical requests in the same five-minute window are deduplicated.'};
  } catch { return {ok:false,message:'Unable to send test email. Check your access, server configuration and configured test recipient.'}; }
}
