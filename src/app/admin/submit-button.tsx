'use client';
import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';
import { useMutationPending } from './mutation-form';
export function SubmitButton({ children, disabled, ...props }: ComponentProps<'button'>) {
  const { pending: actionPending } = useFormStatus();
  const pending = useMutationPending() || actionPending;
  return <button {...props} type="submit" disabled={disabled || pending} aria-disabled={disabled || pending} aria-busy={pending}>
    {pending ? 'Please wait…' : children}
  </button>;
}
