import assert from "node:assert/strict";
import { test } from "node:test";
import {
  seoConfig,
  sitemapPaths,
  guideStructuredData,
  safeJsonLd,
} from "../../src/modules/content/seo.ts";
import { emptyHomepage } from "../../src/modules/content/homepage.ts";
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
  for (const override of [
    { APP_ENV: "development" },
    { SITE_INDEXING_ENABLED: "false" },
    { NEXT_PUBLIC_SITE_URL: "http://example.com" },
    { NEXT_PUBLIC_SITE_URL: "https://localhost" },
    { NEXT_PUBLIC_SITE_URL: "https://example.com/path" },
    { NEXT_PUBLIC_SITE_URL: "https://user:pass@example.com" },
    { NEXT_PUBLIC_SITE_URL: "invalid" },
  ])
    assert.equal(seoConfig({ ...enabled, ...override }).index, false);
});
test("sitemap only includes supported published content and removes withdrawn routes", () => {
  const home = emptyHomepage("empty");
  assert.deepEqual(sitemapPaths(home), []);
  home.content["explore-castle"] = { title: "Castle" };
  home.content["unknown-secret"] = { title: "Hidden" };
  assert.deepEqual(sitemapPaths(home), ["/explore", "/explore/castle"]);
  home.product = { id: "product" };
  assert.deepEqual(sitemapPaths(home), [
    "/",
    "/tour",
    "/explore",
    "/explore/castle",
  ]);
  delete home.content["explore-castle"];
  assert.deepEqual(sitemapPaths(home), ["/", "/tour"]);
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
