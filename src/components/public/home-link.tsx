"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** Next navigation handles other pages; same-page logo clicks explicitly return to top. */
export function HomeLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return <Link {...props} href="/" onClick={event => {
    props.onClick?.(event);
    if (event.defaultPrevented || pathname !== "/" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", "/");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({top:0,behavior:"instant"});
  }} />;
}
