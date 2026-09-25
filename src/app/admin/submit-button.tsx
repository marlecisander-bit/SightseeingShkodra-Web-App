'use client';
import { Button } from "@/components/ui/button";
import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';
import { useMutationPending } from './mutation-form';
export function SubmitButton({ children, disabled, ...props }: ComponentProps<'button'>) {
  const { pending: actionPending } = useFormStatus();
  const pending = useMutationPending() || actionPending;
  return <Button {...props} type="submit" disabled={disabled || pending} aria-disabled={disabled || pending} aria-busy={pending}>
    {pending ? 'Please wait…' : children}
  </Button>;
}
