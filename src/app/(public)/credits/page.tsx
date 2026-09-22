import type { Metadata } from "next";
import credits from "../../../../public/images/credits.json";
export const metadata: Metadata = {
  title: "Photography credits | Sightseeing Shkodra",
};

export default function Credits() {
  return (
    <main id="main-content" className="p-subpage p-container p-narrow">
      <p className="p-eyebrow">WITH THANKS</p>
      <h1>Photography credits.</h1>
      <p>
        Authentic photographs of Shkodra, shared by their creators on Wikimedia
        Commons. No endorsement is implied.
      </p>
      {credits.map((photo) => (
        <section className="p-credit" key={photo.id}>
          <h2>{photo.title}</h2>
          <p>
            Photograph by {photo.author}.{" "}
            <a href={photo.source}>Original photograph</a> ·{" "}
            <a href={photo.licenseUrl}>{photo.license}</a>
          </p>
          <p>{photo.changes}</p>
        </section>
      ))}
    </main>
  );
}
