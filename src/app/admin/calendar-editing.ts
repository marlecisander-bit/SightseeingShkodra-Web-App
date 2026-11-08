import type { CalendarDay, Settings } from './operations-calendar';
import type { ScheduleTime } from './schedule-editor';

export function toggleCalendarDeparture(settings: Settings, _selected: CalendarDay | undefined, usualTimes: ScheduleTime[], time: string, enabled: boolean): Settings {
  if (!usualTimes.some(item => item.time === time)) return settings;
  const departures = { ...settings.departures };
  if (enabled && settings.closed) for (const item of usualTimes) departures[item.time] = { ...departures[item.time], closed: true };
  departures[time] = { ...departures[time], closed: !enabled };
  return { ...settings, ...(enabled ? { closed: false } : {}), departures };
}
