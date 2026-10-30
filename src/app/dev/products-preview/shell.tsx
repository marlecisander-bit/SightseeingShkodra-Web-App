'use client';
import type {ReactNode} from 'react';
import {AdminShellView} from '../../admin/admin-shell';
import {NotificationContext} from '../../admin/notifications';
export function ProductsPreviewShell({children}:{children:ReactNode}){
 const operator='10000000-0000-4000-8000-000000000001';
 const value={operator,inbox:{items:[],unread:0,next:null},error:'',connection:'Local preview',version:0,refresh:async()=>{},mutate:async()=>({}),request:async()=>({})};
 return <NotificationContext.Provider value={value}><AdminShellView operatorId={operator} operatorName="Local layout preview" role="owner" userId="fixture" section="products" accountActions={<span>Preview only</span>}>{children}</AdminShellView></NotificationContext.Provider>;
}
