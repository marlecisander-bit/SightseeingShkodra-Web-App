import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sightseeing Shkodra",
  description: "Explore Shkodra. A new travel experience is on its way.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
