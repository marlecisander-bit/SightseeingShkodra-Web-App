'use client';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { MutationForm } from '../../admin/mutation-form';
import { SubmitButton } from '../../admin/submit-button';
import { activateAccount } from '../setup-actions';
const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const snapshot = () => window.location.search + '|' + window.location.hash;
const serverSnapshot = () => '';
export function ActivationForm() {
  // Fragment credentials do not enter HTTP URLs, referrers or server request logs.
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [query, fragment = ''] = hash.split('|');
  const params = new URLSearchParams(fragment.slice(1));
  const error = params.get('error_code') ?? new URLSearchParams(query).get('error_code');
  const providerError = error || params.has('error') || new URLSearchParams(query).has('error');
  if (providerError) return <div><p role="alert">{error === 'otp_expired' ? 'This email link has expired or was already used. Request a new password reset email and open the newest link.' : 'This email link could not be verified. Request a new password reset email.'}</p><Link className="p-button" href="/auth/forgot-password">Request a new reset link</Link></div>;
  if (!params.get('token_hash') || !['invite','recovery'].includes(params.get('type') ?? '')) return <div><p role="alert">Open the complete setup link from your latest email. This page alone cannot activate an account.</p><Link href="/auth/forgot-password">Request a password reset link</Link></div>;
  return <MutationForm action={activateAccount}>
    <input type="hidden" name="token_hash" value={params.get('token_hash') ?? ''}/>
    <input type="hidden" name="type" value={params.get('type') ?? ''}/>
    <SubmitButton>Continue to password setup</SubmitButton>
  </MutationForm>;
}
