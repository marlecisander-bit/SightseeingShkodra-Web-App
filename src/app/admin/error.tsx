'use client';
import Link from 'next/link';
import styles from './admin.module.css';
export default function AdminError({ reset }: { reset: () => void }) {
  return <main className={styles.shell}><h1>Workspace unavailable</h1><p role="alert">We couldn’t load this workspace. Try again, or return to your workspace list.</p>
    <div><button onClick={reset}>Try again</button></div><Link href="/admin">Choose workspace</Link></main>;
}
