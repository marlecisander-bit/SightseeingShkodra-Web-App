'use client';
import {createContext,useContext,useEffect} from 'react';
import {adminContext} from '@/modules/identity/admin-navigation-layout';
import type {StaffContext} from '@/modules/identity/authorization';
type Identity=Pick<StaffContext,'operatorId'|'userId'|'role'>;
export const AdminWorkspaceIdentity=createContext<Identity|null>(null);
/** Runs when the authorized page has arrived, after the persistent shell's loading state. */
export function AdminSectionContext({identity}:{identity:Identity}){
 const shell=useContext(AdminWorkspaceIdentity);
 useEffect(()=>{
  // Permission changes and account switches get a fresh shell and inbox as well.
  if(shell&&(shell.operatorId!==identity.operatorId||shell.userId!==identity.userId||shell.role!==identity.role)){window.location.reload();return;}
  let frame=0;
  const focus=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const context=adminContext(window.location.hash);if(!context){document.getElementById('workspace-content')?.focus({preventScroll:true});return;}
   const target=document.querySelector<HTMLElement>(`[data-admin-context="${context}"]`);if(!target)return;
   if(target instanceof HTMLDetailsElement)target.open=true;
   let parent=target.parentElement;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}
   target.scrollIntoView({block:'start'});target.querySelector<HTMLElement>('summary')?.focus();
  });};
  focus();window.addEventListener('hashchange',focus);window.addEventListener('admin:context-changed',focus);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('hashchange',focus);window.removeEventListener('admin:context-changed',focus);};
 },[identity,shell]);
 return null;
}
