export function assertLocalEnvironment(env=process.env){
 if(['production','preview'].includes(env.APP_ENV)||['production','preview'].includes(env.VERCEL_ENV))throw Error('CMS verification requires a disposable local environment.');
 const forbidden=Object.keys(env).filter(k=>env[k]&&/SUPABASE|POSTGRES|DATABASE_URL|RESEND_API_KEY|VAPID_PRIVATE|CRON_SECRET|CHECKOUT_SESSION_SECRET/.test(k));
 if(forbidden.length)throw Error('CMS verification refuses service bindings: '+forbidden.join(', '));
 if(env.NEXT_PUBLIC_SITE_URL&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(env.NEXT_PUBLIC_SITE_URL))throw Error('CMS verification refuses a non-loopback site origin.');
}
export function denyNetwork(){const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('CMS verification forbids fetch network requests.');};return ()=>{globalThis.fetch=original;};}
