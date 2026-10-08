import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';
import { initialWebsiteContent, validateWebsiteContent, homepageVisibilitySections, homepageVisible } from '../../src/modules/content/website-schema.ts';

let db, actor;
const op = '10000000-0000-4000-8000-000000000001';
before(async () => {
  db = await createTestDatabase(); await loadDevelopmentFixtures(db);
  const uid = (await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  actor = (await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id", [op, uid])).rows[0].id;
});
after(async () => db?.close());
async function record() { return (await db.query("select * from content_pages where operator_id=$1 and slug='website-homepage'", [op])).rows[0]; }
async function save(content, operation) {
  return db.query('select save_website_content_v1($1,$2,$3,$4,$5)', [op, actor, JSON.stringify(content), (await record())?.updated_at ?? null, operation]);
}
test('legacy content defaults visible without rewriting existing values', async () => {
  const legacy = { ...initialWebsiteContent };
  for (const id of homepageVisibilitySections) delete legacy[`${id}.showOnHomepage`];
  assert.equal((await db.query('select validate_website_content_v1($1) valid', [JSON.stringify(legacy)])).rows[0].valid, true);
  const normalized = validateWebsiteContent(legacy);
  for (const id of homepageVisibilitySections) assert.equal(homepageVisible(normalized, id), true);
  for (const [key, value] of Object.entries(legacy)) assert.equal(normalized[key], value);
  await save(legacy, 'initialize');
  assert.deepEqual((await record()).body.content, legacy);
});
test('draft visibility is isolated; publish hides multiple sections; restore preserves all content', async () => {
  const before = await record();
  const content = validateWebsiteContent(before.body.content);
  for (const id of ['hero', 'notebook', 'final']) content[`${id}.showOnHomepage`] = 'false';
  await save(content, 'draft');
  let row = await record();
  assert.deepEqual(row.published_body, before.published_body);
  assert.equal(row.status, 'published');
  for (const id of ['hero', 'notebook', 'final']) assert.equal(homepageVisible(row.body.content, id), false);
  await save(content, 'publish');
  row = await record();
  assert.deepEqual(row.published_body.content, content);
  for (const id of homepageVisibilitySections) content[`${id}.showOnHomepage`] = 'true';
  await save(content, 'publish');
  row = await record();
  assert.deepEqual(row.body.content, validateWebsiteContent(before.body.content));
  assert.deepEqual(row.published_body.content, row.body.content);
});
test('visibility rejects invalid types/keys and retains optimistic concurrency and permission checks', async () => {
  for (const value of [false, null, 'off', '']) {
    const content = { ...initialWebsiteContent, 'hero.showOnHomepage': value };
    assert.throws(() => validateWebsiteContent(content));
    assert.equal((await db.query('select validate_website_content_v1($1) valid', [JSON.stringify(content)])).rows[0].valid, false);
  }
  assert.throws(() => validateWebsiteContent({ ...initialWebsiteContent, 'footer.showOnHomepage': 'false' }));
  await assert.rejects(db.query('select save_website_content_v1($1,$2,$3,$4,$5)', [op, actor, JSON.stringify(initialWebsiteContent), '2000-01-01', 'publish']), /Content changed/);
  await assert.rejects(db.query('select save_website_content_v1($1,$2,$3,$4,$5)', [op, '00000000-0000-4000-8000-000000000000', JSON.stringify(initialWebsiteContent), (await record()).updated_at, 'publish']), /permission/i);
});
