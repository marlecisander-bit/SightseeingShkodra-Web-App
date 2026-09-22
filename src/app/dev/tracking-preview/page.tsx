import { notFound } from "next/navigation";
import Preview from "./preview";
export const dynamic = "force-dynamic";
export default function TrackingPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main style={{ maxWidth: 1000, margin: "2rem auto", padding: "1rem" }}>
    <h1>Shared map preview</h1>
    <p>Fictional vehicles for local testing only. This is not live tracking and does not access the database.</p>
    <Preview />
  </main>;
}
