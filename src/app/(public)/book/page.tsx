import { BookingFlow } from "@/components/public/booking";
export default function Book() {
  return (
    <main id="main-content" className="p-subpage p-container p-book-page">
      <p className="p-eyebrow">THE SHKODRA DAY TOUR</p>
      <h1>A good day starts here.</h1>
      <BookingFlow />
    </main>
  );
}
