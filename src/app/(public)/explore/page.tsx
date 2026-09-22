import { BookButton } from "@/components/public/booking";
import { Media, PreviewNote } from "@/components/public/ui";
import { destinations } from "@/modules/public-preview/contracts";
export default function Explore() {
  return (
    <main id="main-content" className="p-subpage p-container">
      <p className="p-eyebrow">THE LOCAL NOTEBOOK</p>
      <h1>Closer to Shkodra.</h1>
      <p className="p-lead">A city to wander. A landscape to linger in.</p>
      <PreviewNote />
      {destinations.map((place) => (
        <article className="p-guide-story" id={place.id} key={place.id}>
          <Media src={place.image} alt={place.alt} />
          <div>
            <p className="p-eyebrow">{place.tag}</p>
            <h2>{place.name}</h2>
            <p className="p-lead">{place.text}</p>
            <p>{place.detail}</p>
            <p className="p-preview">Full visitor guide coming soon.</p>
            <BookButton>Plan your day</BookButton>
          </div>
        </article>
      ))}
    </main>
  );
}
