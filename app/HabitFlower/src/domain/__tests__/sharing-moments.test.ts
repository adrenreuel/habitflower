import { growthMoment } from '../moments';
import { formatNameList, historyHint, historyRowLabel } from '../sharing';
import type { HabitSharing } from '../types';
import { firstUnusedFlower } from '@/flower/kinds';

describe('name lists', () => {
  test('1 to 4+ friends', () => {
    expect(formatNameList(['a'])).toBe('@a');
    expect(formatNameList(['a', 'b'])).toBe('@a and @b');
    expect(formatNameList(['a', 'b', 'c'])).toBe('@a, @b and @c');
    expect(formatNameList(['a', 'b', 'c', 'd'])).toBe('@a, @b and 2 others');
    expect(formatNameList(['@a'])).toBe('@a');
  });

  test('history hints', () => {
    expect(historyHint('nobody', [])).toBe('Friends see your flower, streak and this week. Older days stay private.');
    expect(historyHint('close', ['maya', 'sam'])).toBe('@maya and @sam see everything. Everyone else sees this week.');
    expect(historyHint('everyone', [])).toBe('Everyone above can open the calendar and stats, back to day one.');
  });

  test('History row', () => {
    const s = (p: HabitSharing['progress'], history?: HabitSharing['history']): HabitSharing => ({ progress: p, photos: 'same', history });
    expect(historyRowLabel(s({ kind: 'everyone' }))).toBe('This week');
    expect(historyRowLabel(s({ kind: 'everyone' }, 'close'))).toBe('Close friends');
    expect(historyRowLabel(s({ kind: 'everyone' }, 'everyone'))).toBe('Full history');
    expect(historyRowLabel(s({ kind: 'friends', userIds: [] }, 'everyone'))).toBe('Only you');
  });
});

describe('growth moments', () => {
  const f = (stage: 'seed' | 'bud' | 'bloom', health: 'ok' | 'wilt' | 'dormant' = 'ok', bloomDays = 0) => ({ stage, health, bloomDays });
  test('stage changes', () => {
    expect(growthMoment(f('seed'), f('bud'))).toBe('budded');
    expect(growthMoment(f('bud'), f('bloom', 'ok', 1))).toBe('bloomed');
    expect(growthMoment(f('bloom', 'ok', 29), f('bloom', 'ok', 30))).toBe('milestone30');
    expect(growthMoment(f('bloom', 'ok', 30), f('bloom', 'ok', 31))).toBeNull();
    expect(growthMoment(f('bloom', 'ok', 4), f('bloom', 'ok', 5))).toBeNull();
  });
  test('recovery and revive', () => {
    expect(growthMoment(f('bloom', 'wilt', 4), f('bloom', 'ok', 4))).toBe('recovered');
    expect(growthMoment(f('bloom', 'dormant'), f('bud'))).toBe('revivedBud');
    expect(growthMoment(f('seed', 'dormant'), f('seed'))).toBe('revivedSprout');
  });
});

test('new habits default to an unused flower', () => {
  expect(firstUnusedFlower([])).toBe('sunflower');
  expect(firstUnusedFlower(['sunflower', 'daisy'])).toBe('tulip');
});
