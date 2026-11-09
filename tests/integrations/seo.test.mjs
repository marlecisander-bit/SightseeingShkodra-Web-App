import assert from "node:assert/strict";
import { test } from "node:test";
import {
  seoConfig,
  robotsPolicy,
  pageMetadata,
  guideStructuredData,
  safeJsonLd,
} from "../../src/modules/content/seo.ts";
import { publishedSitemapPaths } from "../../src/modules/content/sitemap.ts";
test("indexing requires explicit production gate and a public HTTPS origin", () => {
  const enabled = {
    APP_ENV: "production",
    SITE_INDEXING_ENABLED: "true",
    NEXT_PUBLIC_SITE_URL: "https://example.com/",
  };
  assert.deepEqual(seoConfig(enabled), {
    origin: "https://example.com",
    index: true,
  });
  assert.equal(seoConfig({ ...enabled, VERCEL_ENV: "production" }).index, true);
  for (const override of [
    { APP_ENV: "development" },
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: "development" },
    { SITE_INDEXING_ENABLED: "false" },
    { NEXT_PUBLIC_SITE_URL: "http://example.com" },
    { NEXT_PUBLIC_SITE_URL: "https://localhost" },
    { NEXT_PUBLIC_SITE_URL: "https://example.com/path" },
    { NEXT_PUBLIC_SITE_URL: "https://user:pass@example.com" },
    { NEXT_PUBLIC_SITE_URL: "invalid" },
    { NEXT_PUBLIC_SITE_URL: "https://sightseeingshkodra.app/path" },
    { NEXT_PUBLIC_SITE_URL: "https://user:pass@sightseeingshkodra.com" },
    { NEXT_PUBLIC_SITE_URL: "https://www.sightseeingshkodra.com/?token=invalid" },
  ])
    assert.equal(seoConfig({ ...enabled, ...override }).index, false);
});
test("sitemap publication is independent of operational availability and excludes unpublished pages", () => {
  const published = { published: true, content: {} };
  assert.deepEqual(publishedSitemapPaths(published, true, []), ['/', '/route', '/explore', '/faq', '/book']);
  assert.deepEqual(publishedSitemapPaths({published:false,content:{}}, false, []), []);
  assert.deepEqual(publishedSitemapPaths(published, false, []), ['/', '/route', '/explore', '/faq']);
  const c = {'legal.privacy.status':'published','legal.privacy.text':'Real policy','legal.terms.status':'draft','legal.terms.text':'Draft terms'};
  const paths = publishedSitemapPaths({published:true,content:c}, true, [{slug:'castle',guidePublished:true},{slug:'castle',guidePublished:true},{slug:'private',guidePublished:false}]);
  assert.ok(paths.includes('/privacy-policy'));assert.ok(!paths.includes('/terms-and-conditions'));
  assert.equal(paths.filter(p=>p==='/explore/castle').length,1);assert.ok(!paths.includes('/explore/private'));
  for (const p of ['/credits','/your-day','/booking/manage','/admin','/auth/sign-in','/api/public/checkout','/live']) assert.ok(!paths.includes(p));
});
test("structured data matches page and breadcrumbs and escapes script delimiters", () => {
  const title = "Castle </script><script>alert(1)</script>";
  const data = guideStructuredData(
    "https://example.com",
    "castle",
    title,
    "Published description",
  );
  const encoded = safeJsonLd(data);
  assert.ok(!encoded.includes("<"));
  assert.equal(JSON.parse(encoded)["@graph"][0].name, title);
  assert.equal(
    data["@graph"][1].itemListElement[2].item,
    "https://example.com/explore/castle",
  );
  assert.ok(!encoded.includes("aggregateRating"));
  assert.ok(!encoded.includes('"offers"'));
});

 test("public brand aliases consolidate on www.com without changing customer configuration", () => {
  for (const host of ['sightseeingshkodra.app','www.sightseeingshkodra.app','sightseeingshkodra.com','www.sightseeingshkodra.com']) {
    const env = {APP_ENV:'production', SITE_INDEXING_ENABLED:'true', NEXT_PUBLIC_SITE_URL:`https://${host}`};
    assert.deepEqual(seoConfig(env), {origin:'https://www.sightseeingshkodra.com',index:true});
    assert.equal(env.NEXT_PUBLIC_SITE_URL, `https://${host}`);
    assert.equal(seoConfig({...env,VERCEL_ENV:'preview'}).index,false);
  }
});

test("robots permits public crawling and private noindex inspection only after production gate", () => {
 const config=seoConfig({APP_ENV:'production',SITE_INDEXING_ENABLED:'true',NEXT_PUBLIC_SITE_URL:'https://sightseeingshkodra.app'});
 assert.deepEqual(robotsPolicy(config),{rules:{userAgent:'*',allow:'/'},sitemap:'https://www.sightseeingshkodra.com/sitemap.xml'});
 assert.deepEqual(robotsPolicy({...config,index:false}),{rules:{userAgent:'*',disallow:'/'}});
});

test("page canonical and private response headers agree with crawl policy", async () => {
 const previous={...process.env};
 try {
  Object.assign(process.env,{APP_ENV:'production',SITE_INDEXING_ENABLED:'true',NEXT_PUBLIC_SITE_URL:'https://sightseeingshkodra.app'});
  const metadata=pageMetadata('/route','Tour route','Published tour information');
  assert.equal(metadata.alternates.canonical,'https://www.sightseeingshkodra.com/route');
  assert.deepEqual(metadata.robots,{index:true,follow:true});
  assert.deepEqual(pageMetadata('/explore/draft','Draft','Draft',false).robots,{index:false,follow:false});
 } finally {for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
 const {default:config}=await import('../../next.config.ts');
 const rules=await config.headers();
 for(const path of ['/admin/:path*','/auth/:path*','/api/:path*','/booking/:path*','/dev/:path*','/your-day','/credits']) {
  assert.ok(rules.some(rule=>rule.source===path&&rule.headers.some(header=>header.key==='X-Robots-Tag'&&header.value==='noindex, nofollow')));
 }
 assert.ok(!rules.some(rule=>rule.source==='/:path*'));
});
