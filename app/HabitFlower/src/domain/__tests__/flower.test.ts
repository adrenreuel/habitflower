import { bestStreak, evaluateFlower, historyStats } from '../flower';
import { classifyDays } from '../schedule';
import { done, doneRange, history, partial } from './helpers';

// Nov 1 2026 is a Sunday.
const S = '2026-11-01';

describe('growth', () => {
  test('new habit is a sprout', () => {
    expect(evaluateFlower(history({ startDay: S, today: S }))).toMatchObject({ stage: 'seed', health: 'ok', bloomDays: 0 });
  });

  test('today not yet checked in does not count against the flower', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-02', checkIns: [done(S)] }));
    expect(f).toMatchObject({ stage: 'bud', health: 'ok' });
  });

  test('1 check-in makes a bud, 2 make a bloom on day 1 of bloom', () => {
    expect(evaluateFlower(history({ startDay: S, today: S, checkIns: [done(S)] })).stage).toBe('bud');
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-02', checkIns: doneRange(S, '2026-11-02') }));
    expect(f).toMatchObject({ stage: 'bloom', bloomDays: 1 });
  });

  test('each later completed day adds a bloom day', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-05', checkIns: doneRange(S, '2026-11-05') }));
    expect(f).toMatchObject({ stage: 'bloom', bloomDays: 4 });
  });

  test('the day it was planted is forgiven if missed', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-02', checkIns: [done('2026-11-02')] }));
    expect(f).toMatchObject({ stage: 'bud', health: 'ok' });
  });
});

describe('wilting', () => {
  const bloomed = doneRange(S, '2026-11-04'); // bloom, 3 days

  test('1 missed day wilts a bloom and pauses the count', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-06', checkIns: bloomed }));
    expect(f).toMatchObject({ stage: 'bloom', health: 'wilt', bloomDays: 3, missStreak: 1 });
  });

  test('a recovery check-in only restores, nothing extra that day', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-06', checkIns: [...bloomed, done('2026-11-06')] }));
    expect(f).toMatchObject({ stage: 'bloom', health: 'ok', bloomDays: 3, missStreak: 0 });
  });

  test('the day after recovery grows again', () => {
    const f = evaluateFlower(
      history({ startDay: S, today: '2026-11-07', checkIns: [...bloomed, done('2026-11-06'), done('2026-11-07')] }),
    );
    expect(f).toMatchObject({ health: 'ok', bloomDays: 4 });
  });

  test('a bud wilts and restores to a bud', () => {
    const wilted = evaluateFlower(history({ startDay: S, today: '2026-11-03', checkIns: [done(S)] }));
    expect(wilted).toMatchObject({ stage: 'bud', health: 'wilt' });
    const restored = evaluateFlower(history({ startDay: S, today: '2026-11-03', checkIns: [done(S), done('2026-11-03')] }));
    expect(restored).toMatchObject({ stage: 'bud', health: 'ok' });
  });

  test('a partly completed day counts as a miss', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-06', checkIns: [...bloomed, partial('2026-11-05', 2)] }));
    expect(f.health).toBe('wilt');
    const days = classifyDays(history({ startDay: S, today: '2026-11-06', checkIns: [...bloomed, partial('2026-11-05', 2)] }));
    expect(days.find((d) => d.day === '2026-11-05')?.status).toBe('partial');
  });
});

describe('dried up', () => {
  const bloomed = doneRange(S, '2026-11-04');

  test('2 missed days in a row dry it up and reset the count', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-07', checkIns: bloomed }));
    expect(f).toMatchObject({ health: 'dormant', bloomDays: 0 });
  });

  test('a dried up bloom revives as a bud, nothing extra that day', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-07', checkIns: [...bloomed, done('2026-11-07')] }));
    expect(f).toMatchObject({ stage: 'bud', health: 'ok', bloomDays: 0 });
  });

  test('a sprout has no wilting: 1 miss dries it up', () => {
    // Planted Sunday, never checked in. Sunday is forgiven, Monday is the miss.
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-03' }));
    expect(f).toMatchObject({ stage: 'seed', health: 'dormant' });
  });

  test('a dried up sprout revives as a sprout', () => {
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-03', checkIns: [done('2026-11-03')] }));
    expect(f).toMatchObject({ stage: 'seed', health: 'ok' });
  });

  test('misses separated by a recovery are not "in a row"', () => {
    const checkIns = [...bloomed, done('2026-11-06'), done('2026-11-08')];
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-08', checkIns }));
    expect(f).toMatchObject({ stage: 'bloom', health: 'ok' });
  });
});

