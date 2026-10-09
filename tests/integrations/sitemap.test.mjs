import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveSitemap } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data.js';
import { loadPublishedSitemapPaths } from '../../src/modules/content/sitemap-server.ts';
import { pageMetadata } from '../../src/modules/content/seo.ts';
const sources = {
  website: async () => ({published:true,content:{}}),
  product: async () => true,
  destinations: async () => ['bridge','castle','centre','lake'].map(slug=>({slug,guidePublished:true})),
};
test('published catalog/content produce nonempty Next.js XML consistent with canonical metadata', async () => {
  const old = {...process.env};
  Object.assign(process.env,{APP_ENV:'production',VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'true',NEXT_PUBLIC_SITE_URL:'https://sightseeingshkodra.app'});
  try {
    const paths = await loadPublishedSitemapPaths(sources);
    assert.equal(paths.length,10);
    const urls = paths.map(path => ({url:pageMetadata(path,'Published page','Description').alternates.canonical}));
    for(const path of paths)assert.equal(pageMetadata(path,'Title','Description').robots.index,true);
    const xml = resolveSitemap(urls);
    assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
    assert.equal((xml.match(/<loc>/g)||[]).length,10);
    assert.ok(!xml.includes('localhost'));
    fs.writeFileSync('/private/tmp/ss-generated-sitemap.xml',xml);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in old)) delete process.env[key];
    Object.assign(process.env,old);
  }
});
test('dependency failures are not converted to an empty successful sitemap or stale publication',async()=>{
  for(const key of ['website','product','destinations'])await assert.rejects(loadPublishedSitemapPaths({...sources,[key]:async()=>{throw Error('temporary outage');}}),/temporary outage/);
  await assert.rejects(loadPublishedSitemapPaths({...sources,website:async()=>({published:false,unavailable:true,content:{}})}),/temporarily unavailable/);
  assert.deepEqual(await loadPublishedSitemapPaths({website:async()=>({published:false,content:{}}),product:async()=>false,destinations:async()=>[]}),[]);
});
