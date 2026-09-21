import Link from 'next/link';
import { signIn } from '../actions';
import styles from '../../admin/admin.module.css';
export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className={styles.shell}><header className={styles.header}><strong>Sightseeing Shkodra · Staff</strong><Link href="/">Public website</Link></header>
    <div className={styles.form}><h1>Staff sign-in</h1><p>Use the account assigned to your operator.</p>
      {error && <p role="alert">{error === 'access' ? 'Your account does not have access to that workspace.' : 'Unable to sign in or complete the request. Check your details and try again.'}</p>}
      <form action={signIn}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254}/>
        <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024}/><button type="submit">Sign in</button></form>
      <p className={styles.muted}>Need access? Contact your operator administrator.</p></div></main>;
}
