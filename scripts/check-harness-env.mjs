// This test branch must never build for Production or use real service bindings.
export function harnessEnvironmentErrors(env){
 const errors=[];
 if(env.VERCEL_ENV==='production'||env.APP_ENV==='production')errors.push('Synthetic harness refuses Production');
 if(Object.entries(env).some(([key,value])=>value&&/^(NEXT_PUBLIC_SUPABASE_|SUPABASE_|POSTGRES_|CHECKOUT_SESSION_SECRET$|RESEND_API_KEY$|CRON_SECRET$|VAPID_PRIVATE_KEY$)/.test(key)))errors.push('Synthetic harness requires credential-free service configuration');
 return errors;
}
const errors=harnessEnvironmentErrors(process.env);
if(errors.length){console.error(errors.join('; '));process.exitCode=1;}
