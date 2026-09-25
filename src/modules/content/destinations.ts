import { safeWebsiteImage } from "./website-schema";
export type Destination = { version: 1; format: "destination_v1"; slug: string; name: string; tag: string; text: string; detail: string; story: string; image: string; alt: string; seoTitle: string; seoDescription: string; socialImage: string; location: string; lat: number | null; lng: number | null; mapsUrl: string; stopId: string | null; showOnPage: boolean; showOnHomepage: boolean; guidePublished: boolean; legacyLink?: string };
export type DestinationRecord = { id: string; body: Destination; published_body: Destination | null; status: string; destination_order: number; destination_aliases: string[]; updated_at: string };
export type DestinationPlace = Destination & { id: string; recordId: string; link: string; aliases: string[] };
export function destinationSlug(name: string) { return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,150); }
export const blankDestination: Destination = { version: 1, format: "destination_v1", slug: "", name: "", tag: "", text: "", detail: "", story: "", image: "", alt: "", seoTitle: "", seoDescription: "", socialImage: "", location: "", lat: null, lng: null, mapsUrl: "", stopId: null, showOnPage: true, showOnHomepage: false, guidePublished: false };
export function validateDestination(value: Destination, publish = false) {
  if (!value || value.version !== 1 || value.format !== "destination_v1" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.slug) || value.slug.length>150 || !value.name.trim() || value.name.length>200) throw Error("Enter a destination name and a valid URL slug.");
  for (const key of ["name","tag","text","detail","story","image","alt","seoTitle","seoDescription","socialImage","location","mapsUrl"] as const) if (typeof value[key] !== "string" || value[key].length > (key === "story" ? 50000 : 2000)) throw Error("Check the destination fields.");
  if ((value.image && !safeWebsiteImage(value.image)) || (value.socialImage && !safeWebsiteImage(value.socialImage))) throw Error("Use an uploaded image or an existing website image.");
  if (typeof value.showOnPage !== "boolean" || typeof value.showOnHomepage !== "boolean") throw Error("Invalid visibility.");
  if (value.lat !== null && (!Number.isFinite(value.lat) || Math.abs(value.lat)>90) || value.lng !== null && (!Number.isFinite(value.lng) || Math.abs(value.lng)>180)) throw Error("Enter valid coordinates.");
  if (value.mapsUrl) { let u: URL; try { u = new URL(value.mapsUrl); } catch { throw Error("Enter a valid Google Maps URL."); } if (u.protocol!=="https:" || u.username || u.password || !["maps.google.com","www.google.com","google.com","maps.app.goo.gl"].includes(u.hostname)) throw Error("Use an HTTPS Google Maps link."); }
  if (publish && [value.text,value.image,value.alt,value.seoTitle,value.seoDescription].some(v=>!v.trim())) throw Error("Publishing requires a description, image, alt text and SEO title/description.");
  return value;
}
export function destinationPlace(row: DestinationRecord, preview = false): DestinationPlace { const d = preview ? row.body : row.published_body!; return {...d,id:d.slug,recordId:row.id,link:d.guidePublished ? `/explore/${d.slug}` : `/explore#${d.slug}`,aliases:row.destination_aliases}; }
