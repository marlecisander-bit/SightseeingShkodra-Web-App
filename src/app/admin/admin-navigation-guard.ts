/** Retain the CMS leave guard when Next client navigation replaces document reloads. */
export function installAdminNavigationGuard(view:Window){
 let previous={url:view.location.href,state:view.history.state};
 const remember=()=>{previous={url:view.location.href,state:view.history.state};};
 const canLeave=()=>view.dispatchEvent(new CustomEvent('admin:before-navigation',{cancelable:true}));
 const click=(event:MouseEvent)=>{
  // Capture the final URL after same-page editor/menu history updates as well.
  queueMicrotask(remember);
  const anchor=(event.target as Element|null)?.closest?.('a[href]') as HTMLAnchorElement|null;
  if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
  const url=new URL(anchor.href,view.location.href);
  if(url.origin===view.location.origin&&url.pathname!==view.location.pathname&&!canLeave()){event.preventDefault();event.stopImmediatePropagation();}
 };
 const pop=(event:PopStateEvent)=>{
  if(new URL(previous.url).pathname!==view.location.pathname&&!canLeave()){
   // Run before the router's bubble listener. Restore the current entry without
   // reloading the document or replacing the editor's unsaved React state.
   event.stopImmediatePropagation();view.history.pushState(previous.state,'',previous.url);
  }
  remember();
 };
 view.document.addEventListener('click',click,true);view.addEventListener('popstate',pop,true);view.addEventListener('hashchange',remember);view.addEventListener('admin:context-changed',remember);
 return()=>{view.document.removeEventListener('click',click,true);view.removeEventListener('popstate',pop,true);view.removeEventListener('hashchange',remember);view.removeEventListener('admin:context-changed',remember);};
}
