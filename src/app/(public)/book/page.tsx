import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/booking";
export const metadata: Metadata = {
  title: "Book your day | Sightseeing Shkodra",
};

export default function Book() {
  return (
    <main id="main-content" className="p-subpage p-container p-book-page">
      <p className="p-eyebrow">THE SHKODRA DAY TOUR</p>
      <h1>A good day starts here.</h1>
      <BookingFlow />
    </main>
  );
}
