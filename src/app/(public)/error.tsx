"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicError({ retry }: { retry: () => void }) {
  return <main id="main-content" className="p-subpage p-container">
    <h1>This page is temporarily unavailable</h1>
    <p role="alert">We couldn’t load the information for this page. Please try again.</p>
    <div className="p-button-group">
      <Button onClick={() => retry()}>Try again</Button>
      <Link href="/">Return to homepage</Link>
    </div>
  </main>;
}
