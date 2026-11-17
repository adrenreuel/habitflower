/**
 * Classifies each day of a habit's life: done, partly done, missed, rest,
 * paused (pause or Away), pending (today, not finished yet) and so on.
 * The flower rules (flower.ts) consume the `effect` of each day.
 */
import { addDays, eachDay, maxDay, startOfWeek, weekday } from './day';
import { scheduleOn, slotsOn } from './rules';
import type { CheckIn, DayRange, Habit, LocalDay, WeekStart } from './types';

export type DayStatus =
  | 'done'
  | 'partial'
  | 'missed'
  | 'rest'
  | 'paused'
  | 'pending'
  | 'future'
  /** Before the habit existed, or the forgiven first day. */
  | 'inactive';

/** What a day does to the flower. */
export type DayEffect = 'grow' | 'miss' | 'none';

export type DayInfo = { day: LocalDay; status: DayStatus; effect: DayEffect };

export type HabitHistory = {
  habit: Pick<Habit, 'schedule' | 'windows' | 'windowMode' | 'startDay' | 'checkinType' | 'pastSchedules' | 'pastSlots'>;
  /** All non-deleted check-ins of the habit. */
  checkIns: Pick<CheckIn, 'localDay' | 'slot' | 'value' | 'complete' | 'deletedAt'>[];
  /** Pause ranges of this habit. */
  pauses: DayRange[];
  /** The user's Away mode ranges. */
  aways: DayRange[];
  today: LocalDay;
  weekStart: WeekStart;
};

export function inRanges(day: LocalDay, ranges: DayRange[]): boolean {
  return ranges.some((r) => day >= r.start && (r.end === null || day < r.end));
}

/** Slots that must be complete for the day to count as done. */
export function requiredSlots(habit: Pick<Habit, 'windows' | 'windowMode'>): number {
  return habit.windowMode === 'per' && habit.windows.length > 1 ? habit.windows.length : 1;
}

export type DayProgress = { complete: boolean; started: boolean };

function hasProgress(c: Pick<CheckIn, 'value' | 'complete'>): boolean {
  if (c.complete) return true;
  switch (c.value.kind) {
    case 'check':
      return true;
    case 'count':
      return c.value.n > 0;
    case 'list':
      return c.value.done.length > 0;
    case 'photo':
      return c.value.photoIds.length > 0;
    case 'health':
      return c.value.value > 0;
  }
}

export function groupByDay<T extends Pick<CheckIn, 'localDay' | 'deletedAt'>>(checkIns: T[]): Map<LocalDay, T[]> {
  const map = new Map<LocalDay, T[]>();
  for (const c of checkIns) {
    if (c.deletedAt) continue;
    const list = map.get(c.localDay);
    if (list) list.push(c);
    else map.set(c.localDay, [c]);
  }
  return map;
}

export function dayProgress(
  habit: Pick<Habit, 'windows' | 'windowMode'>,
  rows: Pick<CheckIn, 'slot' | 'value' | 'complete'>[] | undefined,
): DayProgress {
  if (!rows || rows.length === 0) return { complete: false, started: false };
  const completeSlots = new Set(rows.filter((r) => r.complete).map((r) => r.slot));
  return {
    complete: completeSlots.size >= requiredSlots(habit),
    started: rows.some(hasProgress),
  };
}

/** Scheduled on this weekday, using the schedule in force on `day`. */
export function isScheduledWeekday(habit: Pick<Habit, 'schedule' | 'pastSchedules'>, day: LocalDay): boolean {
  const s = scheduleOn(habit, day);
  if (s.kind === 'daily') return true;
  if (s.kind === 'days') return s.days.includes(weekday(day));
  return true; // perWeek: any day can count
}

/**
 * Classify every day from the habit's start day to `until` (default today).
 * Each day is judged by the schedule and windows in force on that day.
 */
