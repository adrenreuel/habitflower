/**
 * Side effects that follow app data: local notification schedule, personal
 * Activity notices (wilting, dried up, bloom milestones) and the widget
 * snapshot. Runs whenever data changes and when the app comes to the front.
 */
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { syncNow } from '@/api/sync';
import { MILESTONES, planNotifications } from '@/domain/notifications';
import { repo } from '@/data/repo';
import { writeWidgetSnapshot } from '@/widgets/snapshot';
import { buildHabitView, checkInsByHabit } from './selectors';
import { useStore, type AppStore } from './store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function notificationsAllowed(): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotifications(): Promise<boolean> {
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  return p.granted;
}

function views(s: AppStore, now: Date) {
  const byHabit = checkInsByHabit(s.checkIns);
  return s.habits.map((h) => buildHabitView(h, s, now, byHabit));
}

async function reschedule(s: AppStore) {
  if (!(await notificationsAllowed())) return;
  const now = new Date();
  const plan = planNotifications({
    habits: views(s, now).map((v) => ({ habit: v.habit, flower: v.flower, doneToday: v.today.complete, dueToday: v.dueToday && !s.user.settings.away })),
    prefs: s.user.settings.notifications,
    away: s.user.settings.away,
    today: s.today(),
    now,
    resetHour: s.user.settings.dayResetHour,
  });
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { habitId: n.habitId, kind: n.kind } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
    });
  }
}

/** Adds Activity notices once per habit per event. */
function notices(s: AppStore) {
  const seen = repo.getKV<Record<string, true>>('notices') ?? {};
  const now = new Date();
  const today = s.today();
  let changed = false;
  for (const v of views(s, now)) {
    if (v.habit.pausedAt) continue;
    const f = v.flower;
    const add = (key: string, n: Parameters<AppStore['addNotification']>[0]) => {
      if (seen[key]) return;
      seen[key] = true;
      changed = true;
      s.addNotification(n);
    };
    if (f.health === 'wilt') add(`wilt:${v.habit.id}:${today}`, { kind: 'wilting', habitId: v.habit.id, data: {} });
    // One "dried up" notice per dry spell; cleared once it is revived.
    const dryKey = `dry:${v.habit.id}`;
    if (f.health === 'dormant') add(dryKey, { kind: 'driedUp', habitId: v.habit.id, data: {} });
    else if (seen[dryKey]) {
      delete seen[dryKey];
      changed = true;
    }
    if (f.health === 'ok' && f.stage === 'bloom' && MILESTONES.includes(f.bloomDays)) {
      add(`bloom:${v.habit.id}:${f.bloomDays}:${today}`, { kind: 'milestone', habitId: v.habit.id, data: { bloomDays: f.bloomDays } });
    }
  }
  if (changed) repo.setKV('notices', seen);
}

export function useAppEffects(ready: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;
    const run = () => {
      const s = useStore.getState();
      if (!s.onboarded) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const st = useStore.getState();
        notices(st);
        reschedule(st).catch(() => {});
        writeWidgetSnapshot(st).catch(() => {});
        syncNow().catch(() => {});
      }, 400);
    };
    run();
    const unsub = useStore.subscribe((s, prev) => {
      if (s.habits !== prev.habits || s.checkIns !== prev.checkIns || s.pauses !== prev.pauses || s.aways !== prev.aways || s.tasks !== prev.tasks || s.user !== prev.user || s.onboarded !== prev.onboarded) run();
    });
    const sub = AppState.addEventListener('change', (st) => st === 'active' && run());
    return () => {
      unsub();
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready]);

  // Tapping a notification opens that habit.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const habitId = r.notification.request.content.data?.habitId;
      if (typeof habitId === 'string') {
        import('expo-router').then(({ router }) => router.push(`/habit/${habitId}`));
      }
    });
    return () => sub.remove();
  }, []);
}
