import test from 'node:test';
import assert from 'node:assert/strict';
import {websiteMetadata} from '../../src/modules/content/seo.ts';
import {globalEditorSections,initialWebsiteContent,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
test('homepage sharing follows the hero and retains historical social fields without conflicting controls',()=>{
 const c={...initialWebsiteContent,'hero.desktop':'/images/hero.webp','hero.alt':'Current hero','seo.image':'/images/old.webp','seo.alt':'Old social image'};
 const m=websiteMetadata(c);
 assert.ok(m.openGraph.images[0].url.endsWith(c['hero.desktop']));
 assert.equal(m.openGraph.images[0].alt,c['hero.alt']);
 assert.deepEqual(m.twitter.images,m.openGraph.images);
 assert.equal(m.twitter.card,'summary_large_image');
 assert.ok(!globalEditorSections.flatMap(s=>s.fields).some(f=>['seo.image','seo.alt'].includes(f.key)));
 assert.equal(validateWebsiteContent(c)['seo.image'],c['seo.image']);
});
