import type {ReactNode} from 'react';
import {SessionHistoryGuard} from './session-history-guard';
export const metadata={manifest:'/admin/manifest.webmanifest',appleWebApp:{capable:true,title:'Shkodra Admin'},robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function AdminLayout({children}:{children:ReactNode}){return <><SessionHistoryGuard/>{children}</>;}
