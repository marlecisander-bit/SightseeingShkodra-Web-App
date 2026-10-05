import type { Metadata } from "next";
import "./globals.css";
import "./brand-tokens.css";
import "./widget-controls.css";
import "./button-system.css";

export const metadata: Metadata = {
  title: "Sightseeing Shkodra",
  description: "Explore Shkodra. A new travel experience is on its way.",
  robots: { index: false, follow: false },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{url:'/favicon.ico',sizes:'16x16 32x32 48x48'}, {url:'/icons/site-icon.svg',type:'image/svg+xml',sizes:'any'}, {url:'/icons/site-icon-32.png',type:'image/png',sizes:'32x32'}],
    apple: [{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
