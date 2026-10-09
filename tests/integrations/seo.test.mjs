import assert from "node:assert/strict";
import { test } from "node:test";
import {
  seoConfig,
  guideStructuredData,
  safeJsonLd,
  tourStructuredData,
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
  ])
    assert.equal(seoConfig({ ...enabled, ...override }).index, false);
});
test("sitemap publication is independent of operational availability and excludes unpublished pages", () => {
  const published = { published: true, content: {} };
  assert.deepEqual(publishedSitemapPaths(published, true, []), ['/', '/route', '/explore', '/faq', '/tour', '/book']);
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

test("tour schema uses actual product without invented offers or ratings", () => {
  const graph = tourStructuredData('https://sightseeingshkodra.app', { title: 'Published tour', description: 'Published details' });
  assert.equal(graph['@graph'][1].name, 'Published tour');
  assert.equal(graph['@graph'][1]['@type'], 'TouristTrip');
  assert.ok(!JSON.stringify(graph).includes('offers'));
  assert.ok(!JSON.stringify(graph).includes('aggregateRating'));
});
