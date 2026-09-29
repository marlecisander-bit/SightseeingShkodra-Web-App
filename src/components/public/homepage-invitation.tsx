"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { homepageVisible, type WebsiteContent } from "@/modules/content/website-schema";

// The footer is shared. Only its homepage marketing invitation is optional.
export function HomepageInvitation({ content, homepagePreview, children }: { content: WebsiteContent; homepagePreview?: boolean; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/book" || pathname.startsWith("/booking/")) return null;
  if ((homepagePreview ?? pathname === "/") && !homepageVisible(content, "final")) return null;
  return <div className="p-footer-cta">{children}</div>;
}
