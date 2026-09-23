// Read-only local HTML crawl. Does not submit bookings or fetch external sites.
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:3000";
const queue = ["/", "/tour", "/explore", "/live", "/your-day", "/credits"];
const pages = new Map(), links = [], failures = [];
const decode = value => value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"');
while (queue.length && pages.size < 50) {
  const path = queue.shift();
  if (pages.has(path)) continue;
  const response = await fetch(origin + path, {signal: AbortSignal.timeout(30000)});
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => decode(m[1])));
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1];
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m=>decode(m[1]));
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const match of jsonLd) { try { JSON.parse(match[1]); } catch { failures.push(`${path}: invalid JSON-LD`); } }
  if (response.status !== 200 || !title || !robots?.includes("noindex")) failures.push(`${path}: status/title/noindex check failed`);
  if (canonicals.length > 1) failures.push(`${path}: duplicate canonical`);
  pages.set(path, {status:response.status,title,robots,canonicals,jsonLd:jsonLd.length,ids});
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const url = new URL(decode(match[1]), origin + path);
    if (url.origin !== origin || /^(\/admin|\/auth|\/api|\/dev)(\/|$)/.test(url.pathname)) continue;
    links.push({from:path,path:url.pathname,hash:decodeURIComponent(url.hash.slice(1))});
    if (!pages.has(url.pathname) && !queue.includes(url.pathname)) queue.push(url.pathname);
  }
}
for (const link of links) {
  const target = pages.get(link.path);
  if (!target || target.status !== 200 || (link.hash && !target.ids.has(link.hash))) failures.push(`${link.from} -> ${link.path}${link.hash ? '#' + link.hash : ''}: broken target`);
}
const robots = await (await fetch(origin + "/robots.txt")).text();
if (!/Disallow:\s*\//.test(robots)) failures.push("robots.txt must disallow local indexing");
const sitemapResponse = await fetch(origin + "/sitemap.xml");
const sitemap = await sitemapResponse.text();
if (sitemapResponse.status !== 200 || /<loc>/.test(sitemap)) failures.push("local sitemap should be empty");
const missing = await fetch(origin + "/phase7-audit-missing-page");
if (missing.status !== 404) failures.push("unknown page does not return 404");
console.log(JSON.stringify({pages:[...pages].map(([path,data])=>({path,...data,ids:undefined})),internalLinks:links.length,failures},null,2));
assert.equal(failures.length,0,"Local crawl found defects");
