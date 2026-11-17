import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { dayOfMonth, localDay, monthShort } from '@/domain/day';
import { evaluateFlower } from '@/domain/flower';
import type { Habit } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { historyFor, useToday } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors, glass, tint } from '@/theme/tokens';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** The glass dome drawn over a paused flower (empty when nothing is paused). */
function Dome({ children, scale = 1 }: { children?: React.ReactNode; scale?: number }) {
  return (
    <View style={{ width: 64 * scale, height: 72 * scale }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {children ? <View style={{ position: 'absolute', left: 10, top: 20 }}>{children}</View> : null}
      <Svg width={64 * scale} height={72 * scale} viewBox="0 0 64 72" style={StyleSheet.absoluteFill}>
        <Path d="M10 64V30a22 22 0 0 1 44 0v34z" fill={glass.fill} stroke={glass.stroke} strokeWidth={1.6} />
        <Path d="M17 57V31a15 15 0 0 1 8-13" fill="none" stroke={glass.shine} strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={32} cy={6} r={3.2} fill={glass.knob} stroke={glass.stroke} strokeWidth={1.4} />
        <Rect x={5} y={63} width={54} height={7} rx={3.5} fill={glass.base} />
      </Svg>
    </View>
  );
}

function pausedLabel(h: Habit, today: string, resetHour: 0 | 2 | 4): string {
  if (!h.pausedAt) return '';
  const d = localDay(new Date(h.pausedAt), resetHour);
  return d === today ? 'Paused today' : `Paused ${monthShort(d)} ${dayOfMonth(d)}`;
}

export default function PausedHabits() {
  const today = useToday();
  const habits = useStore((s) => s.habits);
  const state = useStore();
  const restoreHabit = useStore((s) => s.restoreHabit);
  const pauseHabit = useStore((s) => s.pauseHabit);
  const [last, setLast] = useState<Habit | null>(null);
  const paused = habits.filter((h) => h.pausedAt).sort((a, b) => (b.pausedAt ?? '').localeCompare(a.pausedAt ?? ''));

  return (
    <Screen contentStyle={paused.length === 0 ? { flexGrow: 1 } : undefined}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to Habits" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
        <Icon name="back" size={22} color={colors.chipMutedText} />
        <Text size={16} weight={600} color={colors.chipMutedText}>
          Habits
        </Text>
      </Pressable>
      <View style={{ gap: 6, marginTop: 12, marginBottom: 16 }}>
        <Text size={30} display accessibilityRole="header">
          Paused
        </Text>
        <Text size={14} weight={500} color={colors.text2} lineHeight={20}>
          Kept safe under glass. Days here don’t count as missed.
        </Text>
      </View>

      {last ? (
        <View accessibilityRole="alert" style={styles.toast}>
          <Icon name="check" size={18} color={glass.toastText} strokeWidth={2.8} />
          <Text size={14} weight={600} color={glass.toastText} style={{ flex: 1 }}>
            {last.name} is back on your Habits screen
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              pauseHabit(last.id);
              setLast(null);
            }}
            style={{ height: 32, paddingHorizontal: 10, justifyContent: 'center' }}
          >
            <Text size={14} weight={800}>
              Undo
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        {paused.map((h) => {
          const f = evaluateFlower(historyFor(h, state, today));
          return (
            // The whole card opens the habit; Restore is its own button inside it.
            <Pressable
              key={h.id}
              accessibilityRole="button"
              accessibilityLabel={`${h.name}, ${pausedLabel(h, today, state.user.settings.dayResetHour)}`}
              onPress={() => router.push(`/habit/${h.id}`)}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.cardPressed }]}
            >
              <Dome>
                <Flower kind={h.flowerKind} stage={f.stage} health={f.health} size={44} />
              </Dome>
              <View style={{ flex: 1, gap: 2 }}>
                <Text size={16} weight={700}>
                  {h.name}
                </Text>
                <Text size={13} weight={500} color={colors.text2}>
                  {pausedLabel(h, today, state.user.settings.dayResetHour)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Restore ${h.name}`}
                onPress={() => {
                  restoreHabit(h.id);
                  setLast(h);
                }}
                style={styles.restore}
              >
                <Text size={14} weight={800} color={colors.accentTintText}>
                  Restore
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      {paused.length === 0 ? (
        <View style={styles.empty}>
          <Dome scale={1.75} />
          <Text size={22} display align="center" accessibilityRole="header">
            Nothing paused
          </Text>
          <Text size={15} weight={500} color={colors.text2} align="center" lineHeight={22} style={{ maxWidth: 280 }}>
            Need a break from a habit? Pause it from its Edit screen.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 60 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingRight: 8 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderCurve: 'continuous', backgroundColor: tint(colors.accent, 0.16), marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.card },
  restore: { height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.accentTint, justifyContent: 'center' },
});
