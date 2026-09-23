import { BookingProvider, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "./public.css";
import { getPublishedWebsite } from "@/modules/content/website-server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getPublishedWebsite();
  return (
    <div className="public-site">
      <BookingProvider>
        <a className="p-skip" href="#main-content">
          Skip to content
        </a>
        <Header content={content} />
        {children}
        <Footer content={content} />
      </BookingProvider>
    </div>
  );
}
