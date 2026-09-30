import type { ReactNode } from "react";
import { AmenityIcon } from "@/components/ui/amenity-icon";
import type { AmenityIconName } from "@/modules/content/hero-amenities";
import styles from "./website-editor.module.css";

const extraIcons = {
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
  book: "M12 5v16 M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2",
  footer: "M3 3h18v18H3Z M3 16h18",
  document: "M5 3h10l4 4v14H5Z M14 3v5h5 M8 12h8 M8 16h8",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6",
} as const;
type Icon = AmenityIconName | keyof typeof extraIcons;
export const sectionCardMetadata: Record<string, {icon:Icon; description:string; scope?:string}> = {
  hero:{icon:"camera",description:"Headline, desktop/mobile photographs and booking links"},
  intro:{icon:"ticket",description:"Tour introduction and day-planning labels"},
  route:{icon:"pin",description:"Heading and introduction above shared destinations"},
  live:{icon:"van",description:"Live Map introduction and van-finding link"},
  departures:{icon:"clock",description:"Timetable heading and departure-information link"},
  reviews:{icon:"star",description:"Guest-review section heading and introduction"},
  notebook:{icon:"book",description:"Local inspiration heading and destination-card link labels"},
  final:{icon:"ticket",description:"Closing booking invitation, banner and button label"},
  navigation:{icon:"map",description:"Shared website navigation labels and links",scope:"Global"},
  footer:{icon:"footer",description:"Social links, business details and copyright",scope:"Global"},
  seo:{icon:"search",description:"Homepage search title, description and social image",scope:"Homepage search & sharing"},
  legalprivacy:{icon:"document",description:"Privacy policy text and publication status",scope:"Privacy Policy page"},
  legalterms:{icon:"document",description:"Terms and conditions text and publication status",scope:"Terms & Conditions page"},
  tourPage:{icon:"ticket",description:"Tour page introduction and information",scope:"Tour page"},
  explorePage:{icon:"pin",description:"Destination listing introduction",scope:"Explore page"},
  bookPage:{icon:"ticket",description:"Booking page introduction",scope:"Booking page"},
  dayPage:{icon:"clock",description:"Your day page introduction",scope:"Your day page"},
  how:{icon:"map",description:"Three steps explaining the tour experience",scope:"Tour page"},
};

function SectionIcon({name}:{name:Icon}) {
  if (!(name in extraIcons)) return <AmenityIcon name={name as AmenityIconName}/>;
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={extraIcons[name as keyof typeof extraIcons]}/></svg>;
}

/** Shared presentation; the workspace retains selection, visibility and save ownership. */
export function SectionCardHeader({id,title,index,open,draft,visibility,onEdit}:{id:string;title:string;index:number;open:boolean;draft?:string;visibility?:ReactNode;onEdit:()=>void}) {
  const metadata=sectionCardMetadata[id];
  return <span className={styles.sectionHeading}>
    <span className={styles.number}>{String(index+1).padStart(2,"0")}</span>
    <span className={styles.sectionIcon}><SectionIcon name={metadata?.icon ?? "document"}/></span>
    <span className={styles.cardCopy}><strong>{title}</strong><span>{metadata?.description ?? "Page headings and introductory content"}</span>{!visibility && <small>{metadata?.scope ?? "Public page"}</small>}{draft && <span className={styles.draftBadge}>{draft}</span>}</span>
    {visibility}
    <button type="button" className={styles.editLabel} aria-label={`${open ? "Close" : "Edit"} ${title}`} aria-expanded={open} onClick={event=>{event.stopPropagation();onEdit();}} onKeyDown={event=>event.stopPropagation()}>{open ? "Close" : "Edit"}<span aria-hidden="true"> →</span></button>
  </span>;
}
