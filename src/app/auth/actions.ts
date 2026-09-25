'use server';
import { revalidatePath } from 'next/cache';
import { requestPasswordRecovery } from '../../modules/identity/password-recovery';
import { redirect } from 'next/navigation';
import { createSessionClient } from '../../modules/identity/supabase-server';
export async function signIn(form: FormData) {
  const email = form.get('email'), password = form.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || !password || password.length > 1024) redirect('/auth/sign-in?error=credentials');
  let failed = false;
  try { const client = await createSessionClient(); const { error } = await client.auth.signInWithPassword({ email: email.trim(), password }); failed = !!error; }
  catch { failed = true; }
  if (failed) redirect('/auth/sign-in?error=credentials');
  redirect('/admin');
}
export async function signOut() {
  const client = await createSessionClient();
  const { error } = await client.auth.signOut();
  if (error) redirect('/auth/sign-in?error=unavailable');
  revalidatePath('/admin', 'layout');
  redirect('/auth/sign-in');
}

export async function requestRecovery(form:FormData) {
 await requestPasswordRecovery(form.get('email'),process.env.NEXT_PUBLIC_SITE_URL,async(email,redirectTo)=>{const client=await createSessionClient();return client.auth.resetPasswordForEmail(email,{redirectTo});});
 redirect('/auth/forgot-password?sent=1');
}
