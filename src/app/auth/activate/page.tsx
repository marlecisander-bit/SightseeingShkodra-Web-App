import Link from 'next/link';
import styles from '../../admin/admin.module.css';
import { ActivationForm } from './activation-form';
export const metadata = { title: 'Activate your staff account', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Activate() {
  return <main className={styles.shell}><div className={styles.form}>
    <h1>Activate your staff account</h1>
    <p>Continue using your private setup link, then choose your own password. This link can be used once. Continuing signs this browser into the account associated with the link.</p>
    <ActivationForm/>
    <p>Already set your password? <Link href="/auth/sign-in">Sign in</Link>.</p>
  </div></main>;
}
