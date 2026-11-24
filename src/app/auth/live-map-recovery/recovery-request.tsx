'use client';

import { useActionState } from 'react';
import { requestTrackingRecovery } from './actions';

export function RecoveryRequest() {
  const [status, action, pending] = useActionState(requestTrackingRecovery, { message: '' });
  return <form action={action}>
    <label>Live Map account email <input type="email" name="email" autoComplete="email" required /></label>
    <button disabled={pending} type="submit">Send recovery link</button>
    {status.message && <p role="status">{status.message}</p>}
  </form>;
}
