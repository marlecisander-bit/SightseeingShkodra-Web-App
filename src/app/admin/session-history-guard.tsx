'use client';
import {useEffect,useRef,startTransition} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {installForegroundRefresh} from './foreground-refresh';
export function SessionHistoryGuard(){
 const router=useRouter(),pathname=usePathname(),search=useSearchParams().toString();
 const historyRefresh=useRef(false);
 useEffect(()=>installForegroundRefresh(window,()=>startTransition(()=>router.refresh())),[router]);
 useEffect(()=>{
  // Back/Forward may restore an RSC snapshot. Refresh live operational data and
  // authorization after the router commits that destination; hash-only menu
  // history does not need another server read.
  if(historyRefresh.current){historyRefresh.current=false;router.refresh();}
  const current=pathname+'?'+search;
  const pop=()=>{const next=window.location.pathname+'?'+new URLSearchParams(window.location.search);if(next!==current)historyRefresh.current=true;};
  window.addEventListener('popstate',pop);
  return()=>{window.removeEventListener('popstate',pop);};
 },[router,pathname,search]);
 return null;
}
