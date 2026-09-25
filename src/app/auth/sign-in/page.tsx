import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from './login-form';
import styles from './login.module.css';
export const metadata = {title:'Staff Login | Sightseeing Shkodra',robots:{index:false,follow:false}};
export default async function SignIn({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const {error}=await searchParams;
 const message=error ? error==='access'?'Your account does not have access to that workspace.':error==='credentials'?'Invalid email or password.':'Sign-in is temporarily unavailable. Please try again.':undefined;
 return <main className={styles.page}>
  <aside className={styles.visual} aria-label="Sightseeing Shkodra">
   <Image src="/images/castle.webp" alt="Rozafa Castle above the Shkodra countryside" fill sizes="(max-width: 767px) 1px, 50vw" className={styles.photo}/>
   <div className={styles.shade}/>
   <Link href="/" className={styles.visualLogo}><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra — public website" width={207} height={62} unoptimized/></Link>
   <div className={styles.caption}><p>YOUR CITY. YOUR PACE.</p><h2>Same City,<br/>More to Discover.</h2><span>A warm welcome starts with you.</span></div>
  </aside>
  <div className={styles.panel}>
   <Link className={styles.back} href="/">Back to public website</Link>
   <div className={styles.content}>
    <Link href="/" className={styles.mobileLogo}><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={190} height={57} unoptimized/></Link>
    <p className={styles.eyebrow}>WELCOME BACK</p><h1>Staff Login</h1>
    <p className={styles.intro}>Access your operator account to manage bookings, operations and content.</p>
    <LoginForm error={message}/>
    <div className={styles.access}><span>Need access?</span><p>Contact your operator administrator.</p></div>
   </div>
   <p className={styles.footer}>Sightseeing Shkodra · Staff Portal</p>
  </div>
 </main>;
}
