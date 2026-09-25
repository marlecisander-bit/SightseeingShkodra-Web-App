import type { Metadata } from "next";
import type { Homepage } from "./homepage";
export function seoConfig(env = process.env) {
  let origin: string | null = null;
  try {
    const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    )
      origin = url.origin;
  } catch {}
  const productionOrigin =
    origin &&
    origin.startsWith("https://") &&
    !/localhost|127\.0\.0\.1|\[::1\]/i.test(origin);
  return {
    origin,
    index: Boolean(
      productionOrigin &&
        env.APP_ENV === "production" &&
        env.SITE_INDEXING_ENABLED === "true",
    ),
  };
}
export function pageMetadata(
  path: string,
  title: string,
  description: string,
  published = true,
): Metadata {
  const config = seoConfig();
  const url = config.origin ? `${config.origin}${path}` : undefined;
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: {
      index: config.index && published,
      follow: config.index && published,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Sightseeing Shkodra",
      type: "website",
    },
  };
}
export const guideSlugs = ["centre", "castle", "lake", "bridge"] as const;
export function publishedGuideSlugs(home: Homepage) {
  return guideSlugs.filter((slug) => home.content[`explore-${slug}`]);
}
export function sitemapPaths(home: Homepage) {
  const guides = publishedGuideSlugs(home);
  return [
    ...(home.product || home.content["homepage-hero"] ? ["/"] : []),
    ...(home.product ? ["/tour"] : []),
    ...(guides.length
      ? ["/explore", ...guides.map((slug) => `/explore/${slug}`)]
      : []),
  ];
}
export function guideStructuredData(
  origin: string,
  slug: string,
  title: string,
  description: string,
) {
  const url = `${origin}/explore/${slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: title,
        description,
        inLanguage: "en",
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${origin}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Explore Shkodra",
            item: `${origin}/explore`,
          },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  };
}
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function websiteMetadata(c:Record<string,string>,published=true){const metadata=pageMetadata("/",c["seo.title"],c["seo.description"],published);return {...metadata,title:c["seo.title"],openGraph:{...metadata.openGraph,images:[{url:c["seo.image"],alt:c["seo.alt"]}]}};}
