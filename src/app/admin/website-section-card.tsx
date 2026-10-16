import type { ReactNode } from "react";
import {AdminIcon,type AdminIconName} from './admin-icon';
import styles from './website-editor.module.css';

export const sectionCardMetadata: Record<string, {icon:AdminIconName; description:string; scope?:string}> = {
  partners:{icon:'handshake',description:'Partner logos, section introduction and optional link',scope:'Homepage above footer'},
  whatsapp:{icon:'info',description:'Business contact number, message and device visibility',scope:'Global public contact'},
  hero:{icon:"camera",description:"Headline, desktop/mobile photographs and booking links"},
  heroAmenities:{icon:"headphones",description:"Hero feature labels, icons, order and visibility",scope:"Homepage hero"},
  route:{icon:"map-pin",description:"Heading and introduction above shared destinations"},
  live:{icon:"bus-front",description:"Live Map introduction and van-finding link"},
  departures:{icon:"clock-3",description:"Timetable heading and departure-information link"},
  reviews:{icon:"star",description:"Guest-review section heading and introduction"},
  notebook:{icon:"book-open",description:"Local inspiration heading and destination-card link labels"},
  final:{icon:"ticket",description:"Closing booking invitation, banner and button label"},
  navigation:{icon:"map",description:"Shared website navigation labels and links",scope:"Global"},
  footer:{icon:"panels-top-left",description:"Social links, business details and copyright",scope:"Global"},
  seo:{icon:"search",description:"Homepage search title, description and social image",scope:"Homepage search & sharing"},
  legalprivacy:{icon:"file-text",description:"Privacy policy text and publication status",scope:"Privacy Policy page"},
  legalterms:{icon:"file-text",description:"Terms and conditions text and publication status",scope:"Terms & Conditions page"},
  explorePage:{icon:"map-pin",description:"Destination listing introduction",scope:"Explore page"},
  bookPage:{icon:"ticket",description:"Booking page introduction",scope:"Booking page"},
  dayPage:{icon:"clock-3",description:"Your day page introduction",scope:"Your day page"},
  how:{icon:"map",description:"Three steps explaining the tour experience",scope:"Tour page"},
};

/** Shared presentation; the workspace retains selection, visibility and save ownership. */
export function SectionCardHeader({id,title,index,open,draft,visibility,onEdit}:{id:string;title:string;index:number;open:boolean;draft?:string;visibility?:ReactNode;onEdit:()=>void}) {
  const metadata=sectionCardMetadata[id];
  return <span className={styles.sectionHeading}>
    <span className={styles.number}>{String(index+1).padStart(2,"0")}</span>
    <span className={styles.sectionIcon}><AdminIcon name={metadata?.icon ?? "file-text"}/></span>
    <span className={styles.cardCopy}><strong>{title}</strong><span>{metadata?.description ?? "Page headings and introductory content"}</span>{!visibility && <small>{metadata?.scope ?? "Public page"}</small>}{draft && <span className={styles.draftBadge}>{draft}</span>}</span>
    {visibility}
    <button type="button" className={styles.editLabel} aria-label={`${open ? "Close" : "Edit"} ${title}`} aria-expanded={open} onClick={event=>{event.stopPropagation();onEdit();}} onKeyDown={event=>event.stopPropagation()}>{open ? "Close" : "Edit"}<AdminIcon name="arrow-right" size={16}/></button>
  </span>;
}
