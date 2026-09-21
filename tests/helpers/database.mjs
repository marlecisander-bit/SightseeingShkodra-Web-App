import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Test-only substitutes for platform objects. Never run against hosted Supabase.
export const platformSql = `create schema auth; create table auth.users (id uuid primary key);
  create role anon nologin; create role authenticated nologin;
  create role service_role nologin bypassrls;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated;`;

export async function applyMigrations(exec) {
  const dir = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    await exec(await readFile(new URL(file, dir), 'utf8'));
  }
}

export async function createTestDatabase() {
  const db = new PGlite();
  try {
    await db.exec(platformSql);
    await applyMigrations((sql) => db.exec(sql));
    return db;
  } catch (error) { await db.close(); throw error; }
}

export async function loadDevelopmentFixtures(db) {
  await db.exec("set app.fixture_mode = 'development'");
  try {
    await db.exec(await readFile(new URL('../../supabase/fixtures/development.sql', import.meta.url), 'utf8'));
  } finally {
    await db.exec('rollback; reset app.fixture_mode');
  }
}
