'use server';
import { redirect } from 'next/navigation';
import { createSessionClient } from '../../modules/identity/supabase-server';
import { activationCredentials, passwordValidation } from '../../modules/identity/account-setup';

export async function activateAccount(form: FormData) {
  const credentials = activationCredentials(form);
  if (!credentials) return { error: 'This setup link is missing or invalid. Request a new link from your administrator.' };
  try {
    const client = await createSessionClient();
    const { error } = await client.auth.verifyOtp(credentials);
    if (error) return { error: 'This setup link has expired or was already used. Request a new link, or sign in if you already set your password.' };
  } catch { return { error: 'Account setup is temporarily unavailable. Please try again.' }; }
  redirect('/auth/set-password');
}

export async function setPassword(form: FormData) {
  const error = passwordValidation(form);
  if (error) return { error };
  try {
    const client = await createSessionClient();
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user) return { error: 'Your session expired. Open a new setup link or sign in again.' };
    // Updates only the verified session's account; no caller-supplied user ID or privileged key.
    const updated = await client.auth.updateUser({ password: form.get('password') as string });
    if (updated.error) return { error: 'Unable to save this password. Choose a different password or request a new setup link.' };
  } catch { return { error: 'The result could not be confirmed. Try signing in with your new password before requesting another link.' }; }
  redirect('/admin');
}
