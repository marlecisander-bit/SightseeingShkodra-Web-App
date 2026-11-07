/** Owner-selected Admin origin. Public booking/customer links retain their own binding. */
export const canonicalAdminOrigin='https://www.sightseeingshkodra.com';
const production=(env:NodeJS.ProcessEnv)=>env.VERCEL_ENV==='production'||(!env.VERCEL_ENV&&env.APP_ENV==='production'&&env.NODE_ENV==='production');
export function adminSiteOrigin(env:NodeJS.ProcessEnv=process.env){
 if(production(env))return canonicalAdminOrigin;
 try{const site=new URL(env.NEXT_PUBLIC_SITE_URL??'');return ['https:','http:'].includes(site.protocol)?site.origin:canonicalAdminOrigin;}catch{return canonicalAdminOrigin;}
}
export function canonicalAdminRedirect(input:string,method:string,env:NodeJS.ProcessEnv=process.env){
 if(!production(env)||method!=='GET')return null;
 const url=new URL(input);
 if(!['sightseeingshkodra.app','www.sightseeingshkodra.app','sightseeingshkodra.com'].includes(url.hostname))return null;
 if(!(/^\/admin(?:\/|$)/.test(url.pathname)||/^\/auth(?:\/|$)/.test(url.pathname)))return null;
 // Old installed workers remain available; permissions/subscriptions cannot be transferred.
 if(['/admin/sw.js','/admin/manifest.webmanifest'].includes(url.pathname))return null;
 return canonicalAdminOrigin+url.pathname+url.search+url.hash;
}
