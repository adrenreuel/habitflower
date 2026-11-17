import { isComplete } from '../checkin';
import { nextDue, repeatLabel, taskSection } from '../tasks';
import { canCheckIn, formatCountdown, secondsUntil, windowState } from '../windows';

describe('check-in windows', () => {
  const habit = { windows: [{ start: '07:00', end: '09:00' }, { start: '18:00', end: '20:00' }], checkinType: 'count' as const };
  const m = (h: number, min = 0) => h * 60 + min;

  test('no windows means any time', () => {
    expect(windowState({ windows: [], checkinType: 'check' }, m(3))).toEqual({ kind: 'anytime' });
  });

  test('open, grace and upcoming', () => {
    expect(windowState(habit, m(8))).toMatchObject({ kind: 'open', index: 0 });
    expect(windowState(habit, m(9, 30))).toMatchObject({ kind: 'grace', index: 0 });
    expect(windowState(habit, m(10, 36))).toMatchObject({ kind: 'upcoming', index: 1, opensInMinutes: 444 });
    expect(windowState(habit, m(21, 5))).toMatchObject({ kind: 'closed' });
  });

  test('photo habits get no grace period', () => {
    expect(windowState({ ...habit, checkinType: 'photo' }, m(9, 30))).toMatchObject({ kind: 'upcoming', index: 1 });
  });

  test('completed windows are skipped', () => {
    expect(windowState(habit, m(8), new Set([0]))).toMatchObject({ kind: 'upcoming', index: 1 });
  });

  test('countdown shows hours, minutes and seconds', () => {
    expect(formatCountdown(84 * 60 + 5)).toBe('1h 24m 05s');
    expect(formatCountdown(2 * 3600)).toBe('2h 00m 00s');
    expect(formatCountdown(24 * 60 + 9)).toBe('24m 09s');
    expect(formatCountdown(45)).toBe('45s');
    expect(formatCountdown(-3)).toBe('0s');
  });

  test('seconds until a window opens', () => {
    const at = (h: number, m: number, s: number) => new Date(2026, 10, 16, h, m, s);
    expect(secondsUntil(18 * 60, at(16, 35, 30))).toBe(84 * 60 + 30);
    expect(secondsUntil(7 * 60, at(23, 0, 0))).toBe(8 * 3600);
  });

  test('canCheckIn', () => {
    expect(canCheckIn({ kind: 'grace', index: 0, closesAt: 600 })).toBe(true);
    expect(canCheckIn({ kind: 'upcoming', index: 0, opensAt: 600, opensInMinutes: 5 })).toBe(false);
  });
});

describe('check-in completion', () => {
  test('count must reach target, partial is incomplete', () => {
    const h = { checkinType: 'count' as const, config: { countTarget: 3 } };
    expect(isComplete(h, { kind: 'count', n: 2 })).toBe(false);
    expect(isComplete(h, { kind: 'count', n: 3 })).toBe(true);
  });

  test('every list item must be checked', () => {
    const h = { checkinType: 'list' as const, config: { listItems: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] } };
    expect(isComplete(h, { kind: 'list', done: ['a'] })).toBe(false);
    expect(isComplete(h, { kind: 'list', done: ['b', 'a'] })).toBe(true);
  });
});

describe('tasks', () => {
  const today = '2026-11-14';

  test('sections', () => {
    expect(taskSection({ dueDay: '2026-11-10' }, today)).toBe('overdue');
    expect(taskSection({ dueDay: today }, today)).toBe('today');
    expect(taskSection({ dueDay: '2026-11-20' }, today)).toBe('upcoming');
    expect(taskSection({ dueDay: null }, today)).toBe('other');
  });

  test('next due from the due date lands after the finish day', () => {
    expect(nextDue({ dueDay: today, repeat: { kind: 'daily' } }, today)).toBe('2026-11-15');
    expect(nextDue({ dueDay: '2026-11-10', repeat: { kind: 'daily' } }, today)).toBe('2026-11-15');
    // Weekly on Sat (6). Nov 14 is a Saturday, next one Nov 21.
    expect(nextDue({ dueDay: today, repeat: { kind: 'weekly', days: [6] } }, today)).toBe('2026-11-21');
    expect(nextDue({ dueDay: '2026-10-31', repeat: { kind: 'monthly' } }, today)).toBe('2026-11-30');
  });

  test('custom from when I finish', () => {
    const repeat = { kind: 'custom' as const, every: 2, unit: 'week' as const, from: 'completion' as const };
    expect(nextDue({ dueDay: '2026-11-01', repeat }, today)).toBe('2026-11-28');
  });

  test('never repeats returns null', () => {
    expect(nextDue({ dueDay: today, repeat: { kind: 'never' } }, today)).toBeNull();
  });

  test('labels', () => {
    expect(repeatLabel({ kind: 'weekly', days: [4, 1] })).toBe('Every Mon, Thu');
    expect(repeatLabel({ kind: 'custom', every: 3, unit: 'day', from: 'due' })).toBe('Every 3 days');
  });
});
