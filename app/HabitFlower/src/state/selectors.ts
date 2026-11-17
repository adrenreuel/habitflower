/**
 * Derived views over the store. Pure functions plus small hooks that keep
 * "now" ticking so windows, countdowns and the day rollover stay live.
 */
import { useEffect, useMemo, useState } from 'react';

import { slotTarget, valueAmount } from '@/domain/checkin';
import { addDays, localDay, minutesOfDay, weekday, weekdayLong, weekdayShort } from '@/domain/day';
import { evaluateFlower } from '@/domain/flower';
import { scheduleOn } from '@/domain/rules';
import { classifyDays, dayProgress, groupByDay, inRanges, isDueToday, requiredSlots, type DayInfo, type HabitHistory } from '@/domain/schedule';
import type { CheckIn, FlowerState, Habit, LocalDay, Schedule } from '@/domain/types';
import { windowState, type WindowState } from '@/domain/windows';
import { useStore, type AppStore } from './store';

/** Current time, re-rendering every `ms` (default 30s). */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function useToday(): LocalDay {
  const now = useNow();
  const reset = useStore((s) => s.user.settings.dayResetHour);
  return localDay(now, reset);
}

type Data = Pick<AppStore, 'checkIns' | 'pauses' | 'aways' | 'user'>;

export function historyFor(habit: Habit, data: Data, today: LocalDay, byHabit?: Map<string, CheckIn[]>): HabitHistory {
  return {
    habit,
    checkIns: byHabit ? byHabit.get(habit.id) ?? [] : data.checkIns.filter((c) => c.habitId === habit.id),
    pauses: data.pauses.filter((p) => p.habitId === habit.id),
    aways: data.aways,
    today,
    weekStart: data.user.settings.weekStart,
  };
}

export function checkInsByHabit(checkIns: CheckIn[]): Map<string, CheckIn[]> {
  const m = new Map<string, CheckIn[]>();
  for (const c of checkIns) {
    const list = m.get(c.habitId);
    if (list) list.push(c);
    else m.set(c.habitId, [c]);
  }
  return m;
}

export type HomeStatus = 'todo' | 'later' | 'done' | 'rest';

export type DotState = 'done' | 'part' | 'miss' | 'today' | 'todayDone' | 'todayRest' | 'off';

export type TodayProgress = {
  amount: number;
  target: number;
  complete: boolean;
  started: boolean;
  completeSlots: Set<number>;
  rows: CheckIn[];
};

export type HabitView = {
  habit: Habit;
  history: HabitHistory;
  flower: FlowerState;
  days: DayInfo[];
  today: TodayProgress;
  window: WindowState;
  status: HomeStatus;
  dueToday: boolean;
  week: DotState[];
  meta: string;
  metaTone: 'normal' | 'wilting' | 'driedUp';
};

export function todayProgress(habit: Habit, rows: CheckIn[]): TodayProgress {
  const p = dayProgress(habit, rows);
  const completeSlots = new Set(rows.filter((r) => r.complete).map((r) => r.slot));
  const perSlot = slotTarget(habit);
  const slots = requiredSlots(habit);
  return {
    amount: rows.reduce((sum, r) => sum + Math.min(valueAmount(r.value), perSlot), 0),
    target: perSlot * slots,
    complete: p.complete,
    started: p.started,
    completeSlots,
    rows,
  };
}

export function scheduleLabel(s: Schedule, weekStart: 0 | 1 = 0): string {
  if (s.kind === 'daily') return 'Every day';
  if (s.kind === 'perWeek') return s.times === 1 ? 'Once a week' : `${s.times} days a week`;
  if (s.days.length === 7) return 'Every day';
  if (s.days.length === 5 && [1, 2, 3, 4, 5].every((d) => s.days.includes(d))) return 'Weekdays';
  if (s.days.length === 2 && s.days.includes(0) && s.days.includes(6)) return 'Weekends';
  const order = [0, 1, 2, 3, 4, 5, 6].map((i) => (i + weekStart) % 7);
  return order.filter((d) => s.days.includes(d)).map(weekdayShort).join(', ');
}

function nextScheduledLabel(habit: Habit, today: LocalDay): string | null {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    const s = scheduleOn(habit, d);
    if (s.kind !== 'days') return null;
    if (s.days.includes(weekday(d))) return i === 1 ? 'Next: Tomorrow' : `Next: ${weekdayLong(weekday(d))}`;
  }
  return null;
}

