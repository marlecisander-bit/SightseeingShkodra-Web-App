'use client';
import { useSyncExternalStore } from 'react';
import { MutationForm } from '../../admin/mutation-form';
import { SubmitButton } from '../../admin/submit-button';
import { activateAccount } from '../setup-actions';
const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const snapshot = () => window.location.hash;
const serverSnapshot = () => '';
export function ActivationForm() {
  // Fragment credentials do not enter HTTP URLs, referrers or server request logs.
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const params = new URLSearchParams(hash.slice(1));
  return <MutationForm action={activateAccount}>
    <input type="hidden" name="token_hash" value={params.get('token_hash') ?? ''}/>
    <input type="hidden" name="type" value={params.get('type') ?? ''}/>
    <SubmitButton>Continue to password setup</SubmitButton>
  </MutationForm>;
}
