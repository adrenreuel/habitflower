/**
 * Which rules a habit used on a given day, and how edits are recorded.
 *
 * - Past days always keep the rules they were judged by.
 * - Schedule changes start tomorrow.
 * - Goal, count, windows, list items and Health goal apply from today.
 *   (Count and list targets are already frozen per check-in in `complete`.)
 * - How you check in is locked after creation.
 */
import { addDays } from './day';
import type { CheckinWindow, Habit, LocalDay, Schedule, WindowMode } from './types';

type ScheduleRules = Pick<Habit, 'schedule' | 'pastSchedules'>;
type SlotRules = Pick<Habit, 'windows' | 'windowMode' | 'pastSlots'>;

export type Slots = { windows: CheckinWindow[]; windowMode: WindowMode };

/** The schedule in force on `day`. */
export function scheduleOn(habit: ScheduleRules, day: LocalDay): Schedule {
  for (const v of habit.pastSchedules ?? []) if (day < v.until) return v.schedule;
  return habit.schedule;
}

/** The windows and window mode in force on `day`. */
export function slotsOn(habit: SlotRules, day: LocalDay): Slots {
  for (const v of habit.pastSlots ?? []) if (day < v.until) return { windows: v.windows, windowMode: v.windowMode };
  return { windows: habit.windows, windowMode: habit.windowMode };
}

export function sameSchedule(a: Schedule, b: Schedule): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'days' && b.kind === 'days') return [...a.days].sort().join() === [...b.days].sort().join();
  if (a.kind === 'perWeek' && b.kind === 'perWeek') return a.times === b.times;
  return true;
}

function sameSlots(a: Slots, b: Slots): boolean {
  if (a.windows.length !== b.windows.length) return false;
  if (a.windows.some((w, i) => w.start !== b.windows[i].start || w.end !== b.windows[i].end)) return false;
  // The mode only matters with 2 or more windows.
  return a.windows.length < 2 || a.windowMode === b.windowMode;
}

export type HabitRulesPatch = Partial<Pick<Habit, 'schedule' | 'windows' | 'windowMode' | 'checkinType'>>;

/**
 * Turn an edit into the fields to store. Records the old schedule (in force
 * until tomorrow) and the old windows (in force until today) so past days
 * are never re-judged. Drops any change to the check-in type.
 */
export function applyRuleEdit<P extends HabitRulesPatch>(
  habit: Pick<Habit, 'schedule' | 'windows' | 'windowMode' | 'pastSchedules' | 'pastSlots' | 'startDay'>,
  patch: P,
  today: LocalDay,
): Omit<P, 'checkinType'> & Pick<Habit, 'pastSchedules' | 'pastSlots'> {
  const { checkinType: _locked, ...rest } = patch;
  let pastSchedules = habit.pastSchedules ?? [];
  let pastSlots = habit.pastSlots ?? [];

  if (patch.schedule && !sameSchedule(patch.schedule, habit.schedule)) {
    const until = addDays(today, 1);
    const last = pastSchedules[pastSchedules.length - 1];
    // A second edit on the same day keeps the rule today was planned with.
    if (!(last && last.until >= until)) pastSchedules = [...pastSchedules, { until, schedule: habit.schedule }];
  }

  const nextSlots: Slots = { windows: patch.windows ?? habit.windows, windowMode: patch.windowMode ?? habit.windowMode };
  // No past days yet on the day it was planted, so there is nothing to keep.
  if (today > habit.startDay && !sameSlots(nextSlots, habit)) {
    const last = pastSlots[pastSlots.length - 1];
    if (!(last && last.until >= today)) pastSlots = [...pastSlots, { until: today, windows: habit.windows, windowMode: habit.windowMode }];
  }

  return { ...rest, pastSchedules, pastSlots };
}
