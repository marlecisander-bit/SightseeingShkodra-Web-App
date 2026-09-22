import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy.ts';

// Explicit opt-in: never include hosted mutations in the ordinary test suite.
assert.equal(process.env.APP_ENV, 'development');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://ybngoppqqiohcduojfyg.supabase.co');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const run = randomUUID();
const operators = [randomUUID(), randomUUID()];
const users = [];
const sessions = [];
function ok(result) {
  if (result.error) throw new Error(`Supabase operation failed: ${result.error.code ?? result.error.status ?? 'unknown'}`);
  return result.data;
}
let cleanupFailed = false;
try {
  ok(await admin.from('operators').insert(operators.map((id, i) => ({ id, name: `Integration test ${run} ${i}` }))));
  for (let i = 0; i < 2; i++) {
    const email = `integration-${run}-${i}@example.invalid`;
    const password = randomBytes(32).toString('hex');
    const { user } = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    users.push(user.id);
    ok(await admin.from('staff_profiles').insert({ operator_id: operators[i], auth_user_id: user.id, role: 'owner' }));
    const session = client();
    sessions.push(session);
    ok(await session.auth.signInWithPassword({ email, password }));
    assert.equal(ok(await session.auth.getUser()).user.id, user.id);
    const rows = ok(await session.from('operators').select('id'));
    assert.deepEqual(rows.map((r) => r.id), [operators[i]]);
    assert.deepEqual(ok(await session.from('operators').select('id').eq('id', operators[1 - i])), []);
    assert.ok((await session.from('operators').update({ name: 'Forbidden edit' }).eq('id', operators[i])).error);
    assert.ok((await session.from('domain_events').select('id')).error);
    console.log(`PASS: user ${i + 1} sign-in, verified identity, tenant isolation and direct write denial`);
  }
  ok(await sessions[0].auth.refreshSession());
  assert.equal(ok(await sessions[0].auth.getUser()).user.id, users[0]);
  console.log('PASS: real refresh token exchange');
  const jar = new Map();
  const cookieClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)),
    } });
  const current = ok(await sessions[0].auth.getSession()).session;
  ok(await cookieClient.auth.setSession({ access_token: current.access_token, refresh_token: current.refresh_token }));
  assert.ok(jar.size > 0);
  // Force the SDK's persisted expiry into the past without changing the signed JWT.
  // This exercises refresh scheduling; it does not simulate an actually expired JWT.
  const base = [...jar.keys()].find((name) => name.endsWith('-auth-token') || name.endsWith('-auth-token.0')).replace(/\.0$/, '');
  const encoded = jar.get(base) ?? [...jar].filter(([name]) => name.startsWith(base + '.')).sort().map(([, value]) => value).join('');
  assert.ok(encoded.startsWith('base64-'));
  const stored = JSON.parse(Buffer.from(encoded.slice(7), 'base64url').toString());
  stored.expires_at = Math.floor(Date.now() / 1000) - 60;
  jar.clear();
  jar.set(base, 'base64-' + Buffer.from(JSON.stringify(stored)).toString('base64url'));
  const request = new NextRequest('http://localhost:3000/admin', {
    headers: { cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') },
  });
  const response = await proxy(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.ok(response.cookies.getAll().some((cookie) => cookie.name.startsWith(base) && cookie.value));
  const refreshed = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
      getAll: () => request.cookies.getAll(), setAll() {},
    } });
  assert.equal(ok(await refreshed.auth.getUser()).user.id, users[0]);
  if (process.argv.includes('--admin-http')) {
    const baseUrl = 'http://127.0.0.1:3000';
    const cookie = request.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
    const anonymous = await fetch(baseUrl + '/admin', { redirect: 'manual' });
    assert.equal(anonymous.status, 307);
    assert.ok(anonymous.headers.get('location').includes('/auth/sign-in'));
    const signedIn = await fetch(`${baseUrl}/admin/${operators[0]}/overview`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(signedIn.status, 200);
    assert.ok((await signedIn.text()).includes('Your operator workspace.'));
    const catalog = await fetch(`${baseUrl}/admin/${operators[0]}/catalog`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(catalog.status, 200);
    assert.ok((await catalog.text()).replace(/<!--.*?-->/g, '').includes('Create product'));
    const departures = await fetch(`${baseUrl}/admin/${operators[0]}/departures`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(departures.status, 200);
    assert.ok((await departures.text()).includes('Create departure'));
    const foreign = await fetch(`${baseUrl}/admin/${operators[1]}/overview`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(foreign.status, 307);
    assert.ok(foreign.headers.get('location').includes('error=access'));
    ok(await admin.from('staff_profiles').update({ role: 'content_editor' }).eq('auth_user_id', users[0]).eq('operator_id', operators[0]));
    const forbidden = await fetch(`${baseUrl}/admin/${operators[0]}/bookings`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(forbidden.status, 307);
    const content = await fetch(`${baseUrl}/admin/${operators[0]}/content`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(content.status, 200);
    assert.ok((await content.text()).includes('Create content page'));
    console.log('PASS: actual HTTP admin routes enforce sign-in, operator isolation and role access');
  }
  console.log('PASS: actual Next proxy refreshes stale SSR session cookies and forwards verified identity');
  const invalid = new NextRequest('http://localhost:3000/admin', { headers: { cookie: `${base}=base64-invalid` } });
  const invalidResponse = await proxy(invalid);
  assert.equal(invalidResponse.headers.get('cache-control'), 'private, no-store');
  const invalidClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
      getAll: () => invalid.cookies.getAll(), setAll() {},
    } });
  assert.equal((await invalidClient.auth.getUser()).data.user, null);
  console.log('PASS: malformed SSR cookie grants no verified identity');
  stored.refresh_token = randomUUID();
  const unrefreshable = new NextRequest('http://localhost:3000/admin', { headers: {
    cookie: `${base}=base64-${Buffer.from(JSON.stringify(stored)).toString('base64url')}`,
  } });
  const expiredResponse = await proxy(unrefreshable);
  assert.equal(expiredResponse.headers.get('cache-control'), 'private, no-store');
  assert.ok(expiredResponse.cookies.getAll().some((cookie) => cookie.name.startsWith(base) && cookie.value === ''));
  const expiredClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
      getAll: () => unrefreshable.cookies.getAll(), setAll() {},
    } });
  assert.equal((await expiredClient.auth.getUser()).data.user, null);
  console.log('PASS: stale session with rejected refresh token is cleared and grants no identity');
  ok(await admin.from('staff_profiles').update({ role: 'content_editor' }).eq('auth_user_id', users[0]).eq('operator_id', operators[0]));
  assert.deepEqual(ok(await sessions[0].from('staff_profiles').select('role')), [{ role: 'content_editor' }]);
  const rpc = await sessions[0].rpc('record_domain_activity', {
    p_operator_id: operators[0], p_actor_id: null, p_idempotency_key: run,
    p_entity_type: 'operator', p_entity_id: operators[0], p_event_type: 'test.denied',
    p_payload: {}, p_action: 'test.denied', p_metadata: {},
  });
  assert.equal(rpc.error?.code, '42501');
  console.log('PASS: role change visible to existing session; protected RPC execution denied');
  ok(await admin.from('staff_profiles').update({ is_active: false }).eq('auth_user_id', users[0]).eq('operator_id', operators[0]));
  assert.deepEqual(ok(await sessions[0].from('operators').select('id')), []);
  console.log('PASS: membership deactivation blocks existing session immediately');
  const anonymous = client();
  const denied = await anonymous.from('operators').select('id');
  assert.ok(denied.error || denied.data.length === 0);
  console.log('PASS: anonymous tenant access blocked');
  // Immutable audit history is intentionally retained under a dedicated synthetic operator.
  const auditOperator = '20000000-0000-4000-8000-000000000001';
  ok(await admin.from('operators').upsert({ id: auditOperator, name: 'Development integration audit fixture' }, { onConflict: 'id', ignoreDuplicates: true }));
  const activity = {
    p_operator_id: auditOperator, p_actor_id: null, p_idempotency_key: 'foundation-platform-verification-v1',
    p_entity_type: 'operator', p_entity_id: auditOperator, p_event_type: 'development.foundation_verified',
    p_payload: { synthetic: true }, p_action: 'development.foundation_verified', p_metadata: { synthetic: true },
  };
  const recorded = ok(await admin.rpc('record_domain_activity', activity));
  assert.equal(recorded.length, 1);
  assert.ok(recorded[0].event_id && recorded[0].audit_id);
  assert.deepEqual(ok(await admin.rpc('record_domain_activity', activity)), recorded);
  console.log('PASS: privileged hosted RPC persists an idempotent event/audit pair (synthetic history retained)');
} finally {
  for (const session of sessions) await session.auth.signOut().catch(() => {});
  // Delete only exact IDs generated by this invocation, in dependency order.
  for (const operator of operators) {
    for (const table of ['staff_profiles', 'operators']) {
      const result = await admin.from(table).delete().eq(table === 'operators' ? 'id' : 'operator_id', operator);
      if (result.error) cleanupFailed = true;
    }
  }
  for (const user of users) {
    const result = await admin.auth.admin.deleteUser(user);
    if (result.error) cleanupFailed = true;
  }
  if (cleanupFailed) throw new Error(`Cleanup incomplete for integration run ${run}; inspect its synthetic records`);
  console.log('PASS: temporary staff, operators and Auth users removed; dedicated audit fixture retained');
}