function dotFor(info: DayInfo | undefined, isToday: boolean, dueToday: boolean): DotState {
  if (isToday) {
    if (info?.status === 'done') return 'todayDone';
    return dueToday ? 'today' : 'todayRest';
  }
  switch (info?.status) {
    case 'done':
      return 'done';
    case 'partial':
      return 'part';
    case 'missed':
      return 'miss';
    default:
      return 'off';
  }
}

export function buildHabitView(habit: Habit, data: Data, now: Date, byHabit?: Map<string, CheckIn[]>): HabitView {
  const today = localDay(now, data.user.settings.dayResetHour);
  const history = historyFor(habit, data, today, byHabit);
  const days = classifyDays(history);
  const flower = evaluateFlower(history);
  const rows = groupByDay(history.checkIns).get(today) ?? [];
  const tp = todayProgress(habit, rows as CheckIn[]);
  const win = windowState(habit, minutesOfDay(now), habit.windowMode === 'per' ? tp.completeSlots : tp.complete ? new Set([0, 1, 2]) : new Set());
  // Away mode never hides a habit from Home; it only stops misses.
  const dueToday = isDueToday({ ...history, aways: [] });

  let status: HomeStatus;
  if (tp.complete) status = 'done';
  else if (!dueToday) status = 'rest';
  else if (win.kind === 'upcoming' && !tp.started) status = 'later';
  else status = 'todo';

  const byDay = new Map(days.map((d) => [d.day, d]));
  const week: DotState[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    week.push(d < habit.startDay ? 'off' : dotFor(byDay.get(d), i === 0, dueToday));
  }

  let meta: string;
  let metaTone: HabitView['metaTone'] = 'normal';
  if (flower.health === 'wilt') {
    meta = 'Wilting';
    metaTone = 'wilting';
  } else if (flower.health === 'dormant') {
    meta = 'Dried up';
    metaTone = 'driedUp';
  } else if (status === 'rest') {
    meta = nextScheduledLabel(habit, today) ?? scheduleLabel(habit.schedule, data.user.settings.weekStart);
  } else if (habit.checkinType === 'count') {
    const n = habit.config.countTarget ?? 2;
    meta = habit.windowMode === 'per' && habit.windows.length > 1 ? `${n} times per window` : `${n} times a day`;
  } else {
    meta = scheduleLabel(habit.schedule, data.user.settings.weekStart);
  }

  return { habit, history, flower, days, today: tp, window: win, status, dueToday, week, meta, metaTone };
}

/** All active (not paused) habit views, recomputed when data or minute changes. */
export function useHabitViews(): { views: HabitView[]; paused: Habit[]; today: LocalDay; now: Date } {
  const now = useNow();
  const habits = useStore((s) => s.habits);
  const checkIns = useStore((s) => s.checkIns);
  const pauses = useStore((s) => s.pauses);
  const aways = useStore((s) => s.aways);
  const user = useStore((s) => s.user);
  const minute = Math.floor(now.getTime() / 60_000);
  return useMemo(() => {
    const data = { checkIns, pauses, aways, user };
    const byHabit = checkInsByHabit(checkIns);
    const active = habits.filter((h) => !h.pausedAt).sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      views: active.map((h) => buildHabitView(h, data, now, byHabit)),
      paused: habits.filter((h) => !!h.pausedAt),
      today: localDay(now, user.settings.dayResetHour),
      now,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, checkIns, pauses, aways, user, minute]);
}

export function useHabitView(id: string, tickMs = 30_000): HabitView | null {
  const now = useNow(tickMs);
  const habit = useStore((s) => s.habits.find((h) => h.id === id));
  const checkIns = useStore((s) => s.checkIns);
  const pauses = useStore((s) => s.pauses);
  const aways = useStore((s) => s.aways);
  const user = useStore((s) => s.user);
  return useMemo(
    () => (habit ? buildHabitView(habit, { checkIns, pauses, aways, user }, now) : null),
    [habit, checkIns, pauses, aways, user, now],
  );
}

export function isAwayOn(data: Pick<AppStore, 'aways'>, today: LocalDay): boolean {
  return inRanges(today, data.aways);
}

/** Flowers in use by other habits, with a habit name, for the picker's "Used" hint. */
export function flowersInUse(habits: Habit[], exceptId?: string): Partial<Record<Habit['flowerKind'], string>> {
  const out: Partial<Record<Habit['flowerKind'], string>> = {};
  for (const h of habits) if (h.id !== exceptId && !h.deletedAt && !out[h.flowerKind]) out[h.flowerKind] = h.name;
  return out;
}
