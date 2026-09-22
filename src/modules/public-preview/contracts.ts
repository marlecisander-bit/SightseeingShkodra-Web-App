import type {
  AvailabilityQuote,
  AvailabilityRequest,
} from "../booking/contracts";

/** Presentation only. Production adapters must obtain quotes from the shared domain. */
export type BookingSelection = {
  date: string;
  guests: number;
  departureId: string;
};
export type PreviewAvailability =
  | { state: "preview"; quote: null; message: string }
  | { state: "available"; quote: AvailabilityQuote };
export interface PublicBookingGateway {
  availability(request: AvailabilityRequest): Promise<PreviewAvailability>;
}
export const previewBookingGateway: PublicBookingGateway = {
  async availability() {
    return {
      state: "preview",
      quote: null,
      message: "Booking opens soon. No seats have been reserved.",
    };
  },
};
export const experience = {
  title: "The Shkodra day tour",
  price: "Price coming soon",
  frequency: "Timetable coming soon",
  inclusions:
    "Audio guide and Wi-Fi details will be confirmed before booking opens.",
};
export const destinations = [
  {
    id: "centre",
    name: "Historic Centre",
    tag: "The city, on foot",
    image: "/images/centre.webp",
    alt: "Pedestrian street in the historic centre of Shkodra",
    text: "Slow streets, cafe tables and a little everyday Shkodra.",
    detail:
      "Leave time to wander. Our full guide will include the boarding point and practical visitor information.",
  },
  {
    id: "castle",
    name: "Rozafa Castle",
    tag: "A different perspective",
    image: "/images/castle.webp",
    alt: "Rozafa Castle above the surrounding landscape",
    text: "Climb above the everyday. Let the view do the talking.",
    detail:
      "A hilltop pause for your day in Shkodra. Admission, access and walking advice will be confirmed in the visitor guide.",
  },
  {
    id: "lake",
    name: "Shiroka & the lake",
    tag: "Room to breathe",
    image: "/images/lake.webp",
    alt: "Lake Shkodra and the Buna River seen from Rozafa Castle",
    text: "Take the long lunch. Stay for the light on the lake.",
    detail:
      "A lakeside chapter of your day. This photograph shows the lake from Rozafa; boarding and stop details are not yet published.",
  },
  {
    id: "bridge",
    name: "Mesi Bridge",
    tag: "Beyond the city",
    image: "/images/bridge-view.webp",
    alt: "Stone arches of Mesi Bridge near Shkodra",
    text: "Old stone, open skies and a reason to take your time.",
    detail:
      "Discover the bridge beyond the city. Final route inclusion and service information will be published before tickets go on sale.",
  },
] as const;