export function classifyDays(h: HabitHistory, until: LocalDay = h.today): DayInfo[] {
  const { habit, today } = h;
  if (until < habit.startDay) return [];
  const byDay = groupByDay(h.checkIns);
  const skipped = (d: LocalDay) => inRanges(d, h.pauses) || inRanges(d, h.aways);
  const progress = (d: LocalDay) => dayProgress(slotsOn(habit, d), byDay.get(d));
  const out: DayInfo[] = [];

  for (let weekFirst = startOfWeek(habit.startDay, h.weekStart); weekFirst <= until; weekFirst = addDays(weekFirst, 7)) {
    const days = eachDay(weekFirst, addDays(weekFirst, 6));
    const rules = days.map((d) => scheduleOn(habit, d));
    // "N days a week": the days of this week that can count toward the target.
    const weekly = days.filter((d, i) => rules[i].kind === 'perWeek' && d >= habit.startDay && !skipped(d));
    let doneSoFar = 0;

    for (let i = 0; i < 7; i++) {
      const day = days[i];
      if (day > until) break;
      if (day < habit.startDay) continue;
      if (day > today) {
        out.push({ day, status: 'future', effect: 'none' });
        continue;
      }
      if (skipped(day)) {
        out.push({ day, status: 'paused', effect: 'none' });
        continue;
      }
      const p = progress(day);
      const rule = rules[i];

      if (rule.kind === 'perWeek') {
        // A day only counts as a miss once the weekly target can no longer be
        // reached. The target is capped at the days that can count this week.
        const target = Math.min(rule.times, weekly.length);
        if (p.complete) {
          doneSoFar++;
          out.push({ day, status: 'done', effect: 'grow' });
          continue;
        }
        const remainingAfter = weekly.filter((d) => d > day).length;
        if (doneSoFar >= target || doneSoFar + remainingAfter >= target) {
          out.push({ day, status: day === today ? 'pending' : 'rest', effect: 'none' });
        } else if (day === today) {
          out.push({ day, status: 'pending', effect: 'none' });
        } else if (day === habit.startDay) {
          out.push({ day, status: 'inactive', effect: 'none' });
        } else {
          out.push({ day, status: p.started ? 'partial' : 'missed', effect: 'miss' });
        }
        continue;
      }

      if (!(rule.kind === 'daily' || rule.days.includes(weekday(day)))) {
        // Check-ins on rest days show in history but never grow the flower.
        out.push({ day, status: p.complete ? 'done' : 'rest', effect: 'none' });
      } else if (p.complete) {
        out.push({ day, status: 'done', effect: 'grow' });
      } else if (day === today) {
        out.push({ day, status: 'pending', effect: 'none' });
      } else if (day === habit.startDay) {
        // The day the habit was planted can only help, never hurt.
        out.push({ day, status: 'inactive', effect: 'none' });
      } else {
        out.push({ day, status: p.started ? 'partial' : 'missed', effect: 'miss' });
      }
    }
  }
  return out;
}

/** Done count and target for the current week of a perWeek habit. */
export function weekProgress(h: HabitHistory): { done: number; target: number } | null {
  const rule = scheduleOn(h.habit, h.today);
  if (rule.kind !== 'perWeek') return null;
  const first = maxDay(startOfWeek(h.today, h.weekStart), h.habit.startDay);
  const last = addDays(startOfWeek(h.today, h.weekStart), 6);
  const byDay = groupByDay(h.checkIns);
  const days = eachDay(first, last).filter(
    (d) => scheduleOn(h.habit, d).kind === 'perWeek' && !inRanges(d, h.pauses) && !inRanges(d, h.aways),
  );
  const done = days.filter((d) => dayProgress(slotsOn(h.habit, d), byDay.get(d)).complete).length;
  return { done, target: Math.min(rule.times, days.length) };
}

/** Is the habit expected today (scheduled, not paused or away, weekly target not met)? */
export function isDueToday(h: HabitHistory): boolean {
  if (inRanges(h.today, h.pauses) || inRanges(h.today, h.aways)) return false;
  if (scheduleOn(h.habit, h.today).kind === 'perWeek') {
    const wp = weekProgress(h);
    if (!wp) return false;
    const byDay = groupByDay(h.checkIns);
    const doneToday = dayProgress(slotsOn(h.habit, h.today), byDay.get(h.today)).complete;
    return doneToday || wp.done < wp.target;
  }
  return isScheduledWeekday(h.habit, h.today);
}
