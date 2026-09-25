import type {
  AvailabilityQuote,
  AvailabilityRequest,
} from "../booking/contracts";

export type PublicStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
};
export type HomeContent = {
  title: string;
  text: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage?: string | null;
  ogImageAlt?: string | null;
};
export type Homepage = {
  adultFares?: {time:string;amount:number}[];
  state: "ready" | "empty" | "unconfigured" | "unavailable";
  product: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    metaTitle?: string | null;
    ogImage?: string | null;
    ogImageAlt?: string | null;
    inclusions?: string | null;
    stops: PublicStop[];
  } | null;
  content: Record<string, HomeContent>;
  date: string | null;
  timezone: string | null;
  price: string;
  schedule: "ready" | "unavailable";
  departures: { time: string }[];
  frequency: string;
};
export type HomepageConfig = { operatorId?: string; productSlug?: string };
export type HomepageSources = {
  read: (operatorId: string, productSlug: string) => Promise<unknown>;
  quote: (request: AvailabilityRequest) => Promise<AvailabilityQuote>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slots = new Set([
  "homepage-hero",
  "homepage-intro",
  "homepage-final",
  "explore-centre",
  "explore-castle",
  "explore-lake",
  "explore-bridge",
]);
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid snapshot");
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 50000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error("Invalid text");
  return value;
}
function optionalText(value: unknown, max: number) {
  return value === null ? null : text(value, max);
}
function identifier(value: unknown) {
  const id = text(value, 36);
  if (!uuid.test(id)) throw new Error("Invalid ID");
  return id;
}
export function emptyHomepage(state: Homepage["state"]): Homepage {
  return {
    state,
    product: null,
    content: {},
    date: null,
    timezone: null,
    price: "Price coming soon",
    schedule: "unavailable",
    departures: [],
    frequency: "Timetable coming soon",
  };
}

/** Explicit DTO projection: provider payloads and raw pricing rules never reach React. */
export async function loadHomepage(
  config: HomepageConfig,
  sources: HomepageSources,
): Promise<Homepage> {
  if (
    !config.operatorId ||
    !uuid.test(config.operatorId) ||
    !config.productSlug ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(config.productSlug) ||
    config.productSlug.length > 200
  )
    return emptyHomepage("unconfigured");
  try {
    const raw = await sources.read(config.operatorId, config.productSlug);
    if (raw === null) return emptyHomepage("unavailable");
    const snapshot = record(raw),
      operator = record(snapshot.operator);
    if (snapshot.version !== 1 || operator.id !== config.operatorId)
      throw new Error("Wrong scope");
    const model = emptyHomepage(snapshot.product === null ? "empty" : "ready");
    model.timezone = text(operator.timezone, 100);
    new Intl.DateTimeFormat("en", { timeZone: model.timezone });
    model.date = text(snapshot.service_date, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(model.date) ||
      new Date(model.date).toISOString().slice(0, 10) !== model.date
    )
      throw new Error("Invalid date");
    if (
      !Array.isArray(snapshot.content) ||
      snapshot.content.length > slots.size
    )
      throw new Error("Invalid content");
    for (const item of snapshot.content) {
      const page = record(item),
        slug = text(page.slug, 200);
      if (!slots.has(slug)) continue;
      model.content[slug] = {
        title: text(page.title, 200),
        text: text(page.text),
        metaTitle: optionalText(page.meta_title, 200),
        metaDescription: optionalText(page.meta_description, 500),
        ogImage: optionalText(page.og_image??null,2000),
        ogImageAlt: optionalText(page.og_image_alt??null,500),
      };
    }
    if (snapshot.product !== null) {
      const product = record(snapshot.product);
      if (product.slug !== config.productSlug || !Array.isArray(product.stops))
        throw new Error("Wrong product");
      model.product = {
        id: identifier(product.id),
        title: text(product.title, 200),
        slug: config.productSlug,
        description: optionalText(product.description, 500),
        metaTitle: optionalText(product.meta_title??null,200),
        ogImage: optionalText(product.og_image??null,2000),
        ogImageAlt: optionalText(product.og_image_alt??null,500),
        inclusions: optionalText(product.inclusions??null,700),
        stops: product.stops
          .map((item) => {
            const stop = record(item);
            if (
              typeof stop.lat !== "number" ||
              !Number.isFinite(stop.lat) ||
              Math.abs(stop.lat) > 90 ||
              typeof stop.lng !== "number" ||
              !Number.isFinite(stop.lng) ||
              Math.abs(stop.lng) > 180 ||
              !Number.isSafeInteger(stop.sort_order) ||
              (stop.sort_order as number) < 0
            )
              throw new Error("Invalid stop");
            return {
              id: identifier(stop.id),
              name: text(stop.name, 500),
              lat: stop.lat,
              lng: stop.lng,
              sortOrder: stop.sort_order as number,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      };
      try {
        const quote = await sources.quote({
          version: 1,
          operatorId: config.operatorId,
          productId: model.product.id,
          date: model.date,
          guests: 1,
        });
        if (
          quote.version !== 1 ||
          quote.productId !== model.product.id ||
          quote.date !== model.date ||
          quote.guests !== 1 ||
          quote.currency !== "EUR" ||
          !Number.isSafeInteger(quote.unitPrice) ||
          quote.unitPrice < 0
        )
          throw new Error("Invalid quote");
        const departures = quote.departures.map((d) => {
          if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?$/.test(d.startTime))
            throw new Error("Invalid time");
          return { time: d.startTime.slice(0, 5) };
        });
        model.price = `${new Intl.NumberFormat("en-IE", { style: "currency", currency: quote.currency }).format(quote.unitPrice / 100)} per guest`;
        model.departures = departures;
        model.adultFares = quote.departures.filter(d=>d.available && d.passengerQuote).map(d=>({time:d.startTime.slice(0,5),amount:d.passengerQuote!.total}));
        model.schedule = "ready";
        model.frequency = departures.length
          ? `${departures.length} upcoming ${departures.length === 1 ? "departure" : "departures"} today`
          : "No more departures today";
      } catch {
        /* Keep published editorial data; never substitute a made-up price or timetable. */
      }
    }
    return model;
  } catch {
    return emptyHomepage("unavailable");
  }
}
