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
