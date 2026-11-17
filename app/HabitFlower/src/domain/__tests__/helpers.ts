import { addDays, eachDay } from '../day';
import type { HabitHistory } from '../schedule';
import type { CheckIn, DayRange, LocalDay, Schedule } from '../types';

type Row = HabitHistory['checkIns'][number];

export function done(day: LocalDay, slot = 0): Row {
  return { localDay: day, slot, value: { kind: 'check' }, complete: true, deletedAt: null };
}

export function partial(day: LocalDay, n = 1): Row {
  return { localDay: day, slot: 0, value: { kind: 'count', n }, complete: false, deletedAt: null };
}

/** Check-ins on every day in [from, to]. */
export function doneRange(from: LocalDay, to: LocalDay): Row[] {
  return eachDay(from, to).map((d) => done(d));
}

export function history(opts: {
  startDay: LocalDay;
  today: LocalDay;
  checkIns?: Row[];
  schedule?: Schedule;
  pauses?: DayRange[];
  aways?: DayRange[];
  weekStart?: 0 | 1;
  windows?: HabitHistory['habit']['windows'];
  windowMode?: 'per' | 'any';
}): HabitHistory {
  return {
    habit: {
      schedule: opts.schedule ?? { kind: 'daily' },
      windows: opts.windows ?? [],
      windowMode: opts.windowMode ?? 'any',
      startDay: opts.startDay,
      checkinType: 'check',
    },
    checkIns: opts.checkIns ?? [],
    pauses: opts.pauses ?? [],
    aways: opts.aways ?? [],
    today: opts.today,
    weekStart: opts.weekStart ?? 0,
  };
}

export { addDays };
export type { CheckIn };
