import Link from 'next/link';
import { requestRecovery } from '../actions';
import { SubmitButton } from '../../admin/submit-button';
import styles from '../../admin/admin.module.css';
export const metadata={title:'Reset staff password',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function ForgotPassword({searchParams}:{searchParams:Promise<{sent?:string}>}){
 const {sent}=await searchParams;
 return <main className={styles.shell}><div className={styles.form}><h1>Reset your password</h1><p>Enter the email address for your staff account.</p>{sent&&<p role="status">If an account exists and recovery is available, you will receive a password reset email. Check your inbox and spam folder.</p>}<form action={requestRecovery}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/><SubmitButton>Send reset link</SubmitButton></form><p><Link href="/auth/sign-in">Return to sign-in</Link></p></div></main>;
}
