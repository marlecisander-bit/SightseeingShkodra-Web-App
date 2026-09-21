// Disposable identities only: no credentials or live Supabase accounts.
export const operatorId = '00000000-0000-4000-8000-000000000001';
export const staffFixtures = ['owner', 'admin', 'operations', 'content_editor'].map((role, index) => ({
  id: `00000000-0000-4000-8000-00000000010${index}`,
  auth_user_id: `00000000-0000-4000-8000-00000000020${index}`,
  operator_id: operatorId,
  role,
  is_active: true,
}));
