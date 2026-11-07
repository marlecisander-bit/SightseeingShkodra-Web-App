import 'server-only';
import {createHash} from 'node:crypto';
import {requirePermission} from '../identity/require-permission';
import {bookingEmailConfig} from './booking-email-config';
import {adminAlertHeaders} from './admin-operational-email';
import {sendResendEmail} from './resend-provider';
/** Explicit owner-only diagnostic: no booking lookup, template, queue drain or customer. */
export async function sendConfiguredAdminTest(operator:string,dependencies={authorize:requirePermission,send:sendResendEmail,env:process.env,now:Date.now}){
 await dependencies.authorize(operator,'integrations.manage');
 const env=dependencies.env;
 if(env.VERCEL_ENV==='preview'||env.VERCEL_ENV==='development'||env.PUBLIC_OPERATOR_ID!==operator)throw Error('admin_test_unavailable');
 const config=bookingEmailConfig({...env,EMAIL_ENABLED:'true'});
 if(!config.enabled)throw Error('admin_test_unavailable');
 const production=env.NODE_ENV==='production'&&env.APP_ENV==='production'&&(!env.VERCEL_ENV||env.VERCEL_ENV==='production');
 if((!production||config.testRecipient)&&config.testRecipient!==config.owner)throw Error('approved_admin_recipient_required');
 const message={from:config.from,to:[config.owner],reply_to:config.replyTo,subject:'[TEST] Sightseeing Shkodra — admin email delivery check',text:'This is an administrator-requested email delivery test. No booking was created or changed. No customer was contacted.\n\nCheck this message’s original headers for the visible From, Reply-To, Return-Path and Authentication-Results. Provider acceptance does not prove inbox placement.',html:'<p><strong>TEST — admin email delivery check</strong></p><p>No booking was created or changed. No customer was contacted.</p><p>Check the original message headers for From, Reply-To, Return-Path and Authentication-Results. Provider acceptance does not prove inbox placement.</p>',headers:adminAlertHeaders};
 const identity=createHash('sha256').update(JSON.stringify([operator,message,Math.floor(dependencies.now()/300000)])).digest('hex');
 const result=await dependencies.send(config.apiKey,'configured-admin-test/'+identity,message);
 if(result.outcome!=='accepted'||!result.reference)throw Error('admin_test_not_accepted');
 return {accepted:true,providerId:result.reference,from:config.from,to:config.owner,replyTo:config.replyTo};
}
