import {PushRegistrationError} from './registration-errors';
export const adminWorkerPath='/admin/sw.js',adminWorkerScope='/admin/';
export function pushSupport(input:{secure:boolean;ios:boolean;standalone:boolean;apis:boolean}){
 if(input.ios&&!input.standalone)return 'INSTALL_REQUIRED';
 return input.secure&&input.apis?null:'UNSUPPORTED';
}
export function deviceEnvironment(){
 return {secure:window.isSecureContext,ios:/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),standalone:window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true,apis:'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window};
}
export function applicationServerKey(value:string):Uint8Array<ArrayBuffer>{
 try{
  const bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  if(bytes.length!==65||bytes[0]!==4)throw Error();return bytes;
 }catch{throw new PushRegistrationError('PUSH_DISABLED');}
}
export function subscriptionMatchesKey(sub:PushSubscription,key:string){
 const actual=sub.options?.applicationServerKey;
 if(!actual)return false;
 const expected=applicationServerKey(key),bytes=new Uint8Array(actual);
 return bytes.length===expected.length&&bytes.every((value,i)=>value===expected[i]);
}
export async function readyAdminWorker(workers:ServiceWorkerContainer,origin:string){
 try{
  const old=await workers.getRegistration(adminWorkerScope);
  if(old?.scope===new URL(adminWorkerScope,origin).href&&old.active&&old.active.scriptURL!==new URL(adminWorkerPath,origin).href)throw Error();
  const registration=await workers.register(adminWorkerPath,{scope:adminWorkerScope,updateViaCache:'none'});
  if(registration.active)return registration;
  await new Promise<void>((resolve,reject)=>{
   const worker=registration.installing??registration.waiting;if(!worker){reject(Error());return;}
   const check=()=>{if(worker.state==='activated'){finish();resolve();}else if(worker.state==='redundant'){finish();reject(Error());}};
   const timer=setTimeout(()=>{finish();reject(Error());},15000);
   function finish(){clearTimeout(timer);worker!.removeEventListener('statechange',check);}
   worker.addEventListener('statechange',check);check(); // activation can precede listener registration
  });
  return registration;
 }catch{throw new PushRegistrationError('WORKER_FAILED');}
}
export type RegisteredDevice={id:string;enabled:boolean};
type Request=(query?:string,action?:unknown)=>Promise<unknown>;
/** Called only by an explicit button tap. Permission is requested before any network await. */
export async function enableDevicePush(input:{key:string;name:string;request:Request;replace?:boolean},browser={environment:deviceEnvironment,permission:()=>Notification.permission,ask:()=>Notification.requestPermission(),worker:()=>readyAdminWorker(navigator.serviceWorker,location.origin)}){
 const unsupported=pushSupport(browser.environment());if(unsupported)throw new PushRegistrationError(unsupported);
 const key=applicationServerKey(input.key);
 if(browser.permission()==='denied')throw new PushRegistrationError('PERMISSION_DENIED');
 const permission=browser.permission()==='granted'?'granted':await browser.ask();
 if(permission!=='granted')throw new PushRegistrationError(permission==='denied'?'PERMISSION_DENIED':'PERMISSION_DISMISSED');
 const registration=await browser.worker();
 let sub=await registration.pushManager.getSubscription();
 const renew=sub&&(input.replace||!subscriptionMatchesKey(sub,input.key)||(sub.expirationTime!==null&&sub.expirationTime<=Date.now()));
 const stored=sub?await input.request('',{kind:'device-status',endpoint:sub.endpoint}) as RegisteredDevice|null:null;
 // A valid saved subscription survives login and repeated enable taps unchanged.
 if(sub&&!renew&&stored?.enabled)return stored;
 if(sub&&(renew||stored?.enabled===false)){
  if(stored?.id)await input.request('',{kind:'device',id:stored.id});
  if(!await sub.unsubscribe())throw new PushRegistrationError('SUBSCRIBE_FAILED');sub=null;
 }
 try{sub??=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});}
 catch{throw new PushRegistrationError(browser.permission()==='denied'?'PERMISSION_DENIED':'SUBSCRIBE_FAILED');}
 await input.request('',{kind:'subscribe',subscription:sub.toJSON(),name:input.name});
 const current=await input.request('',{kind:'device-status',endpoint:sub.endpoint}) as RegisteredDevice|null;
 if(!current?.id||current.enabled!==true)throw new PushRegistrationError('REGISTRATION_UNSAVED');
 return current;
}
