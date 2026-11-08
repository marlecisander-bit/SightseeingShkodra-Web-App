/** One server refresh per foreground transition; never replace an active editor. */
export function installForegroundRefresh(view: Window & typeof globalThis, refresh: () => void) {
 const doc=view.document;
 let backgrounded=doc.visibilityState==='hidden',lastRefresh=-Infinity;
 const resume=()=>{
  if(doc.visibilityState!=='visible')return;
  const now=Date.now();
  if(!backgrounded&&now-lastRefresh<2000)return;
  backgrounded=false;
  lastRefresh=now;
  if(doc.querySelector('form[aria-busy="true"], form fieldset:disabled'))return;
  const active=doc.activeElement;
  if(active?.matches('input,textarea,select,[contenteditable="true"]'))return;
  // Also protect ordinary forms which do not install the workspace dirty guard.
  for(const field of doc.querySelectorAll('form input,form textarea,form select')){
   if(field instanceof view.HTMLInputElement){
    if(['hidden','submit','button'].includes(field.type))continue;
    if(['checkbox','radio'].includes(field.type)?field.checked!==field.defaultChecked:field.value!==field.defaultValue)return;
   }else if(field instanceof view.HTMLTextAreaElement){if(field.value!==field.defaultValue)return;}
   else if(field instanceof view.HTMLSelectElement){if([...field.options].some(option=>option.selected!==option.defaultSelected)&&field.value!==(field.querySelector('option[selected]')?.getAttribute('value')??field.options[0]?.value))return;}
  }
  if(!view.dispatchEvent(new view.Event('admin:before-navigation',{cancelable:true})))return;
  refresh();
 };
 const visibility=()=>{if(doc.visibilityState==='hidden')backgrounded=true;else resume();};
 const blur=()=>{backgrounded=true;};
 const pageshow=(event:PageTransitionEvent)=>{if(event.persisted){backgrounded=true;resume();}};
 doc.addEventListener('visibilitychange',visibility);
 view.addEventListener('blur',blur);view.addEventListener('focus',resume);view.addEventListener('pageshow',pageshow);
 return()=>{doc.removeEventListener('visibilitychange',visibility);view.removeEventListener('blur',blur);view.removeEventListener('focus',resume);view.removeEventListener('pageshow',pageshow);};
}
