import { planNotifications, type PlanHabit } from '../notifications';
import type { NotificationPrefs } from '../types';

const prefs: NotificationPrefs = {
  reminders: true,
  windowClosing: true,
  wilting: true,
  milestones: true,
  nudges: true,
  reactions: true,
  requests: true,
  friendPosts: false,
};

function habit(over: Partial<PlanHabit['habit']> = {}, state: Partial<Omit<PlanHabit, 'habit'>> = {}): PlanHabit {
  return {
    habit: { id: 'h1', name: 'Push-ups', flowerKind: 'marigold', schedule: { kind: 'daily' }, windows: [], reminders: ['08:00', '19:00'], pausedAt: null, ...over },
    flower: { health: 'ok', stage: 'bloom' },
    doneToday: false,
    dueToday: true,
    ...state,
  };
}

const today = '2026-11-14'; // Saturday
const now = new Date(2026, 10, 14, 12, 0);

describe('planNotifications', () => {
  test('schedules remaining reminders today and tomorrow, plus a wilting warning', () => {
    const plan = planNotifications({ habits: [habit()], prefs, away: false, today, now, resetHour: 0 });
    expect(plan.map((p) => p.id)).toEqual([
      'rem:h1:2026-11-14:19:00',
      'rem:h1:2026-11-15:08:00',
      'wilt:h1:2026-11-14',
      'rem:h1:2026-11-15:19:00',
    ]);
    expect(plan.find((p) => p.kind === 'wilting')?.title).toBe('Your Marigold is wilting');
  });

  test('nothing for today once done, and no wilting warning', () => {
    const plan = planNotifications({ habits: [habit({}, { doneToday: true })], prefs, away: false, today, now, resetHour: 0 });
    expect(plan.every((p) => p.id.includes('2026-11-15'))).toBe(true);
    expect(plan.some((p) => p.kind === 'wilting')).toBe(false);
  });

  test('a wilting flower warns that it will dry up', () => {
    const plan = planNotifications({ habits: [habit({}, { flower: { health: 'wilt', stage: 'bloom' } })], prefs, away: false, today, now, resetHour: 0 });
    expect(plan.find((p) => p.kind === 'wilting')?.title).toBe('Your Marigold dried up');
  });

  test('Away mode and paused habits get nothing', () => {
    expect(planNotifications({ habits: [habit()], prefs, away: true, today, now, resetHour: 0 })).toEqual([]);
    expect(planNotifications({ habits: [habit({ pausedAt: 'x' })], prefs, away: false, today, now, resetHour: 0 })).toEqual([]);
  });

  test('respects specific days and the prefs switches', () => {
    // Sunday only; today is Saturday so only tomorrow.
    const plan = planNotifications({
      habits: [habit({ schedule: { kind: 'days', days: [0] } }, { dueToday: false })],
      prefs: { ...prefs, wilting: false },
      away: false,
      today,
      now,
      resetHour: 0,
    });
    expect(plan.map((p) => p.id)).toEqual(['rem:h1:2026-11-15:08:00', 'rem:h1:2026-11-15:19:00']);
  });

  test('window closing goes out 30 minutes before the end', () => {
    const plan = planNotifications({
      habits: [habit({ reminders: [], windows: [{ start: '18:00', end: '20:00' }] })],
      prefs: { ...prefs, wilting: false },
      away: false,
      today,
      now,
      resetHour: 0,
    });
    expect(plan[0].at.getHours()).toBe(19);
    expect(plan[0].at.getMinutes()).toBe(30);
  });
});
