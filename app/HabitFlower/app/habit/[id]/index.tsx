import { BlurView } from 'expo-blur';
import { useNetworkState } from 'expo-network';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatTimeOfDay } from '@/domain/day';
import type { CheckinValue, FlowerState } from '@/domain/types';
import { growthMoment } from '@/domain/moments';
import { Celebration, type CelebrationInfo } from '@/features/habit/Celebration';
import { GrowthMomentScreen, type GrowthMomentInfo } from '@/features/habit/GrowthMoment';
import { HistoryCard, HistorySheet } from '@/features/habit/History';
import { shortRange, TodayCard } from '@/features/habit/TodayCard';
import { FLOWER_NAMES } from '@/flower/kinds';
import { SwayingFlower } from '@/flower/SwayingFlower';
import { buildHabitView, scheduleLabel, useHabitView, useNow } from '@/state/selectors';
import { useStore } from '@/state/store';
import { calendar, colors, driedUpPageColor, flowerColors, lighten, space, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Group, Row } from '@/ui/Card';
import { Grain } from '@/ui/Grain';
import { Icon } from '@/ui/Icon';
import { PageTint } from '@/ui/PageTint';
import { Text } from '@/ui/Text';

function joinAnd(parts: string[]): string {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Only a healthy bloom gets a chip; sprout, bud, wilting and dried up show none. */
function BloomChip({ flower, color }: { flower: FlowerState; color: string }) {
  if (flower.stage !== 'bloom' || flower.health !== 'ok') return null;
  const fg = lighten(color, 0.5);
  return (
    <View style={[styles.chip, { backgroundColor: tint(color, 0.16) }]}>
      <Icon name="sparkle" size={14} color={fg} />
      <Text size={13} weight={700} color={fg}>
        {flower.bloomDays <= 1 ? 'Just bloomed' : `In bloom for ${flower.bloomDays} days`}
      </Text>
    </View>
  );
}

/** Height of the Back / Edit row. */
const TOP_BAR = 44;

export default function HabitPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  // Tick every second while a window is about to open (the countdown shows
  // seconds and the button unlocks on time); every 15s otherwise.
  const [tickMs, setTickMs] = useState(15_000);
  const now = useNow(tickMs);
  const view = useHabitView(id, tickMs);
  const counting = view?.window.kind === 'upcoming' && !view.today.complete;
  const scrollY = useRef(new Animated.Value(0)).current;
  const barBg = scrollY.interpolate({ inputRange: [8, 48], outputRange: [0, 1], extrapolate: 'clamp' });
  // The hero name sits about 250pt down; the small one takes over as it leaves.
  const barTitle = scrollY.interpolate({ inputRange: [230, 270], outputRange: [0, 1], extrapolate: 'clamp' });
  useEffect(() => setTickMs(counting ? 1000 : 15_000), [counting]);
  const weekStart = useStore((s) => s.user.settings.weekStart);
  const { setCheckIn, clearCheckIn, restoreHabit } = useStore.getState();
  const network = useNetworkState();
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const [moment, setMoment] = useState<GrowthMomentInfo | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revived, setRevived] = useState(false);

  const dayMap = useMemo(() => new Map((view?.days ?? []).map((d) => [d.day, d])), [view?.days]);

  if (!view) return null;
  const { habit, flower } = view;
  const color = flowerColors[habit.flowerKind];
  const todayDay = view.history.today;

  const act = (slot: number, value: CheckinValue | null) => {
    const before = view.flower;
    const wasComplete = view.today.complete;
    if (value) setCheckIn(habit.id, todayDay, slot, value);
    else clearCheckIn(habit.id, todayDay, slot);
    const st = useStore.getState();
    const fresh = st.habits.find((h) => h.id === habit.id);
    if (!fresh) return;
    const after = buildHabitView(fresh, st, new Date());
    if (!wasComplete && after.today.complete) {
      // A check-off revive keeps its inline card (with Undo) under the moment.
      if (before.health === 'dormant' && habit.checkinType === 'check') setRevived(true);
      const m = growthMoment(before, after.flower);
      if (m) setMoment({ moment: m, kind: habit.flowerKind, before, after: after.flower });
      else setCelebration({ kind: habit.flowerKind, before, after: after.flower });
    }
  };

  const undoToday = () => {
    view.today.rows.forEach((r) => clearCheckIn(habit.id, todayDay, r.slot));
    setRevived(false);
  };

  const subtitle =
    habit.checkinType === 'count'
      ? `${habit.config.countTarget} times ${habit.windowMode === 'per' && habit.windows.length > 1 ? 'per window' : 'a day'}, ${scheduleLabel(habit.schedule, weekStart).toLowerCase()}`
      : habit.schedule.kind === 'days'
        ? joinAnd(scheduleLabel(habit.schedule, weekStart).split(', '))
        : scheduleLabel(habit.schedule, weekStart);

  const dormantNow = flower.health === 'dormant' && !view.today.complete;
  const offline = network.isConnected === false;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <PageTint color={dormantNow ? driedUpPageColor : color} />
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        {/* Room for the pinned top bar. */}
        <View style={{ height: TOP_BAR }} />

        {offline ? (
          <View accessibilityRole="alert" style={styles.offline}>
            <Icon name="offline" size={18} color={colors.chipMutedText} />
            <Text size={13.5} weight={600} color={colors.chipMutedText} style={{ flex: 1 }}>
              You’re offline. Check-ins will sync later.
            </Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <SwayingFlower
            kind={habit.flowerKind}
            stage={flower.stage}
            health={flower.health}
            size={156}
            box={{ width: 170, height: 164 }}
            shadow
            // Dried up pages stay still and keep the flower's own soil.
            sway={flower.health !== 'dormant'}
          />
          <Text size={30} display align="center" accessibilityRole="header">
            {habit.name}
          </Text>
          <Text size={15} weight={500} color={colors.text2} align="center">
            {subtitle}
          </Text>
          {flower.stage === 'bloom' && flower.health === 'ok' ? (
            <View style={{ marginTop: 4 }}>
              <BloomChip flower={flower} color={color} />
            </View>
          ) : null}
        </View>

        {habit.pausedAt ? (
          <View style={styles.revive}>
            <Text size={19} weight={800}>
              Paused
            </Text>
            <Text size={14.5} weight={500} color={colors.chipMutedText}>
              Days while paused don’t count as missed.
            </Text>
            <Button title="Restore" height={52} onPress={() => restoreHabit(habit.id)} />
          </View>
        ) : revived ? (
          <View style={[styles.revive, { backgroundColor: tint(colors.accent, 0.12) }]} accessibilityLiveRegion="polite">
            <Text size={19} weight={800} color={calendar.revivedTitle}>
              Revived!
            </Text>
            <Text size={14.5} weight={500} color={calendar.revivedBody} lineHeight={21}>
              {flower.stage === 'seed'
                ? `Your ${FLOWER_NAMES[habit.flowerKind]} is growing again. Check in tomorrow and it buds.`
                : `Your ${FLOWER_NAMES[habit.flowerKind]} is a bud again. Check in tomorrow and it blooms.`}
            </Text>
            <Pressable accessibilityRole="button" onPress={undoToday} style={styles.undoRevive}>
              <Text size={14} weight={700} color={calendar.revivedTitle}>
                Undo check-in
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {dormantNow ? (
              <View style={styles.revive}>
                <View style={{ gap: 6 }}>
                  <Text size={19} weight={800}>
                    Your {FLOWER_NAMES[habit.flowerKind]} dried up
                  </Text>
                  <Text size={14.5} weight={500} color={colors.chipMutedText} lineHeight={21}>
                    You missed {flower.missStreak} {flower.missStreak === 1 ? 'day' : 'days'} in a row.
                  </Text>
                </View>
                {habit.checkinType === 'check' && view.window.kind !== 'upcoming' && view.window.kind !== 'closed' ? (
                  <Button title="Check in to revive" icon="drop" height={56} onPress={() => act(0, { kind: 'check' })} />
                ) : null}
              </View>
            ) : null}
            {!(dormantNow && habit.checkinType === 'check' && view.window.kind !== 'upcoming' && view.window.kind !== 'closed') ? (
              <TodayCard view={view} now={now} onAct={act} onUndo={undoToday} />
            ) : null}
          </>
        )}

        <HistoryCard
          list={view.days}
          days={dayMap}
          today={todayDay}
          weekStart={weekStart}
          color={color}
          startedToday={view.today.started}
          onPress={() => setHistoryOpen(true)}
        />

        <Group>
          <Row
            title="Reminders"
            value={habit.reminders.length ? habit.reminders.map((r) => formatTimeOfDay(r).replace(':00', '')).join(', ') : 'Off'}
            onPress={() => router.push(`/habit/${habit.id}/edit`)}
          />
          <Row
            title="Check-in window"
            value={habit.windows.length ? habit.windows.map(shortRange).join(', ') : 'Any time'}
            onPress={() => router.push(`/habit/${habit.id}/edit`)}
          />
        </Group>
      </Animated.ScrollView>

      {/* Pinned top bar: clear at the top of the page; a blurred background and
          the habit name fade in once you scroll past the hero. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: barBg }]} pointerEvents="none">
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tint(colors.bg, 0.72) }]} />
        </Animated.View>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Habits" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
            <Icon name="back" size={22} color={colors.chipMutedText} />
            <Text size={16} weight={600} color={colors.chipMutedText}>
              Habits
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${habit.name}`} onPress={() => router.push(`/habit/${habit.id}/edit`)} style={styles.edit}>
            <Icon name="pencil" size={16} color={colors.text} />
            <Text size={15} weight={600}>
              Edit
            </Text>
          </Pressable>
          <Animated.View style={[styles.barTitle, { opacity: barTitle }]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text size={16} weight={700} numberOfLines={1} align="center">
              {habit.name}
            </Text>
          </Animated.View>
        </View>
      </View>
      <HistorySheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        list={view.days}
        days={dayMap}
        today={todayDay}
        startDay={habit.startDay}
        weekStart={weekStart}
        color={color}
        startedToday={view.today.started}
      />
      <Celebration info={celebration} onClose={() => setCelebration(null)} />
      <GrowthMomentScreen info={moment} onClose={() => setMoment(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.page, paddingTop: 12, gap: 20 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.page, paddingBottom: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: TOP_BAR },
  // Centred between Back and Edit; narrow enough to never run under them.
  barTitle: { position: 'absolute', left: 104, right: 104, alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingRight: 8 },
  edit: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, marginTop: -6 },
  hero: { alignItems: 'center', gap: 10 },
  chip: { height: 28, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  revive: { backgroundColor: colors.card, borderRadius: 24, borderCurve: 'continuous', padding: 20, gap: 16 },
  undoRevive: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: tint(colors.accent, 0.18), justifyContent: 'center' },
});
