'use client';
import {useEffect,useRef} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
export function SessionHistoryGuard(){
 const router=useRouter(),pathname=usePathname(),search=useSearchParams().toString();
 const historyRefresh=useRef(false);
 useEffect(()=>{
  // Back/Forward may restore an RSC snapshot. Refresh live operational data and
  // authorization after the router commits that destination; hash-only menu
  // history does not need another server read.
  if(historyRefresh.current){historyRefresh.current=false;router.refresh();}
  const current=pathname+'?'+search;
  const pop=()=>{const next=window.location.pathname+'?'+new URLSearchParams(window.location.search);if(next!==current)historyRefresh.current=true;};
  const verify=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
  window.addEventListener('popstate',pop);window.addEventListener('pageshow',verify);
  return()=>{window.removeEventListener('popstate',pop);window.removeEventListener('pageshow',verify);};
 },[router,pathname,search]);
 return null;
}
