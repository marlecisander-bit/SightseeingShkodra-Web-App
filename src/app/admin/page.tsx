import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createSessionClient } from '../../modules/identity/supabase-server';
import { isStaffRole } from '../../modules/identity/roles';
import { signOut } from '../auth/actions';
import styles from './admin.module.css';
export default async function AdminHome() {
  const client = await createSessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data, error } = await client.from('staff_profiles').select('operator_id,role').eq('auth_user_id', user.id).eq('is_active', true);
  const memberships = (data ?? []).filter(row => isStaffRole(row.role));
  const { data: operators } = memberships.length ? await client.from('operators').select('id,name').in('id', memberships.map(row => row.operator_id)) : { data: [] };
  return <main className={styles.shell}><header className={styles.header}><Link className={styles.adminBrand} href="/admin"><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={170} height={51} unoptimized/><span>Administration</span></Link><form action={signOut}><Button>Sign out</Button></form></header>
    <div><h1>Choose your workspace</h1><p className={styles.muted}>Access is based on your current operator membership.</p>
      {error ? <p role="alert">Workspace access is temporarily unavailable.</p> : <ul className={styles.list}>{(operators ?? []).map(operator => <li key={operator.id}><Link href={`/admin/${operator.id}/overview`}>{operator.name}</Link></li>)}</ul>}
      {!error && !operators?.length && <p>No active workspace is assigned to this account. Contact your operator administrator.</p>}</div></main>;
}
