export function activationCredentials(form: FormData) {
  const token = form.get('token_hash'), type = form.get('type');
  if (typeof token !== 'string' || !/^[a-f0-9]{40,128}$/i.test(token) || (type !== 'invite' && type !== 'recovery')) return null;
  return { token_hash: token, type };
}

export function passwordValidation(form: FormData): string | null {
  const password = form.get('password'), confirmation = form.get('confirmation');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return 'Use a password between 12 and 128 characters.';
  if (password !== confirmation) return 'The passwords do not match.';
  return null;
}
