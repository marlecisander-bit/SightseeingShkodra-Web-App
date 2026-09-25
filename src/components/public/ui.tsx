import { ButtonContent } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import type { ComponentProps, ReactNode } from "react";
import { resolveWebsiteLink, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";

export function ActionLink({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={`p-button ${className}`} {...props}>
      <ButtonContent>{children}</ButtonContent>
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="p-section-heading">
      <div>
        <p className="p-eyebrow">{eyebrow}</p>
        <h2>{title.replaceAll("\\n", "\n")}</h2>
      </div>
      {children && <div className="p-heading-copy">{children}</div>}
    </div>
  );
}
export function Media({
  src,
  alt,
  hero = false,
  className = "",
  mobileSrc,
  sizes,
}: {
  src: string;
  alt: string;
  hero?: boolean;
  className?: string;
  mobileSrc?: string;
  sizes?: string;
}) {
  return (
    <div className={`p-media ${className}`}>
      {mobileSrc ? (
        <picture>
          <source media="(max-width: 700px)" srcSet={mobileSrc} />
          {/* Uploaded images retain their original quality; picture selects one source. */}
          <img src={src} alt={alt} fetchPriority={hero ? "high" : "auto"} loading={hero ? "eager" : "lazy"} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </picture>
      ) : (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? (hero ? "100vw" : "(max-width: 700px) 100vw, 50vw")}
        preload={hero}
        unoptimized={src.startsWith("https://")}
        style={{ objectFit: "cover" }}
      />
      )}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="p-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function PreviewNote() {
  return (
    <p className="p-preview">Reserve online. Pay at the meeting point.</p>
  );
}
export function Footer({ content: c = initialWebsiteContent }: { content?: WebsiteContent }) {
  return (
    <footer className="p-site-footer">
      <Media src={c["final.image"]} alt={c["final.alt"]} sizes="100vw" />
      <div className="p-footer-cta">
        <p className="p-eyebrow">{c["final.eyebrow"]}</p>
        <h2>{c["final.title"]}<br /><em>{c["final.emphasis"]}</em></h2>
        <ActionLink href="/book" className="p-button-booking">{c["final.book"]}</ActionLink>
        <PreviewNote />
      </div>
      <div className="p-footer-info">
      <div>
        <Link className="p-wordmark" href="/">
          <BrandLogo />
        </Link>
        <p>
          {c["footer.line1"]}
          <br />{c["footer.line2"]}
        </p>
      </div>
      <nav aria-label="Footer">
        {[0, 1, 2, 3, 4, 5].map(i => <Link key={i} href={resolveWebsiteLink(c[`footer.${i}.link`])}>{c[`footer.${i}.label`]}</Link>)}
      </nav>
      <div className="p-footer-bottom">
        <span>{c["footer.location"]}</span>
        <span>{c["footer.language"]}</span>
        <span>{c["footer.contact"]}</span>
      </div>
      </div>
    </footer>
  );
}
