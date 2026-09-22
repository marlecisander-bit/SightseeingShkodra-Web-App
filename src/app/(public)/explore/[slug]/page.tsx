import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomepage } from "@/modules/content/homepage-server";
import { destinations } from "@/modules/public-preview/contracts";
import {
  pageMetadata,
  guideStructuredData,
  safeJsonLd,
  seoConfig,
} from "@/modules/content/seo";
import { Media, ActionLink } from "@/components/public/ui";
type Props = { params: Promise<{ slug: string }> };
async function guide(slug: string) {
  const place = destinations.find((entry) => entry.id === slug);
  if (!place) notFound();
  const home = await getHomepage();
  if (home.state === "unavailable" || home.state === "unconfigured")
    throw new Error("Guides are temporarily unavailable");
  const content = home.content[`explore-${slug}`];
  if (!content) notFound();
  return { place, content };
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { content } = await guide(slug);
  return pageMetadata(
    `/explore/${slug}`,
    content.metaTitle ?? `${content.title} | Sightseeing Shkodra`,
    content.metaDescription ?? content.text.slice(0, 160),
  );
}
export default async function Guide({ params }: Props) {
  const { slug } = await params;
  const { place, content } = await guide(slug);
  const { origin } = seoConfig();
  return (
    <main id="main-content" className="p-subpage p-container">
      <nav aria-label="Breadcrumb">
        <Link className="p-text-link" href="/explore">
          Explore Shkodra
        </Link>
      </nav>
      <article>
        <p className="p-eyebrow">THE LOCAL NOTEBOOK</p>
        <h1>{content.title}</h1>
        <Media src={place.image} alt={place.alt} hero />
        <div className="p-section p-narrow p-guide-body">
          {content.text.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
      <ActionLink href="/tour">View the day tour</ActionLink>
      {origin && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              guideStructuredData(
                origin,
                slug,
                content.title,
                content.metaDescription ?? content.text.slice(0, 160),
              ),
            ),
          }}
        />
      )}
    </main>
  );
}
