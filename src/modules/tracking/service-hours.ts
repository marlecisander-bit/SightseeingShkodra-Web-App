export const trackingWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

type DayHours = { open: string; close: string };
const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function parseTrackingWeek(value: unknown): (DayHours | null)[] | null {
  if (!Array.isArray(value) || value.length !== trackingWeekdays.length) return null;
  const week: (DayHours | null)[] = [];
  for (const day of value) {
    if (day === null) { week.push(null); continue; }
    if (!day || typeof day !== 'object' || Object.keys(day).length !== 2 ||
        typeof day.open !== 'string' || typeof day.close !== 'string' ||
        !time.test(day.open) || !time.test(day.close) || day.open === day.close) return null;
    week.push({ open: day.open, close: day.close });
  }
  return week;
}

export function trackingWeekFromForm(form: FormData) {
  return parseTrackingWeek(trackingWeekdays.map((_, index) => form.has(`day-${index}`)
    ? { open: form.get(`open-${index}`), close: form.get(`close-${index}`) } : null));
}

/** Undefined means the companion has no verified service window. */
export function withinTrackingHours(row: { enabled?: boolean; time_zone?: string; week?: unknown } | null, now: Date) {
  const week = parseTrackingWeek(row?.week);
  if (!row?.enabled || row.time_zone !== 'Europe/Tirane' || !week) return undefined;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: row.time_zone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find(part => part.type === 'weekday')?.value;
  const day = trackingWeekdays.findIndex(name => name === weekday);
  const clock = parts.find(part => part.type === 'hour')?.value + ':' + parts.find(part => part.type === 'minute')?.value;
  const current = week[day], previous = week[(day + 6) % 7];
  return Boolean(current && clock >= current.open && (current.open > current.close || clock < current.close)
    || previous && previous.open > previous.close && clock < previous.close);
}
