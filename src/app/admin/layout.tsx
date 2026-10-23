import type { Viewport } from 'next';
import {Suspense,type ReactNode} from 'react';
import {SessionHistoryGuard} from './session-history-guard';
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#FAFAF8'};
export const metadata={manifest:'/admin/manifest.webmanifest',appleWebApp:{capable:true,title:'Shkodra Admin'},robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function AdminLayout({children}:{children:ReactNode}){return <><Suspense fallback={null}><SessionHistoryGuard/></Suspense>{children}</>;}
