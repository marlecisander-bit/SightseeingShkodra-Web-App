import { BookingProvider, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "./public.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site">
      <BookingProvider>
        <a className="p-skip" href="#main-content">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </BookingProvider>
    </div>
  );
}
