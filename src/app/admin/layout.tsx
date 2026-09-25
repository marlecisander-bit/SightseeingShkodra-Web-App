import type {ReactNode} from 'react';
import {SessionHistoryGuard} from './session-history-guard';
export const metadata={robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function AdminLayout({children}:{children:ReactNode}){return <><SessionHistoryGuard/>{children}</>;}
