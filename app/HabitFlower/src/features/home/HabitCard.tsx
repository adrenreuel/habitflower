import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatTimeOfDay } from '@/domain/day';
import { minutesToTime } from '@/domain/windows';
import { Flower } from '@/flower/Flower';
import type { DotState, HabitView } from '@/state/selectors';
import { colors, flowerColors, radius, tint } from '@/theme/tokens';
import { Pill } from '@/ui/Chip';
import { Text } from '@/ui/Text';

export function BloomCount({ count, wilting, ring = colors.card }: { count: number; wilting?: boolean; ring?: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${count} days in bloom${wilting ? ', paused' : ''}`}
      style={[styles.count, { borderColor: ring }]}
    >
      <Text size={12} weight={800} color={wilting ? colors.wilting : colors.text} lineHeight={15}>
        {count}
      </Text>
    </View>
  );
}

export function FlowerTile({ view, size = 52 }: { view: Pick<HabitView, 'habit' | 'flower'>; size?: number }) {
  const { habit, flower } = view;
  const showCount = flower.stage === 'bloom' && flower.health !== 'dormant' && flower.bloomDays > 1; // no number on the bloom day itself
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: tint(flowerColors[habit.flowerKind], 0.14) }]}>
      <Flower kind={habit.flowerKind} stage={flower.stage} health={flower.health} size={Math.round(size * 0.85)} />
      {showCount ? <BloomCount count={flower.bloomDays} wilting={flower.health === 'wilt'} /> : null}
    </View>
  );
}

function statusChip(v: HabitView): { label: string; bg: string; fg: string; icon?: 'check' | 'clock' | 'camera' } | null {
  const color = flowerColors[v.habit.flowerKind];
  if (v.status === 'rest') return null;
  if (v.status === 'done') return { label: 'Done', bg: color, fg: colors.onAccent, icon: 'check' };
  if (v.status === 'later' && v.window.kind === 'upcoming') {
    const t = formatTimeOfDay(minutesToTime(v.window.opensAt)).replace(':00', '');
    return { label: t, bg: colors.divider, fg: colors.chipMutedText, icon: 'clock' };
  }
  if (v.habit.checkinType === 'photo') return { label: 'Snap', bg: color, fg: colors.onAccent, icon: 'camera' };
  if (v.habit.checkinType === 'count' || v.habit.checkinType === 'list') {
    return { label: `${v.today.amount}/${v.today.target}`, bg: tint(color, 0.2), fg: color };
  }
  return { label: 'To do', bg: colors.divider, fg: colors.chipMutedText };
}

function Dot({ state, color }: { state: DotState; color: string }) {
  if (state === 'off') return <View style={styles.dash} />;
  const fill =
    state === 'done' || state === 'todayDone'
      ? color
      : state === 'part' || state === 'today'
        ? tint(color, 0.4)
        : state === 'miss'
          ? colors.missedDot
          : colors.divider;
  const ringColor = state === 'todayRest' ? colors.restRing : color;
  const isToday = state === 'today' || state === 'todayDone' || state === 'todayRest';
  if (!isToday) return <View style={[styles.dot, { backgroundColor: fill }]} />;
  return (
    <View style={[styles.todayRing, { borderColor: ringColor }]}>
      <View style={[styles.dot, { backgroundColor: fill }]} />
    </View>
  );
}

export function WeekDots({ week, kind }: { week: DotState[]; kind: HabitView['habit']['flowerKind'] }) {
  return (
    <View style={styles.week} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {week.map((s, i) => (
        <Dot key={i} state={s} color={flowerColors[kind]} />
      ))}
    </View>
  );
}

export function HabitCard({ view, width }: { view: HabitView; width?: number }) {
  const chip = statusChip(view);
  const metaColor = view.metaTone === 'wilting' ? colors.wilting : view.metaTone === 'driedUp' ? colors.driedUp : colors.text2;
  const label = [view.habit.name, chip?.label ?? 'Rest day', view.meta].join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(`/habit/${view.habit.id}`)}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : { flex: 1 },
        { opacity: view.status === 'rest' ? 0.55 : 1 },
        pressed && { backgroundColor: colors.cardPressed },
      ]}
    >
      <View style={styles.top}>
        <FlowerTile view={view} />
        {chip ? <Pill label={chip.label} bg={chip.bg} fg={chip.fg} icon={chip.icon} /> : null}
      </View>
      <View style={{ gap: 2 }}>
        <Text size={16} weight={700} lineHeight={20} numberOfLines={2}>
          {view.habit.name}
        </Text>
        <Text size={13} weight={600} color={metaColor} numberOfLines={1}>
          {view.meta}
        </Text>
      </View>
      <WeekDots week={view.week} kind={view.habit.flowerKind} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, borderCurve: 'continuous', padding: 14, gap: 10, minHeight: 160 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tile: { borderRadius: 16, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  count: {
    position: 'absolute',
    // Mockup: 22px pill at right -10 / bottom -6 with a 3px ring outside it.
    right: -13,
    bottom: -9,
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'content-box',
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dash: { width: 12, height: 4, borderRadius: 2, backgroundColor: colors.divider },
  todayRing: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', margin: -4 },
});