describe('days that never count', () => {
  const bloomed = doneRange(S, '2026-11-04');

  test('rest days on a specific-days schedule', () => {
    // Mon, Wed, Fri only. Nov 2 Mon, 4 Wed, 6 Fri, 9 Mon.
    const schedule = { kind: 'days' as const, days: [1, 3, 5] };
    const checkIns = [done('2026-11-02'), done('2026-11-04'), done('2026-11-06')];
    const f = evaluateFlower(history({ startDay: '2026-11-02', today: '2026-11-08', schedule, checkIns }));
    expect(f).toMatchObject({ stage: 'bloom', health: 'ok', bloomDays: 2 });
  });

  test('a check-in on a rest day does not grow the flower', () => {
    const schedule = { kind: 'days' as const, days: [1] };
    const f = evaluateFlower(history({ startDay: '2026-11-02', today: '2026-11-03', schedule, checkIns: [done('2026-11-02'), done('2026-11-03')] }));
    expect(f.stage).toBe('bud');
  });

  test('paused days', () => {
    const pauses = [{ start: '2026-11-05', end: '2026-11-10' }];
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-10', checkIns: bloomed, pauses }));
    expect(f).toMatchObject({ health: 'ok', bloomDays: 3 });
  });

  test('ongoing Away mode freezes everything', () => {
    const aways = [{ start: '2026-11-05', end: null }];
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-20', checkIns: bloomed, aways }));
    expect(f).toMatchObject({ health: 'ok', bloomDays: 3 });
  });

  test('misses resume once Away mode ends', () => {
    const aways = [{ start: '2026-11-05', end: '2026-11-08' }];
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-09', checkIns: bloomed, aways }));
    expect(f).toMatchObject({ health: 'wilt' });
  });

  test('a missed day before a pause and one after are still in a row', () => {
    const pauses = [{ start: '2026-11-06', end: '2026-11-09' }];
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-10', checkIns: bloomed, pauses }));
    expect(f.health).toBe('dormant');
  });
});

describe('N days a week', () => {
  const schedule = { kind: 'perWeek' as const, times: 3 };

  test('no miss while the weekly target is still reachable', () => {
    // Week Sun Nov 1 to Sat Nov 7. Planted Sunday. Nothing done through Wednesday.
    const f = evaluateFlower(history({ startDay: S, today: '2026-11-05', schedule }));
    expect(f.health).toBe('ok');
    const days = classifyDays(history({ startDay: S, today: '2026-11-05', schedule }));
    expect(days.filter((d) => d.status === 'rest').map((d) => d.day)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']);
  });

  test('once the target cannot be reached, unfinished days are misses', () => {
    // End of Thursday with nothing done: only Fri and Sat left for 3 check-ins.
    const days = classifyDays(history({ startDay: S, today: '2026-11-06', schedule }));
    expect(days.find((d) => d.day === '2026-11-05')?.status).toBe('missed');
  });

  test('every completed day grows, extra days beyond the target are rest', () => {
    const checkIns = [done('2026-11-01'), done('2026-11-03'), done('2026-11-05')];
    const h = history({ startDay: S, today: '2026-11-07', schedule, checkIns });
    expect(evaluateFlower(h)).toMatchObject({ stage: 'bloom', bloomDays: 2, health: 'ok' });
    const days = classifyDays(h);
    expect(days.find((d) => d.day === '2026-11-06')?.status).toBe('rest');
  });

  test('the first week target is capped by the days left after planting', () => {
    // Planted Friday Nov 6, 3 a week: only Fri and Sat exist, so target is 2.
    const h = history({ startDay: '2026-11-06', today: '2026-11-08', schedule, checkIns: [done('2026-11-06'), done('2026-11-07')] });
    expect(evaluateFlower(h)).toMatchObject({ stage: 'bloom', health: 'ok' });
  });

  test('respects Monday week start', () => {
    // Week Mon Nov 2 to Sun Nov 8. Sunday Nov 1 belongs to the previous week (planted that day, capped to 1).
    const h = history({ startDay: '2026-11-02', today: '2026-11-06', schedule, weekStart: 1 });
    expect(evaluateFlower(h).health).toBe('ok');
  });
});

describe('per-window mode', () => {
  const windows = [
    { start: '07:00', end: '09:00' },
    { start: '18:00', end: '20:00' },
  ];

  test('every window must be complete for the day to count', () => {
    const h = history({ startDay: S, today: '2026-11-03', windows, windowMode: 'per', checkIns: [done(S, 0), done(S, 1), done('2026-11-02', 0)] });
    const days = classifyDays(h);
    expect(days.find((d) => d.day === '2026-11-02')?.status).toBe('partial');
  });

  test('any-window mode needs one complete slot', () => {
    const h = history({ startDay: S, today: S, windows, windowMode: 'any', checkIns: [done(S, 0)] });
    expect(classifyDays(h)[0].status).toBe('done');
  });
});

describe('bestStreak', () => {
  test('counts completed days and breaks on a miss', () => {
    expect(bestStreak([{ effect: 'grow' }, { effect: 'grow' }, { effect: 'none' }, { effect: 'grow' }, { effect: 'miss' }, { effect: 'grow' }])).toBe(3);
  });
});

describe('history stats', () => {
  test('completion, total check-ins and longest bloom', () => {
    // Done Nov 1 to 5 (bloom 4 days), miss 6 and 7 (dried up), done 8 and 9.
    const h = history({ startDay: S, today: '2026-11-09', checkIns: [...doneRange(S, '2026-11-05'), ...doneRange('2026-11-08', '2026-11-09')] });
    const st = historyStats(classifyDays(h));
    expect(st).toEqual({ bestStreak: 5, completion: 78, totalCheckIns: 7, longestBloom: 4 });
  });

  test('a new habit has no stats yet', () => {
    expect(historyStats(classifyDays(history({ startDay: S, today: S })))).toEqual({ bestStreak: 0, completion: 0, totalCheckIns: 0, longestBloom: 0 });
  });
});
