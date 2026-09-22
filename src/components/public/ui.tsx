import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import type { ComponentProps, ReactNode } from "react";

export function ActionLink({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={`p-button ${className}`} {...props}>
      {children}
      <span aria-hidden="true">↗</span>
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
}: {
  src: string;
  alt: string;
  hero?: boolean;
  className?: string;
}) {
  return (
    <div className={`p-media ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={hero ? "100vw" : "(max-width: 700px) 100vw, 50vw"}
        preload={hero}
        style={{ objectFit: "cover" }}
      />
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
    <p className="p-preview">Website preview · Bookings are not open yet.</p>
  );
}
export function Footer() {
  return (
    <footer className="p-footer">
      <div>
        <Link className="p-wordmark" href="/">
          <BrandLogo />
        </Link>
        <p>
          A little closer to the place.
          <br />A little more of your own pace.
        </p>
      </div>
      <nav aria-label="Footer">
        <Link href="/tour">The day tour</Link>
        <Link href="/live">Live map</Link>
        <Link href="/explore">Explore Shkodra</Link>
        <Link href="/tour#faq">Questions & answers</Link>
        <Link href="/credits">Photography credits</Link>
        <Link href="/admin">Staff sign-in</Link>
      </nav>
      <div className="p-footer-bottom">
        <span>Shkodër, Albania</span>
        <span>English · More languages coming soon</span>
        <span>Contact and legal information before launch</span>
      </div>
    </footer>
  );
}
