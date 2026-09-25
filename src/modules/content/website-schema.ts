import { parseAmenities, focalPositions } from "./hero-amenities";
import { pageSections } from "./page-sections";
import { destinations } from "../public-preview/contracts";

export type WebsiteContent = Record<string, string>;
export type WebsiteField = { key: string; label: string; initial: string; kind: "text" | "image" | "link" | "position" | "amenities"; max: number };
const field = (key: string, label: string, initial: string, kind: WebsiteField["kind"] = "text"): WebsiteField => ({ key, label, initial, kind, max: kind === "text" ? 700 : 2000 });
const f = field;
export const websiteSections = [
  ...pageSections,
  { id: "hero", title: "Hero", fields: [
    f("hero.eyebrow", "Eyebrow", "SHKODËR, ALBANIA · GO A LITTLE FURTHER"),
    f("hero.title", "Main heading", "Discover Shkodra."), f("hero.emphasis", "Emphasized heading", "Your way."),
    f("hero.description", "Description", "A day between the city, the castle and the lake."), f("hero.subtitle", "Second description line", "Hop on. Wander off. Make it yours."),
    f("hero.desktop", "Desktop hero image", "/images/lake.webp", "image"), f("hero.mobile", "Mobile hero image", "/images/lake.webp", "image"),
    f("hero.desktopPosition", "Desktop focal position", "center center", "position"), f("hero.mobilePosition", "Mobile focal position", "center center", "position"),
    f("hero.alt", "Hero image description", "The Buna River and Lake Shkodra stretching towards the mountains, viewed from Rozafa Castle"),
    f("hero.book", "Booking button label", "Book your day"), f("hero.track", "Map link label", "Track live"),
    f("hero.discover", "Scroll link label", "Discover your day"),
  ] },
  { id: "heroAmenities", title: "Hero amenities", fields: [{key:"hero.amenities", label:"Hero amenities", initial:"[]", kind:"amenities" as const, max:30000}] },
  { id: "intro", title: "A day with possibilities", fields: [
    f("intro.eyebrow", "Eyebrow", "A DAY WITH POSSIBILITIES"), f("intro.title", "Heading", "One ticket. One day.\nShkodra at your pace."),
    f("intro.text", "Description", "A coffee in the old town. A castle above the rivers. An unhurried afternoon by the lake. Leave space for the moments you didn’t plan."),
    f("intro.linkLabel", "Tour link label", "Meet your day tour"), f("intro.link", "Tour link", "/tour", "link"),
  ] },
  { id: "route", title: "The places between", fields: [
    f("route.eyebrow", "Eyebrow", "THE PLACES BETWEEN"), f("route.title", "Heading", "A route worth taking."),
    f("route.text", "Description", "Get to know the places that make Shkodra, Shkodra. Pick a destination and imagine your day."),
  ] },
  { id: "destinations", title: "Four reasons to linger", fields: [
    f("destinations.eyebrow", "Eyebrow", "FOUR REASONS TO LINGER"), f("destinations.title", "Heading", "Stay curious. Stay a little longer."),
    ...destinations.flatMap(place => [
      f(`place.${place.id}.name`, `${place.name} — name`, place.name), f(`place.${place.id}.tag`, `${place.name} — short label`, place.tag),
      f(`place.${place.id}.text`, `${place.name} — story`, place.text), f(`place.${place.id}.detail`, `${place.name} — selected destination description`, place.detail),
      f(`place.${place.id}.image`, `${place.name} — image`, place.image, "image"), f(`place.${place.id}.alt`, `${place.name} — image description`, place.alt),
      f(`place.${place.id}.link`, `${place.name} — guide link`, `/explore#${place.id}`, "link"),
    ]),
  ] },
  { id: "live", title: "Your day, without the guesswork", fields: [
    f("live.eyebrow", "Eyebrow", "YOUR DAY, WITHOUT THE GUESSWORK"), f("live.title", "Heading", "More time here."), f("live.emphasis", "Emphasized heading", "Less time waiting."),
    f("live.text", "Description", "When you’re ready for your next stop, find your van. Live tracking keeps the journey close at hand."), f("live.linkLabel", "Live map link label", "Open live map"),
  ] },
  { id: "how", title: "Keep it beautifully simple", fields: [
    f("how.eyebrow", "Eyebrow", "IT’S YOUR DAY"), f("how.title", "Heading", "Keep it beautifully simple."),
    ...[["Choose your day", "One daily ticket. Room for your own plans."], ["Hop on", "Find your boarding point and settle in."], ["Follow your curiosity", "Step off and enjoy the places you came for."], ["Find your next ride", "Check the live map and hop back on."]].flatMap(([title, text], i) => [f(`how.${i}.title`, `Step ${i + 1} title`, title), f(`how.${i}.text`, `Step ${i + 1} description`, text)]),
  ] },
  { id: "departures", title: "Today, at a glance", fields: [f("departures.eyebrow", "Eyebrow", "TODAY, AT A GLANCE"), f("departures.title", "Heading", "Where will the day take you?"), f("departures.linkLabel", "Timetable link label", "Timetable & boarding")] },
  { id: "reviews", title: "Days worth sharing", fields: [f("reviews.eyebrow", "Eyebrow", "LOVED BY OUR GUESTS"), f("reviews.title", "Heading", "Your stories belong here."), f("reviews.text", "First line", "Real experiences from people who explored Shkodra with us."), f("reviews.second", "Second line", "Until then, let the places speak for themselves.")] },
  { id: "notebook", title: "The local notebook", fields: [f("notebook.eyebrow", "Eyebrow", "THE LOCAL NOTEBOOK"), f("notebook.title", "Heading", "A little more Shkodra."), f("notebook.linkLabel", "Guide link label", "Explore the guide"),
    ...["A DAY IN THE CITY", "ABOVE IT ALL", "THE SLOW AFTERNOON"].flatMap((tag, i) => [f(`notebook.${i}.tag`, `Card ${i + 1} eyebrow`, tag), f(`notebook.${i}.title`, `Card ${i + 1} heading`, ["How would you spend a day in Shkodra?", "Make time for Rozafa.", "Meet the lake. Forget the hurry."][i]), f(`notebook.${i}.linkLabel`, `Card ${i + 1} link label`, "Take a closer look")]),
  ] },
  { id: "final", title: "Final booking invitation", fields: [f("final.eyebrow", "Eyebrow", "LESS RUSH. MORE SHKODRA."), f("final.title", "Heading", "A day you’ll"), f("final.emphasis", "Emphasized heading", "make your own."), f("final.book", "Booking button label", "Book your day"), f("final.image", "Banner image", "/images/castle.webp", "image"), f("final.alt", "Image description", "Rozafa Castle and the green landscape around Shkodra")] },
  { id: "navigation", title: "Navigation", fields: [f("nav.home", "Home link label", "Home"),
    ...[["Tour", "/tour"], ["Route", "/#route"], ["Explore Shkodra", "/explore"], ["Live map", "/live"], ["FAQ", "/tour#faq"]].flatMap(([label, link], i) => [f(`nav.${i}.label`, `Link ${i + 1} label`, label), f(`nav.${i}.link`, `Link ${i + 1} destination`, link, "link")]),
    f("nav.book", "Header booking button", "Book your day"), f("nav.mobileBook", "Mobile booking button", "Book your day"), f("nav.mobileMap", "Mobile map link label", "Live van"),
  ] },
  { id: "footer", title: "Footer", fields: [f("footer.line1", "Tagline first line", "A little closer to the place."), f("footer.line2", "Tagline second line", "A little more of your own pace."),
    ...[["The day tour", "/tour"], ["Live map", "/live"], ["Explore Shkodra", "/explore"], ["Questions & answers", "/tour#faq"], ["Photography credits", "/credits"], ["Staff sign-in", "/admin"]].flatMap(([label, link], i) => [f(`footer.${i}.label`, `Link ${i + 1} label`, label), f(`footer.${i}.link`, `Link ${i + 1} destination`, link, "link")]),
    f("footer.location", "Location", "Shkodër, Albania"), f("footer.language", "Language note", "English · More languages coming soon"), f("footer.contact", "Contact and legal note", "Contact and legal information before launch"),
  ] },
  { id: "seo", title: "Homepage SEO", fields: [f("seo.title", "Search title", "Sightseeing Shkodra"), f("seo.description", "Search description", "Discover Shkodra. Tour details and booking information coming soon."), f("seo.image", "Social image", "/images/lake.webp", "image"), f("seo.alt", "Social image description", "Lake Shkodra and the Buna River seen from Rozafa Castle")] },
];
// Retain the stored schema and historical showcase headings without offering obsolete controls.
export const homepageEditorSections = websiteSections.filter(s => !["how","destinations","navigation","footer","seo",...pageSections.map(p=>p.id)].includes(s.id)).map(s => s.id === "reviews" ? {...s,title:"Guest Reviews",fields:s.fields.filter(f => f.key !== "reviews.second")} : s.id === "notebook" ? {...s,fields:s.fields.filter(f=>!/^notebook\.[0-9]+\./.test(f.key)||f.key==="notebook.0.linkLabel").map(f=>f.key==="notebook.0.linkLabel"?{...f,label:"Destination card link label"}:f)} : s);
export const destinationEditorSections = websiteSections.filter(s => s.id === "destinations").map(s => ({ ...s, title: "Destination content", fields: s.fields.filter(f => f.key.startsWith("place.")) }));
export const globalEditorSections = websiteSections.filter(s=>["navigation","footer","seo"].includes(s.id));
export const publicPageEditorSections = [...pageSections, ...websiteSections.filter(s=>s.id === "how").map(s=>({...s,title:"Tour ? How it works"}))];
export const editableWebsiteSections = [...homepageEditorSections, ...globalEditorSections, ...publicPageEditorSections];
export const websiteEditorGroups = {homepage:homepageEditorSections,destinations:destinationEditorSections,pages:publicPageEditorSections,global:globalEditorSections};
export const websiteFields = websiteSections.flatMap(section => section.fields);
export const initialWebsiteContent: WebsiteContent = Object.fromEntries(websiteFields.map(field => [field.key, field.initial]));
export function safeWebsiteLink(value: string) {
  return /^\/(?:$|#(?:route|booking|destinations)$|(?:tour|live|explore|book|credits|admin)(?:#(?:faq|timetable|centre|castle|lake|bridge))?$|explore\/(?:centre|castle|lake|bridge)$)/.test(value);
}
export function safeWebsiteImage(value: string) {
  if (/^\/images\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpg|jpeg|avif)$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.hash && !url.search && url.hostname.endsWith(".supabase.co") && /^\/storage\/v1\/object\/public\/website-media\/[a-f0-9-]+\/[a-f0-9-]+\.(?:webp|png|jpg|avif)$/.test(url.pathname); } catch { return false; }
}
export function validateWebsiteContent(value: unknown): WebsiteContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid homepage content");
  const record = value as WebsiteContent;
  if (Object.keys(record).length !== websiteFields.length) throw Error("Invalid homepage fields");
  for (const field of websiteFields) {
    const v = record[field.key];
    if (field.kind === "position" && !focalPositions.includes(v as typeof focalPositions[number])) throw Error("Invalid focal position");
    if (field.kind === "amenities") parseAmenities(v);
    if (typeof v !== "string" || !v.trim() || v.length > field.max || (field.kind === "link" && !safeWebsiteLink(v)) || (field.kind === "image" && !safeWebsiteImage(v))) throw Error(`Check ${field.label}`);
  }
  return { ...record };
}
export function websitePlaces(content: WebsiteContent) {
  return destinations.map(place => ({ ...place, ...Object.fromEntries(["name", "tag", "text", "detail", "image", "alt", "link"].map(key => [key, key === "link" ? resolveWebsiteLink(content[`place.${place.id}.${key}`]) : content[`place.${place.id}.${key}`]])) })) as Array<{id:string;name:string;tag:string;text:string;detail:string;image:string;alt:string;link:string}>;
}

// Resolve retired homepage anchors without changing saved editorial records.
export function resolveWebsiteLink(link: string) {
  return link === "/#booking" ? "/book" : link === "/#destinations" ? "/explore" : link;
}
