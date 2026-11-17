/**
 * Check-in windows. Up to 3 per habit. Non-photo habits may still check in
 * up to 1 hour after a window ends; photo habits only during the window.
 */
import { formatTimeOfDay, parseTime } from './day';
import type { CheckinWindow, Habit } from './types';

export const GRACE_MINUTES = 60;
export const MAX_WINDOWS = 3;
export const MAX_REMINDERS = 5;

export type WindowState =
  /** No windows: check in any time. */
  | { kind: 'anytime' }
  | { kind: 'open'; index: number; closesAt: number }
  /** After the window end, inside the 1 hour grace period. */
  | { kind: 'grace'; index: number; closesAt: number }
  | { kind: 'upcoming'; index: number; opensAt: number; opensInMinutes: number }
  | { kind: 'closed' };

export function windowState(
  habit: Pick<Habit, 'windows' | 'checkinType'>,
  nowMinutes: number,
  /** Slots already complete (per-window mode); those windows are skipped. */
  completeSlots: Set<number> = new Set(),
): WindowState {
  if (habit.windows.length === 0) return { kind: 'anytime' };
  const grace = habit.checkinType === 'photo' ? 0 : GRACE_MINUTES;
  const ws = habit.windows
    .map((w, index) => ({ index, start: parseTime(w.start), end: parseTime(w.end) }))
    .sort((a, b) => a.start - b.start);

  for (const w of ws) {
    if (completeSlots.has(w.index)) continue;
    if (nowMinutes >= w.start && nowMinutes < w.end) return { kind: 'open', index: w.index, closesAt: w.end };
  }
  for (const w of ws) {
    if (completeSlots.has(w.index)) continue;
    if (grace > 0 && nowMinutes >= w.end && nowMinutes < w.end + grace) {
      return { kind: 'grace', index: w.index, closesAt: w.end + grace };
    }
  }
  for (const w of ws) {
    if (completeSlots.has(w.index)) continue;
    if (nowMinutes < w.start) {
      return { kind: 'upcoming', index: w.index, opensAt: w.start, opensInMinutes: w.start - nowMinutes };
    }
  }
  return { kind: 'closed' };
}

export function canCheckIn(state: WindowState): boolean {
  return state.kind === 'anytime' || state.kind === 'open' || state.kind === 'grace';
}

/** Slot a check-in is written to: the window index in per-window mode, else 0. */
export function slotFor(habit: Pick<Habit, 'windows' | 'windowMode'>, state: WindowState): number {
  if (habit.windowMode !== 'per' || habit.windows.length < 2) return 0;
  return state.kind === 'open' || state.kind === 'grace' || state.kind === 'upcoming' ? state.index : 0;
}

/** "Opens in 1h 24m", minutes only in the last hour: "Opens in 24m". */
/**
 * Live countdown text with seconds: "1h 04m 05s", "24m 05s", "45s".
 * Smaller units are zero-padded after a larger one so the width stays steady.
 */
export function formatCountdown(totalSeconds: number): string {
  const t = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}

/** Seconds from `now` until a time of day (minutes since midnight), wrapping past midnight. */
export function secondsUntil(minutesOfDayTarget: number, now: Date): number {
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diff = minutesOfDayTarget * 60 - nowSec;
  return diff < 0 ? diff + 86_400 : diff;
}

export function minutesToTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** "8:00 AM to 9:00 AM" */
export function formatWindow(w: CheckinWindow): string {
  return `${formatTimeOfDay(w.start)} to ${formatTimeOfDay(w.end)}`;
}
