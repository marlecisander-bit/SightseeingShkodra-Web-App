import type {ReactNode} from 'react';
/** Presentation only. Stored statuses, labels and lifecycle rules remain unchanged. */
export function adminStatusTone(status:string|null|undefined){
 if(['confirmed','paid','published','active','scheduled','accepted','delivered'].includes(status??''))return 'success';
 if(['pending','awaiting_payment','held','processing','leased','sending','retry','uncertain','delivery_delayed','refund_pending'].includes(status??''))return 'warning';
 if(['cancelled','failed','bounced','suppressed','complained','error'].includes(status??''))return 'danger';
 return 'neutral';
}
export function AdminStatus({status,children}:{status:string|null|undefined;children:ReactNode}){
 return <span data-admin-status={adminStatusTone(status)}>{children}</span>;
}
