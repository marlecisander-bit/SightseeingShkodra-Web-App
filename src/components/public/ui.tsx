import { FinalInvitation } from "./final-invitation";
import { ButtonContent } from "@/components/ui/button";
import Image from "next/image";
import { PublicBookingLink as Link } from "./booking";
import { BrandLogo } from "./brand-logo";
import type { ComponentProps, ReactNode } from "react";
import { safeSocialUrl, footerDefaults, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";

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
export function Footer({ content = initialWebsiteContent, previewPathname, googleReviewsUrl = '' }: { content?: WebsiteContent; previewPathname?: string; googleReviewsUrl?:string|null }) {
 const c={...footerDefaults,...content};
 const socials=[['instagram','Instagram',c['footer.social.instagram']],['facebook','Facebook',c['footer.social.facebook']],['getyourguide','GetYourGuide',c['footer.social.getYourGuide']],['tripadvisor','Tripadvisor',c['footer.social.tripadvisor']],['google','Google Reviews',googleReviewsUrl??'']].filter(([, ,url])=>url&&safeSocialUrl(url));
  return (
    <>
      <FinalInvitation content={c} previewPathname={previewPathname}><section className="p-site-footer" aria-label="Final booking invitation">
      <Media src={c["final.image"]} alt={c["final.alt"]} sizes="100vw" />
      <div className="p-footer-cta">
        <p className="p-eyebrow">{c["final.eyebrow"]}</p>
        <h2>{c["final.title"]}<br /><em>{c["final.emphasis"]}</em></h2>
        <ActionLink href="/book" className="p-button-booking">{c["final.book"]}</ActionLink>
        <PreviewNote />
      </div>
      </section></FinalInvitation>
      <footer className="p-global-footer">
       <div className="p-footer-inner">
        <div className="p-footer-main">
         <Link className="p-footer-logo" href="/" aria-label="Sightseeing Shkodra homepage"><BrandLogo /></Link>
         {socials.length>0&&<div className="p-footer-social" aria-label="Social and review platforms">{socials.map(([id,label,url])=><a key={id} href={url} aria-label={label} title={label} target="_blank" rel="noopener noreferrer"><Image src={'/brand/social/'+id+'.svg'} alt="" width={32} height={32} unoptimized className={id==='getyourguide'?'p-social-wide':undefined}/></a>)}</div>}
         <Link className="ss-button p-footer-staff" href="/admin"><ButtonContent>Staff Login</ButtonContent></Link>
        </div>
        <div className="p-footer-info">
         <p><span>© {c['footer.year']} {c['footer.business']}</span><span>VAT: {c['footer.vat']}</span></p>
         <nav aria-label="Legal"><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></nav>
        </div>
       </div>
      </footer>
    </>
  );
}
