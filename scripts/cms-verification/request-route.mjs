import {AsyncLocalStorage} from 'node:async_hooks';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {BookingProvider} from '../../src/components/public/booking.tsx';
const context=globalThis[Symbol.for('cms.verification.request')]??=new AsyncLocalStorage();
export async function requestContent(){if(!context.getStore())throw Error('Missing synthetic request');return context.getStore().content;}
export async function requestDestinations(){if(!context.getStore())throw Error('Missing synthetic request');return context.getStore().places;}
let YourDay;
export async function renderYourDay(content,places=[]){
 if(!YourDay){
  const self=JSON.stringify(import.meta.url);
  const hook=registerHooks({resolve(specifier,ctx,next){
   if(specifier==='@/modules/content/website-server')return {url:new URL('./request-website.mjs',import.meta.url).href,shortCircuit:true};
   if(specifier==='@/modules/content/destinations-server')return {url:new URL('./request-destinations.mjs',import.meta.url).href,shortCircuit:true};
   return next(specifier,ctx);
  },load(url,ctx,next){
   if(url.includes('/node_modules/server-only/'))return {format:'module',shortCircuit:true,source:'export {};'};
   if(url.split('?')[0].endsWith('/website-server.ts'))return {format:'module',shortCircuit:true,source:`export {requestContent as getPublishedWebsite} from ${self};`};
   if(url.split('?')[0].endsWith('/destinations-server.ts'))return {format:'module',shortCircuit:true,source:`export {requestDestinations as getPublicDestinations} from ${self};`};
   return next(url,ctx);
  }});
  try{YourDay=(await import('../../src/app/(public)/your-day/page.tsx')).default;}finally{hook.deregister();}
 }
 return context.run({content,places},async()=>({route:'/your-day',consumer:'actual YourDay route, synthetic request-loader context',html:renderToStaticMarkup(React.createElement(BookingProvider,{preview:true},await YourDay()))}));
}
