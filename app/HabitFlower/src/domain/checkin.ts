/**
 * Check-in values per type and whether a slot is complete.
 */
import type { CheckinValue, Habit, ID } from './types';

export const COUNT_MIN = 2;
export const COUNT_MAX = 20;
export const PHOTO_MAX = 8;

export function emptyValue(habit: Pick<Habit, 'checkinType'>): CheckinValue {
  switch (habit.checkinType) {
    case 'check':
      return { kind: 'check' };
    case 'count':
      return { kind: 'count', n: 0 };
    case 'list':
      return { kind: 'list', done: [] };
    case 'photo':
      return { kind: 'photo', photoIds: [] };
    case 'health':
      return { kind: 'health', value: 0 };
  }
}

/** Target for one slot (count per window in per-window mode, else per day). */
export function slotTarget(habit: Pick<Habit, 'checkinType' | 'config'>): number {
  switch (habit.checkinType) {
    case 'check':
      return 1;
    case 'count':
      return habit.config.countTarget ?? COUNT_MIN;
    case 'list':
      return habit.config.listItems?.length ?? 0;
    case 'photo':
      return habit.config.photoCount ?? 1;
    case 'health':
      return habit.config.healthGoal ?? 1;
  }
}

export function valueAmount(value: CheckinValue): number {
  switch (value.kind) {
    case 'check':
      return 1;
    case 'count':
      return value.n;
    case 'list':
      return value.done.length;
    case 'photo':
      return value.photoIds.length;
    case 'health':
      return value.value;
  }
}

export function isComplete(habit: Pick<Habit, 'checkinType' | 'config'>, value: CheckinValue): boolean {
  if (value.kind === 'list') {
    const items = habit.config.listItems ?? [];
    return items.length > 0 && items.every((i) => value.done.includes(i.id));
  }
  return valueAmount(value) >= slotTarget(habit);
}

export function increment(value: CheckinValue, by: 1 | -1, max: number): CheckinValue {
  if (value.kind !== 'count') return value;
  return { kind: 'count', n: Math.max(0, Math.min(max, value.n + by)) };
}

export function toggleItem(value: CheckinValue, itemId: ID): CheckinValue {
  if (value.kind !== 'list') return value;
  const done = value.done.includes(itemId) ? value.done.filter((d) => d !== itemId) : [...value.done, itemId];
  return { kind: 'list', done };
}
