"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { invitationVisible, type WebsiteContent } from "@/modules/content/website-schema";

// One boundary owns the invitation markup and its media on every public route.
export function FinalInvitation({ content, previewPathname, excludeHomepage = false, children }: { content: WebsiteContent; previewPathname?: string; excludeHomepage?:boolean; children: ReactNode }) {
  const pathname = usePathname();
  if (excludeHomepage && (previewPathname ?? pathname) === "/") return null;
  if (!invitationVisible(content, previewPathname ?? pathname)) return null;
  return <>{children}</>;
}
