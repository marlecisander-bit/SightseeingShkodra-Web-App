"use client";
import {useEffect} from 'react';
export function SessionHistoryGuard(){useEffect(()=>{const verify=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};window.addEventListener('pageshow',verify);return()=>window.removeEventListener('pageshow',verify);},[]);return null;}
