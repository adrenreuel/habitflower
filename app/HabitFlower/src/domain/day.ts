/**
 * Local-day arithmetic. A LocalDay is "YYYY-MM-DD" in the user's timezone,
 * shifted by the "New day starts at" hour: check-ins before that hour count
 * for the previous day.
 *
 * Day strings are compared and stepped as pure calendar dates (via UTC) so
 * DST changes never skip or repeat a day.
 */
import type { DayResetHour, LocalDay, TimeOfDay } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

function fromParts(y: number, m: number, d: number): LocalDay {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** The local day a moment belongs to, given the reset hour. */
export function localDay(now: Date, resetHour: DayResetHour = 0): LocalDay {
  const shifted = new Date(now.getTime());
  shifted.setHours(shifted.getHours() - resetHour);
  return fromParts(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
}

function toUTC(day: LocalDay): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date): LocalDay {
  return fromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(day: LocalDay, n: number): LocalDay {
  const d = toUTC(day);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTC(d);
}

/** Adds months, clamping to the last day of the target month. */
export function addMonths(day: LocalDay, n: number): LocalDay {
  const [y, m, d] = day.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return fromUTC(target);
}

/** 0 Sunday ... 6 Saturday */
export function weekday(day: LocalDay): number {
  return toUTC(day).getUTCDay();
}

/** Whole days from a to b (positive when b is later). */
export function diffDays(a: LocalDay, b: LocalDay): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

export function compareDays(a: LocalDay, b: LocalDay): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minDay(a: LocalDay, b: LocalDay): LocalDay {
  return a < b ? a : b;
}

export function maxDay(a: LocalDay, b: LocalDay): LocalDay {
  return a > b ? a : b;
}

/** First day of the week containing `day`. */
export function startOfWeek(day: LocalDay, weekStart: 0 | 1): LocalDay {
  const offset = (weekday(day) - weekStart + 7) % 7;
  return addDays(day, -offset);
}

export function startOfMonth(day: LocalDay): LocalDay {
  return `${day.slice(0, 7)}-01`;
}

export function daysInMonth(day: LocalDay): number {
  const [y, m] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Inclusive list of days from a to b. */
export function eachDay(a: LocalDay, b: LocalDay): LocalDay[] {
  const out: LocalDay[] = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
}

export function parseTime(t: TimeOfDay): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTimeOfDay(t: TimeOfDay): string {
  const mins = parseTime(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

/** Minutes since local midnight for a Date. */
export function minutesOfDay(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const weekdayShort = (i: number) => WEEKDAY_SHORT[i];
export const weekdayLong = (i: number) => WEEKDAY_LONG[i];
export const weekdayLetter = (i: number) => WEEKDAY_SHORT[i][0];

export function monthShort(day: LocalDay): string {
  return MONTH_SHORT[Number(day.slice(5, 7)) - 1];
}

export function monthLong(day: LocalDay): string {
  return MONTH_LONG[Number(day.slice(5, 7)) - 1];
}

export function dayOfMonth(day: LocalDay): number {
  return Number(day.slice(8, 10));
}

/** "Sat, Nov 21" */
export function formatDay(day: LocalDay): string {
  return `${weekdayShort(weekday(day))}, ${monthShort(day)} ${dayOfMonth(day)}`;
}

/** "Saturday, November 21" for headers. */
export function formatDayLong(day: LocalDay): string {
  return `${weekdayLong(weekday(day))}, ${monthLong(day)} ${dayOfMonth(day)}`;
}

/** "Today", "Tomorrow", "Yesterday" or "Sat, Nov 21". */
export function relativeDay(day: LocalDay, today: LocalDay): string {
  const d = diffDays(today, day);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  return formatDay(day);
}

/** "Today, 6:00 PM" */
export function formatDayTime(day: LocalDay, time: TimeOfDay | null, today: LocalDay): string {
  const base = relativeDay(day, today);
  return time ? `${base}, ${formatTimeOfDay(time)}` : base;
}

/** "Saturday, Nov 14" (Home header). */
export function formatHeaderDay(day: LocalDay): string {
  return `${weekdayLong(weekday(day))}, ${monthShort(day)} ${dayOfMonth(day)}`;
}
