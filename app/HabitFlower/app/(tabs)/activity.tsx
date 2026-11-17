/**
 * Activity tab. v1 shows personal notices (wilting, dried up, blooms and
 * bloom streaks). Social notices join in v1.1.
 */
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { diffDays, formatDay, formatTimeOfDay, localDay, weekday, weekdayLong } from '@/domain/day';
import { evaluateFlower } from '@/domain/flower';
import type { AppNotification, Habit } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { historyFor, useToday } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors, flowerColors, tint } from '@/theme/tokens';
import { Icon, type IconName } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import { Grain } from '@/ui/Grain';

const BADGE: Partial<Record<AppNotification['kind'], { icon: IconName; bg: string; fg: string }>> = {
  wilting: { icon: 'alert', bg: colors.badge, fg: colors.badgeText },
  driedUp: { icon: 'alert', bg: colors.driedUp, fg: colors.onDelete },
  milestone: { icon: 'star', bg: flowerColors.sunflower, fg: colors.onSunflower },
};

function text(n: AppNotification): string {
  switch (n.kind) {
    case 'wilting':
      return 'is wilting. Check in today to perk it up.';
    case 'driedUp':
      return 'dried up. Check in to bring it back.';
    case 'milestone': {
      const d = Number(n.data.bloomDays ?? 0);
      return d <= 1 ? 'reached full bloom' : `has been in bloom for ${d} days`;
    }
    default:
      return '';
  }
}

function when(iso: string, today: string, resetHour: 0 | 2 | 4): string {
  const d = new Date(iso);
  const day = localDay(d, resetHour);
  const ago = diffDays(day, today);
  if (ago === 0) return formatTimeOfDay(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  if (ago === 1) return 'Yesterday';
  if (ago < 7) return weekdayLong(weekday(day));
  return formatDay(day);
}

function Item({ n, habit, last, today }: { n: AppNotification; habit: Habit | undefined; last: boolean; today: string }) {
  const state = useStore();
  const badge = BADGE[n.kind];
  if (!habit || !badge) return null;
  const f = evaluateFlower(historyFor(habit, state, today));
  const actionable = (n.kind === 'wilting' || n.kind === 'driedUp') && !n.readAt;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${habit.name} ${text(n)}`}
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={({ pressed }) => [styles.item, !last && styles.divider, pressed && { backgroundColor: colors.cardPressed }]}
    >
      <View>
        <View style={[styles.flower, { backgroundColor: tint(flowerColors[habit.flowerKind], 0.16) }]}>
          <Flower kind={habit.flowerKind} stage={f.stage} health={f.health} size={38} />
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Icon name={badge.icon} size={12} color={badge.fg} strokeWidth={3} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text size={14.5} weight={500} lineHeight={20}>
          <Text size={14.5} weight={700}>
            {habit.name}
          </Text>{' '}
          {text(n)}
        </Text>
        <Text size={12} weight={500} color={colors.text3} style={{ marginTop: 2 }}>
          {when(n.createdAt, today, state.user.settings.dayResetHour)}
        </Text>
      </View>
      {actionable ? (
        <View style={styles.action}>
          <Text size={13.5} weight={800} color={colors.accentTintText}>
            Check in
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const notifications = useStore((s) => s.notifications);
  const habits = useStore((s) => s.habits);
  const markRead = useStore((s) => s.markNotificationsRead);

  // Unread stay under "New" while the tab is open; they count as read once you leave.
  useFocusEffect(useCallback(() => () => markRead(), [markRead]));

  const byId = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);
  const visible = notifications.filter((n) => byId.has(n.habitId ?? '')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups = [
    { title: 'New', items: visible.filter((n) => !n.readAt) },
    { title: 'Earlier', items: visible.filter((n) => n.readAt).slice(0, 50) },
  ].filter((g) => g.items.length);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text size={30} display accessibilityRole="header">
          Activity
        </Text>
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyArt} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Flower kind="lavender" stage="bud" size={104} />
              <View style={styles.moon}>
                <Svg width={30} height={30} viewBox="0 0 24 24">
                  <Path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill={colors.infoText} />
                </Svg>
              </View>
              <View style={[styles.star, { right: 40, top: 10, width: 4, height: 4, opacity: 0.6 }]} />
              <View style={[styles.star, { left: 22, top: 26, width: 3, height: 3, opacity: 0.5 }]} />
            </View>
            <Text size={22} display>
              All quiet
            </Text>
            <Text size={15} weight={500} color={colors.text2} align="center">
              Reminders, nudges and reactions show up here.
            </Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.title} style={{ gap: 8, marginTop: 4 }}>
              <Text label accessibilityRole="header">
                {g.title}
              </Text>
              <View style={styles.card}>
                {g.items.map((n, i) => (
                  <Item key={n.id} n={n} habit={byId.get(n.habitId ?? '')} last={i === g.items.length - 1} today={today} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32, gap: 12 },
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 10, paddingLeft: 14, paddingRight: 12 },
  flower: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  badge: { position: 'absolute', right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  action: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.accentTint, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 40 },
  emptyArt: { width: 140, height: 120, alignItems: 'center', justifyContent: 'flex-end' },
  moon: { position: 'absolute', right: 6, top: 2, opacity: 0.85 },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: colors.infoText },
});
