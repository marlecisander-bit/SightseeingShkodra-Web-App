import type {ReactNode} from 'react';
import {requirePermission} from '@/modules/identity/require-permission';
import {AuthorizationError} from '@/modules/identity/authorization';
import {createSessionClient} from '@/modules/identity/supabase-server';
import {AdminShell} from '../../admin-shell';

// Shared chrome only. Every page and every mutation still authorizes independently.
export default async function WorkspaceLayout({children,params}:{children:ReactNode;params:Promise<{operatorId:string}>}){
 const {operatorId}=await params;
 let context;
 try{context=await requirePermission(operatorId,'catalog.read');}
 catch(error){if(error instanceof AuthorizationError)return children;throw error;}
 const client=await createSessionClient();
 const {data:operator}=await client.from('operators').select('name').eq('id',context.operatorId).single();
 return <AdminShell userId={context.userId} operatorId={context.operatorId} operatorName={operator?.name??'Operator workspace'} role={context.role}>{children}</AdminShell>;
}
