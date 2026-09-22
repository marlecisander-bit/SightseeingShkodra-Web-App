'use client';
import { createContext, useContext, useId, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from 'react';
import styles from './admin.module.css';
export type MutationFailure = { error: string };
const PendingContext = createContext(false);
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function useMutationPending() { return useContext(PendingContext); }
/** Prevent navigation/reset for failed mutations. Draft values remain only in the current DOM. */
export function MutationForm({ action, children, className }: {
  action: (data: FormData) => Promise<MutationFailure | void>; children: ReactNode; className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const errorId = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const inFlight = useRef(false);
  return <PendingContext.Provider value={pending}><form method="post" className={className} aria-busy={pending} aria-describedby={error ? errorId : undefined}
    onSubmit={event => {
      event.preventDefault();
      if (!hydrated || inFlight.current) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const data = new FormData(event.currentTarget, submitter);
      inFlight.current = true;
      setError('');
      startTransition(async () => {
        try {
          const result = await action(data);
          if (result?.error) setError(result.error);
        } catch (failure) {
          // Next redirect signals must keep their navigation behavior.
          if (failure && typeof failure === 'object' && 'digest' in failure && String(failure.digest).startsWith('NEXT_REDIRECT;')) throw failure;
          setError('The request could not be completed. Your entries are still here. Check the current record before retrying.');
        } finally {
          inFlight.current = false;
        }
      });
    }}>
    <noscript><p>JavaScript is required to save changes in this workspace.</p></noscript>
    {error && <p id={errorId} role="alert">{error}</p>}
    <fieldset className={styles.mutationFields} disabled={!hydrated || pending}>{children}</fieldset>
  </form></PendingContext.Provider>;
}
