/**
 * Shares a small snapshot with the iOS widgets through the App Group.
 * The widget reads `snapshot` from UserDefaults(suiteName: APP_GROUP).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { formatTimeOfDay } from '@/domain/day';
import { minutesToTime } from '@/domain/windows';
import { buildHabitView, checkInsByHabit, type HabitView } from '@/state/selectors';
import type { AppStore } from '@/state/store';

export const APP_GROUP: string = (Constants.expoConfig?.extra?.appGroup as string | undefined) ?? 'group.com.habitflower.app';

export type WidgetFlower = {
  id: string;
  kind: string;
  stage: string;
  health: string;
  /** Days in bloom, 0 hides the pill. */
  count: number;
  status: 'due' | 'done' | 'rest' | 'later';
  /** Status line on the large widget. */
  label: string;
  /** 'wilting' | 'driedUp' | 'done' | 'due' | 'muted' for the label colour. */
  tone: string;
};

export type WidgetSnapshot = { leftToday: number; flowers: WidgetFlower[]; updatedAt: string };

function rank(v: HabitView): number {
  if (v.status === 'todo') return v.flower.health === 'wilt' ? 0 : v.flower.health === 'dormant' ? 1 : 2;
  return v.status === 'later' ? 3 : v.status === 'done' ? 4 : 5;
}

export function buildSnapshot(s: AppStore, now = new Date()): WidgetSnapshot {
  const byHabit = checkInsByHabit(s.checkIns);
  const views = s.habits.filter((h) => !h.pausedAt).map((h) => buildHabitView(h, s, now, byHabit));
  const sorted = [...views].sort((a, b) => rank(a) - rank(b) || a.habit.sortOrder - b.habit.sortOrder);
  const flowers = sorted.slice(0, 6).map((v): WidgetFlower => {
    const status: WidgetFlower['status'] = v.status === 'todo' ? 'due' : v.status;
    let label: string;
    let tone: string;
    if (v.flower.health === 'dormant') [label, tone] = ['Dried up', 'driedUp'];
    else if (v.flower.health === 'wilt') [label, tone] = ['Wilting', 'wilting'];
    else if (status === 'done') [label, tone] = ['Done', 'done'];
    else if (status === 'rest') [label, tone] = ['Rest day', 'muted'];
    else if (status === 'later' && v.window.kind === 'upcoming') [label, tone] = [`Opens ${formatTimeOfDay(minutesToTime(v.window.opensAt)).replace(':00', '')}`, 'muted'];
    else if (v.today.target > 1) [label, tone] = [`${v.today.amount} of ${v.today.target}`, 'due'];
    else [label, tone] = ['To do', 'due'];
    return {
      id: v.habit.id,
      kind: v.habit.flowerKind,
      stage: v.flower.stage,
      health: v.flower.health,
      count: v.flower.stage === 'bloom' && v.flower.health !== 'dormant' ? v.flower.bloomDays : 0,
      status,
      label,
      tone,
    };
  });
  const leftToday = views.filter((v) => v.dueToday && !v.today.complete).length;
  return { leftToday, flowers, updatedAt: now.toISOString() };
}

export async function writeWidgetSnapshot(s: AppStore): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    // Native module only exists in dev/production builds, not Expo Go.
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set('snapshot', JSON.stringify(buildSnapshot(s)));
    ExtensionStorage.reloadWidget();
  } catch {
    // Widgets unavailable (Expo Go, simulator without the target).
  }
}
