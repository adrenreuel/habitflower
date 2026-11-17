import { evaluateFlower } from '../flower';
import { applyRuleEdit, scheduleOn, slotsOn } from '../rules';
import { classifyDays } from '../schedule';
import { doneRange, history } from './helpers';

// Nov 1 2026 is a Sunday.
const S = '2026-11-01';

describe('rule history', () => {
  const habit = {
    schedule: { kind: 'daily' } as const,
    windows: [],
    windowMode: 'any' as const,
    startDay: S,
  };

  test('schedule edits start tomorrow and keep the old schedule for today and before', () => {
    const out = applyRuleEdit(habit, { schedule: { kind: 'days', days: [1] } }, '2026-11-10');
    expect(out.pastSchedules).toEqual([{ until: '2026-11-11', schedule: { kind: 'daily' } }]);
    const next = { ...habit, ...out };
    expect(scheduleOn(next, '2026-11-10')).toEqual({ kind: 'daily' });
    expect(scheduleOn(next, '2026-11-11')).toEqual({ kind: 'days', days: [1] });
  });

  test('a second schedule edit the same day keeps the rule today started with', () => {
    const first = { ...habit, ...applyRuleEdit(habit, { schedule: { kind: 'perWeek', times: 3 } }, '2026-11-10') };
    const second = { ...first, ...applyRuleEdit(first, { schedule: { kind: 'days', days: [2] } }, '2026-11-10') };
    expect(second.pastSchedules).toHaveLength(1);
    expect(scheduleOn(second, '2026-11-10')).toEqual({ kind: 'daily' });
    expect(scheduleOn(second, '2026-11-11')).toEqual({ kind: 'days', days: [2] });
  });

  test('saving the same schedule records nothing', () => {
    expect(applyRuleEdit(habit, { schedule: { kind: 'daily' } }, '2026-11-10').pastSchedules).toEqual([]);
  });

  test('window edits apply from today', () => {
    const out = applyRuleEdit(habit, { windows: [{ start: '07:00', end: '09:00' }, { start: '18:00', end: '20:00' }], windowMode: 'per' }, '2026-11-10');
    expect(out.pastSlots).toEqual([{ until: '2026-11-10', windows: [], windowMode: 'any' }]);
    const next = { ...habit, ...out };
    expect(slotsOn(next, '2026-11-09').windows).toHaveLength(0);
    expect(slotsOn(next, '2026-11-10').windows).toHaveLength(2);
  });

  test('how you check in is locked', () => {
    const out = applyRuleEdit(habit, { checkinType: 'count' }, '2026-11-10');
    expect('checkinType' in out).toBe(false);
  });

  test('past days are never re-judged after a schedule change', () => {
    // Daily habit, every day done until Nov 9, then switched to Mondays only on Nov 10.
    const before = history({ startDay: S, today: '2026-11-10', checkIns: doneRange(S, '2026-11-09') });
    const edit = applyRuleEdit({ ...before.habit }, { schedule: { kind: 'days', days: [1] } }, '2026-11-10');
    const after = { ...before, habit: { ...before.habit, ...edit } };
    const past = (h: typeof before) => classifyDays(h).filter((d) => d.day < '2026-11-10');
    expect(past(after)).toEqual(past(before));
    expect(evaluateFlower(after)).toEqual(evaluateFlower(before));
  });

  test('a stricter schedule does not turn earlier rest days into misses', () => {
    // Mon/Wed/Fri habit, all done. Switching to every day must not mark old Tue/Thu as missed.
    const mwf = { kind: 'days' as const, days: [1, 3, 5] };
    const base = history({ startDay: S, today: '2026-11-10', schedule: mwf, checkIns: doneRange(S, '2026-11-09').filter((c) => ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09'].includes(c.localDay)) });
    const edit = applyRuleEdit(base.habit, { schedule: { kind: 'daily' } }, '2026-11-10');
    const h = { ...base, habit: { ...base.habit, ...edit } };
    expect(classifyDays(h).filter((d) => d.status === 'missed')).toEqual([]);
    // From tomorrow every day counts.
    const later = { ...h, today: '2026-11-12' };
    expect(classifyDays(later).find((d) => d.day === '2026-11-11')?.status).toBe('missed');
  });

  test('adding a window does not make old single-slot days partial', () => {
    const base = history({ startDay: S, today: '2026-11-10', checkIns: doneRange(S, '2026-11-09') });
    const edit = applyRuleEdit(base.habit, { windows: [{ start: '07:00', end: '09:00' }, { start: '18:00', end: '20:00' }], windowMode: 'per' }, '2026-11-10');
    const h = { ...base, habit: { ...base.habit, ...edit } };
    expect(classifyDays(h).filter((d) => d.day < '2026-11-10').every((d) => d.status === 'done' || d.status === 'inactive')).toBe(true);
  });
});
