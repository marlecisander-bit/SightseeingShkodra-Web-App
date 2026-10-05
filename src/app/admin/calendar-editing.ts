import type { CalendarDay, Settings } from './operations-calendar';
import type { ScheduleTime } from './schedule-editor';

export function toggleCalendarDeparture(settings: Settings, selected: CalendarDay | undefined, usualTimes: ScheduleTime[], time: string, enabled: boolean): Settings {
  const times = settings.times ?? selected?.slots.filter(slot => slot.open).map(slot => ({ time: slot.time })) ?? usualTimes;
  const departures = { ...settings.departures };
  // Reopening one departure on a closed day must not reopen its other times.
  if (enabled && settings.closed) for (const item of times) departures[item.time] = { ...departures[item.time], closed: true };
  departures[time] = { ...departures[time], closed: !enabled };
  return {
    ...settings,
    ...(enabled ? { closed: false } : {}),
    times: enabled && !times.some(item => item.time === time) ? [...times, { time }].sort((a, b) => a.time.localeCompare(b.time)) : times,
    departures,
  };
}
