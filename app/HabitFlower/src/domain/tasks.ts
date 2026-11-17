/**
 * Task rules: sections, repeat rules and next due dates. No streaks.
 */
import { addDays, addMonths, formatDay, weekday, weekdayLong, weekdayShort } from './day';
import type { LocalDay, RepeatRule, Task } from './types';

export type TaskSection = 'overdue' | 'today' | 'upcoming' | 'other';

export function taskSection(task: Pick<Task, 'dueDay'>, today: LocalDay): TaskSection {
  if (!task.dueDay) return 'other';
  if (task.dueDay < today) return 'overdue';
  if (task.dueDay === today) return 'today';
  return 'upcoming';
}

export function isRepeating(rule: RepeatRule): boolean {
  return rule.kind !== 'never';
}

function step(rule: RepeatRule, from: LocalDay): LocalDay {
  switch (rule.kind) {
    case 'never':
      return from;
    case 'daily':
      return addDays(from, 1);
    case 'weekly': {
      if (rule.days.length === 0) return addDays(from, 7);
      for (let i = 1; i <= 7; i++) {
        const d = addDays(from, i);
        if (rule.days.includes(weekday(d))) return d;
      }
      return addDays(from, 7);
    }
    case 'monthly':
      return addMonths(from, 1);
    case 'custom':
      if (rule.unit === 'day') return addDays(from, rule.every);
      if (rule.unit === 'week') return addDays(from, rule.every * 7);
      return addMonths(from, rule.every);
  }
}

/**
 * Next due day after finishing a repeating task on `completedOn`.
 * Rules counted from the due date keep their rhythm but always land after
 * the day it was finished; "from when I finish" counts from that day.
 */
export function nextDue(
  task: Pick<Task, 'dueDay' | 'repeat'>,
  completedOn: LocalDay,
): LocalDay | null {
  const rule = task.repeat;
  if (rule.kind === 'never') return null;
  if (rule.kind === 'custom' && rule.from === 'completion') return step(rule, completedOn);
  // Monthly rules step from the original due day so the 31st stays the 31st where possible.
  let base = task.dueDay ?? completedOn;
  let next = step(rule, base);
  let guard = 0;
  while (next <= completedOn && guard++ < 1000) {
    base = next;
    next = step(rule, base);
  }
  return next;
}

const ORDER = [0, 1, 2, 3, 4, 5, 6];

export function repeatLabel(rule: RepeatRule, weekStart: 0 | 1 = 0): string {
  switch (rule.kind) {
    case 'never':
      return 'Never';
    case 'daily':
      return 'Every day';
    case 'weekly': {
      if (rule.days.length === 0) return 'Every week';
      if (rule.days.length === 7) return 'Every day';
      if (rule.days.length === 1) return `Every ${weekdayLong(rule.days[0])}`;
      const sorted = [...ORDER.slice(weekStart), ...ORDER.slice(0, weekStart)].filter((d) => rule.days.includes(d));
      return `Every ${sorted.map(weekdayShort).join(', ')}`;
    }
    case 'monthly':
      return 'Every month';
    case 'custom': {
      const unit = rule.every === 1 ? rule.unit : `${rule.unit}s`;
      const base = rule.every === 1 ? `Every ${unit}` : `Every ${rule.every} ${unit}`;
      return rule.from === 'completion' ? `${base} after I finish` : base;
    }
  }
}

/** Explanation shown under the Repeat sheet options. */
export function repeatSummary(rule: RepeatRule, dueDay: LocalDay | null): string {
  switch (rule.kind) {
    case 'never':
      return '';
    case 'daily':
      return 'Repeats every day. A missed one stays overdue until you do it.';
    case 'weekly':
      return rule.days.length ? `Repeats every week on ${[...rule.days].sort().map(weekdayShort).join(', ')}.` : 'Pick at least one day.';
    case 'monthly': {
      const d = dueDay ? Number(dueDay.slice(8, 10)) : null;
      return d ? `Repeats on the ${ordinal(d)} of every month.` : 'Repeats every month.';
    }
    case 'custom': {
      const unit = rule.every === 1 ? rule.unit : `${rule.unit}s`;
      return rule.from === 'completion'
        ? `Next one is due ${rule.every} ${unit} after you check this off, so a late finish pushes it back.`
        : `Due every ${rule.every} ${unit}${dueDay ? ` from ${formatDay(dueDay)}` : ''}, whenever you finish.`;
    }
  }
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${s}`;
}

export function sortTasks<T extends Pick<Task, 'dueDay' | 'dueTime' | 'createdAt'>>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const ad = a.dueDay ?? '9999';
    const bd = b.dueDay ?? '9999';
    if (ad !== bd) return ad < bd ? -1 : 1;
    const at = a.dueTime ?? '99:99';
    const bt = b.dueTime ?? '99:99';
    if (at !== bt) return at < bt ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}
