import { DAY_NAMES, type DayName, type Habit, type HabitEntry } from "./types";

/** Local-time date key, e.g. "2026-11-14". */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayName(d: Date = new Date()): DayName {
  return DAY_NAMES[d.getDay()];
}

/** The 7 dates (Sun..Sat) of the week containing `d`. */
export function weekDates(d: Date = new Date()): Date[] {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  return Array.from(
    { length: 7 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

/** Daily count goal for a count habit on a given weekday. */
export function countTarget(habit: Habit, day: DayName): number {
  return habit.timesByDay?.[day] ?? habit.target ?? 1;
}

export function checklistItems(habit: Habit, day: DayName): string[] {
  return habit.tasksByDay?.[day] ?? [];
}

/** Completion for one day, 0..1. */
export function entryFraction(
  habit: Habit,
  entry: HabitEntry | undefined,
  day: DayName,
): number {
  if (!entry) return 0;
  switch (habit.type) {
    case "check":
      return entry.done ? 1 : 0;
    case "count": {
      const target = countTarget(habit, day);
      return target > 0 ? Math.min(1, (entry.count ?? 0) / target) : 0;
    }
    case "checklist": {
      const items = checklistItems(habit, day);
      if (items.length === 0) return 0;
      const doneCount = items.filter((t) => entry.tasks?.[t]).length;
      return doneCount / items.length;
    }
  }
}

/** Sum of daily fractions across all logged days (e.g. 12.5 days completed). */
export function daysCompleted(
  habit: Habit,
  entries: Record<string, HabitEntry> | undefined,
): number {
  if (!entries) return 0;
  let total = 0;
  for (const [key, entry] of Object.entries(entries)) {
    const [y, m, d] = key.split("-").map(Number);
    total += entryFraction(habit, entry, dayName(new Date(y, m - 1, d)));
  }
  return Math.round(total * 10) / 10;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
