import { redirect } from 'next/navigation';
import { createSessionClient } from '../../../modules/identity/supabase-server';
import { setPassword } from '../setup-actions';
import { MutationForm } from '../../admin/mutation-form';
import { SubmitButton } from '../../admin/submit-button';
import styles from '../../admin/admin.module.css';
export const metadata = { title: 'Set your staff password', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function SetPassword() {
  const client = await createSessionClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect('/auth/sign-in');
  return <main className={styles.shell}><div className={styles.form}>
    <h1>Set your password</h1><p>Account: {data.user.email}</p>
    <p>Choose 12–128 characters. Use a password you do not use elsewhere.</p>
    <MutationForm action={setPassword}>
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label>
      <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label>
      <SubmitButton>Save password and open workspace</SubmitButton>
    </MutationForm>
  </div></main>;
}
