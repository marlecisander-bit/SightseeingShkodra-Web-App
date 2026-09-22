import { BookButton } from "@/components/public/booking";
import { Media, PreviewNote, ActionLink } from "@/components/public/ui";
import { destinations } from "@/modules/public-preview/contracts";
import { getHomepage } from "@/modules/content/homepage-server";
import { pageMetadata, publishedGuideSlugs } from "@/modules/content/seo";
export async function generateMetadata() {
  const home = await getHomepage();
  return pageMetadata(
    "/explore",
    "Explore Shkodra | Sightseeing Shkodra",
    "Published local guides to Shkodra, its castle, lake and surrounding places.",
    publishedGuideSlugs(home).length > 0,
  );
}
export default async function Explore() {
  const home = await getHomepage();
  return (
    <main id="main-content" className="p-subpage p-container">
      <p className="p-eyebrow">THE LOCAL NOTEBOOK</p>
      <h1>Closer to Shkodra.</h1>
      <p className="p-lead">A city to wander. A landscape to linger in.</p>
      <PreviewNote />
      {home.state === "unavailable" && (
        <p role="alert">
          Guides are temporarily unavailable. Please try again shortly.
        </p>
      )}
      {destinations.map((place) => {
        const content = home.content[`explore-${place.id}`];
        return (
          <article className="p-guide-story" id={place.id} key={place.id}>
            <Media src={place.image} alt={place.alt} />
            <div>
              <p className="p-eyebrow">{place.tag}</p>
              <h2>{content?.title ?? place.name}</h2>
              <p className="p-lead">
                {content
                  ? content.text.slice(0, 240) +
                    (content.text.length > 240 ? "…" : "")
                  : place.text}
              </p>
              {content ? (
                <ActionLink href={`/explore/${place.id}`}>
                  Read the guide
                </ActionLink>
              ) : (
                <>
                  <p>{place.detail}</p>
                  <p className="p-preview">Full visitor guide coming soon.</p>
                </>
              )}
              <BookButton>Plan your day</BookButton>
            </div>
          </article>
        );
      })}
    </main>
  );
}
