import Link from 'next/link';
import { MutationForm } from '../../admin/mutation-form';
import { SubmitButton } from '../../admin/submit-button';
import styles from '../../admin/admin.module.css';
import { resetTrackingPassword } from './actions';
import { RecoveryRequest } from './recovery-request';

export const metadata = { title: 'Reset your Live Map password', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <main className={styles.shell}><div className={styles.form}>
    <h1>Reset your Live Map password</h1>
    <p>Keep your website staff session open and use the browser where you requested the recovery link.</p>
    {typeof code === 'string' && /^[a-z0-9-]{20,128}$/i.test(code) &&
      <MutationForm action={resetTrackingPassword}>
        <input type="hidden" name="code" value={code} />
        <label>New password <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <label>Confirm password <input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <SubmitButton>Save new Live Map password</SubmitButton>
      </MutationForm>}
    <RecoveryRequest />
    <Link href="/admin">Return to admin</Link>
  </div></main>;
}
