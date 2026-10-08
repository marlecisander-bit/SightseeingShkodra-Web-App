// Historical commitment used only when a booking predates versioned settings.
export type MeetingPoint = { name: string; directions: string; url: string; label: string; stopId: string | null };
export const meetingPoint: MeetingPoint = { name: "Meeting point", directions: "", url: "https://maps.app.goo.gl/rssrPnaBYZVWp316A", label: "Open meeting point in Google Maps", stopId: null };
export function validateMeetingPoint(value: MeetingPoint) {
  const u = new URL(value.url);
  if (u.protocol !== "https:" || u.username || u.password || u.port || !((u.hostname === "maps.app.goo.gl" && /^\/[a-zA-Z0-9]+$/.test(u.pathname)) || (["www.google.com","google.com","maps.google.com"].includes(u.hostname) && u.pathname.startsWith("/maps")))) throw Error("Use an approved HTTPS Google Maps link.");
  if (!value.name.trim() || value.name.length > 200 || value.directions.length > 2000 || value.url.length > 2000 || (value.stopId !== null && !/^[a-zA-Z0-9_-]{1,100}$/.test(value.stopId))) throw Error("Check the meeting-point details.");
  return value;
}
