import styles from './admin.module.css';
export default function Loading() {
  return <main className={`${styles.shell} ${styles.standalone}`} aria-busy="true"><p role="status">Loading your workspace…</p></main>;
}
