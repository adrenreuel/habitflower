import {
  addDays,
  addMonths,
  diffDays,
  formatDay,
  formatDayTime,
  formatTimeOfDay,
  localDay,
  startOfWeek,
  weekday,
} from '../day';

describe('localDay and the day-reset hour', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 21, h, m); // Sat Nov 21 2026, local time

  test('midnight reset', () => {
    expect(localDay(at(0, 30), 0)).toBe('2026-11-21');
    expect(localDay(at(23, 59), 0)).toBe('2026-11-21');
  });

  test('check-ins before the reset hour count for the previous day', () => {
    expect(localDay(at(1, 59), 2)).toBe('2026-11-20');
    expect(localDay(at(2, 0), 2)).toBe('2026-11-21');
    expect(localDay(at(3, 30), 4)).toBe('2026-11-20');
    expect(localDay(at(4, 0), 4)).toBe('2026-11-21');
  });

  test('works across month and year boundaries', () => {
    expect(localDay(new Date(2027, 0, 1, 1, 0), 2)).toBe('2026-12-31');
  });
});

describe('calendar arithmetic', () => {
  test('addDays across DST and months', () => {
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('addMonths clamps to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15');
  });

  test('weekday and week start', () => {
    expect(weekday('2026-11-21')).toBe(6);
    expect(startOfWeek('2026-11-21', 0)).toBe('2026-11-15');
    expect(startOfWeek('2026-11-21', 1)).toBe('2026-11-16');
    expect(startOfWeek('2026-11-15', 1)).toBe('2026-11-09');
  });

  test('diffDays', () => {
    expect(diffDays('2026-11-01', '2026-11-21')).toBe(20);
  });
});

describe('formatting follows the copy rules', () => {
  test('dates like "Sat, Nov 21"', () => {
    expect(formatDay('2026-11-21')).toBe('Sat, Nov 21');
  });

  test('"Today, 6:00 PM"', () => {
    expect(formatDayTime('2026-11-21', '18:00', '2026-11-21')).toBe('Today, 6:00 PM');
    expect(formatDayTime('2026-11-22', null, '2026-11-21')).toBe('Tomorrow');
  });

  test('12-hour times', () => {
    expect(formatTimeOfDay('00:05')).toBe('12:05 AM');
    expect(formatTimeOfDay('12:00')).toBe('12:00 PM');
  });
});
