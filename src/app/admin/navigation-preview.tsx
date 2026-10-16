import {navigationDiagnostics} from '@/modules/content/navigation';
import type {WebsiteContent} from '@/modules/content/website-schema';
export function NavigationPreview({content}:{content:WebsiteContent}) {
 const rows=navigationDiagnostics(content);
 const fieldLabel=(key:string)=>key==='nav.home'?'Home link label':`Link ${Number(key.split('.')[1])+1} label`;
 const warning=(text:string)=>text.replace(/nav\.home|nav\.\d+\.label/g,fieldLabel);
 return <aside aria-label="Effective navigation preview"><h3>Effective navigation for this form</h3><p>Desktop and mobile use the same links. The first link to each normalized destination is shown. Save a draft to preview; publication is still required.</p><ol>{rows.filter(r=>r.visible).map(r=><li key={r.control}>{r.label} → {r.href}</li>)}</ol>{rows.filter(r=>r.warning).map(r=><p key={r.control} role="status"><strong>{fieldLabel(r.control)}: {r.label}</strong> → {r.href}. {warning(r.warning!)}</p>)}</aside>;
}
