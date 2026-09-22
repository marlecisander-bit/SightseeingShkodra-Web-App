import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requirePermission } from '../../../../modules/identity/require-permission';
import { AuthorizationError } from '../../../../modules/identity/authorization';
import { adminSections, navigationFor } from '../../../../modules/identity/admin-navigation';
import { createSessionClient } from '../../../../modules/identity/supabase-server';
import { signOut } from '../../../auth/actions';
import styles from '../../admin.module.css';
import { CatalogPanel } from '../../catalog-panel';
import { DeparturesPanel } from '../../departures-panel';
import { ContentPanel } from '../../content-panel';
import { BookingsPanel } from '../../bookings-panel';
export default async function Workspace({ params, searchParams }: { params: Promise<{ operatorId: string; section: string }>; searchParams: Promise<{ result?: string; date?:string; email?:string; requestId?:string }> }) {
  const { operatorId, section } = await params;
  const selected = adminSections.find(item => item.slug === section);
  if (!selected) notFound();
  let context;
  try { context = await requirePermission(operatorId, selected.permission); }
  catch (error) {
    if (error instanceof AuthorizationError) redirect(`/auth/sign-in?error=${error.code === 'UNAUTHENTICATED' ? 'signin' : error.code === 'FORBIDDEN' ? 'access' : 'unavailable'}`);
    throw error;
  }
  const client = await createSessionClient();
  const { data: operator } = await client.from('operators').select('name').eq('id', context.operatorId).single();
  return <main className={styles.shell}><a className={styles.skip} href="#workspace-content">Skip to content</a>
    <header className={styles.header}><div><strong>{operator?.name ?? 'Operator workspace'}</strong><p className={styles.muted}>{context.role.replace('_',' ')}</p></div><Link href="/admin">Switch workspace</Link><form action={signOut}><button>Sign out</button></form></header>
    <div className={styles.workspace}><nav className={styles.nav} aria-label="Admin navigation">{navigationFor(context.role).map(item => <Link key={item.slug} href={`/admin/${context.operatorId}/${item.slug}`} aria-current={section === item.slug ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <div id="workspace-content" className={styles.panel}><h1>{selected.label}</h1>{section==='catalog'?<CatalogPanel operatorId={context.operatorId} result={(await searchParams).result}/>:section==='departures'?<DeparturesPanel operatorId={context.operatorId} {...await searchParams}/>:section==='content'?<ContentPanel operatorId={context.operatorId} result={(await searchParams).result}/>:section==='bookings'?<BookingsPanel operatorId={context.operatorId} {...await searchParams}/>:<><p>{selected.description}</p><p className={styles.muted}>Management tools are being added in the next development phases.</p></>}</div></div></main>;
}
