import type { WebsiteContent } from '@/modules/content/website-schema';
import { ActionLink } from './ui';

/** Existing FAQ content has one consumer and keeps its original CMS keys. */
export function FaqPage({ content:c, inclusions }: { content:WebsiteContent; inclusions:string|null }) {
 return <main id="main-content" className="p-subpage p-container p-narrow">
 <section id="faq" className="p-faq"><h1>{c['tourPage.faqTitle']}</h1><details><summary>{c['tourPage.faqBook']}</summary><p>Choose a date on the booking page to check available seats. Confirm online and pay at the meeting point.</p><ActionLink href="/book">{c['nav.book']}</ActionLink></details><details><summary>{c['tourPage.faqBoard']}</summary><p>Use the live map for the current boarding points and route.</p><ActionLink href="/route">{c['live.linkLabel']}</ActionLink></details><details><summary>{c['tourPage.faqFees']}</summary><p>{inclusions??'Ticket inclusions have not been published. Please confirm the details with staff.'}</p></details><details><summary>{c['tourPage.faqLive']}</summary><p>Open the live map for the latest reported location, GPS status and available arrival estimates.</p><ActionLink href="/route">{c['live.linkLabel']}</ActionLink></details></section>
 </main>;
}
