/**
 * Local notification plan. Pure: given habits and their state, returns the
 * notifications to schedule for the next two days. The app cancels and
 * reschedules the whole plan whenever data changes (iOS keeps at most 64).
 */
import { addDays, parseTime } from './day';
import { scheduleOn } from './rules';
import { isScheduledWeekday } from './schedule';
import type { DayResetHour, FlowerState, Habit, LocalDay, NotificationPrefs } from './types';
import { FLOWER_NAMES } from '@/flower/kinds';

export const MAX_SCHEDULED = 60;
export const WINDOW_CLOSING_LEAD = 30;
export const WILT_WARNING_TIME = '09:00';

export type PlannedNotification = {
  id: string;
  /** Local wall-clock moment. */
  at: Date;
  title: string;
  body: string;
  habitId: string;
  kind: 'reminder' | 'windowClosing' | 'wilting';
};

export type PlanHabit = {
  habit: Pick<Habit, 'id' | 'name' | 'flowerKind' | 'schedule' | 'windows' | 'reminders' | 'pausedAt'>;
  flower: Pick<FlowerState, 'health' | 'stage'>;
  /** Whether today is already complete. */
  doneToday: boolean;
  /** Whether today counts (scheduled and not away/paused). */
  dueToday: boolean;
};

function at(day: LocalDay, time: string, resetHour: DayResetHour): Date {
  const [y, m, d] = day.split('-').map(Number);
  const mins = parseTime(time);
  const date = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0, 0);
  // Times before the reset hour belong to the next calendar date.
  if (mins < resetHour * 60) date.setDate(date.getDate() + 1);
  return date;
}

export function planNotifications(opts: {
  habits: PlanHabit[];
  prefs: NotificationPrefs;
  away: boolean;
  today: LocalDay;
  now: Date;
  resetHour: DayResetHour;
}): PlannedNotification[] {
  const { habits, prefs, away, today, now, resetHour } = opts;
  if (away) return [];
  const out: PlannedNotification[] = [];
  const days = [today, addDays(today, 1)];

  for (const { habit, flower, doneToday, dueToday } of habits) {
    if (habit.pausedAt) continue;
    for (const day of days) {
      const isToday = day === today;
      if (isToday && doneToday) continue;
      const scheduled = isToday ? dueToday : isScheduledWeekday(habit, day) || scheduleOn(habit, day).kind === 'perWeek';
      if (!scheduled) continue;

      if (prefs.reminders) {
        for (const r of habit.reminders) {
          out.push({ id: `rem:${habit.id}:${day}:${r}`, at: at(day, r, resetHour), title: habit.name, body: 'Time to check in.', habitId: habit.id, kind: 'reminder' });
        }
      }
      if (prefs.windowClosing) {
        habit.windows.forEach((w, i) => {
          const end = parseTime(w.end) - WINDOW_CLOSING_LEAD;
          const hh = String(Math.floor(end / 60)).padStart(2, '0');
          const mm = String(end % 60).padStart(2, '0');
          out.push({
            id: `win:${habit.id}:${day}:${i}`,
            at: at(day, `${hh}:${mm}`, resetHour),
            title: habit.name,
            body: `Check-in window closes in ${WINDOW_CLOSING_LEAD} minutes.`,
            habitId: habit.id,
            kind: 'windowClosing',
          });
        });
      }
    }

    // Warn tomorrow morning if today ends without a check-in.
    if (prefs.wilting && dueToday && !doneToday && flower.health !== 'dormant' && scheduleOn(habit, today).kind !== 'perWeek') {
      const name = FLOWER_NAMES[habit.flowerKind];
      const dries = flower.health === 'wilt' || flower.stage === 'seed';
      out.push({
        id: `wilt:${habit.id}:${today}`,
        at: at(addDays(today, 1), WILT_WARNING_TIME, resetHour),
        title: dries ? `Your ${name} dried up` : `Your ${name} is wilting`,
        body: dries ? `Check in to ${habit.name} to bring it back.` : `Check in to ${habit.name} to perk it back up.`,
        habitId: habit.id,
        kind: 'wilting',
      });
    }
  }

  return out
    .filter((n) => n.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}

/** Bloom streak milestones that earn an Activity notice. */
export const MILESTONES = [1, 7, 30, 100];

