/**
 * The type-specific Today card on a habit page: Check off, Count (ring, or a
 * row per window), List, and the "Opens in" countdown when no window is open.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { emptyValue, increment, slotTarget, toggleItem, valueAmount } from '@/domain/checkin';
import { formatTimeOfDay, minutesOfDay, parseTime } from '@/domain/day';
import type { CheckinValue, CheckinWindow, Habit } from '@/domain/types';
import { canCheckIn, formatCountdown, secondsUntil, slotFor, windowState, type WindowState } from '@/domain/windows';
import type { HabitView } from '@/state/selectors';
import { calendar, colors, flowerColors, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type CheckInAction = (slot: number, value: CheckinValue | null) => void;

/** "7 to 9 AM", "11 AM to 1 PM", "6:30 to 8 PM" */
export function shortRange(w: CheckinWindow): string {
  const fmt = (t: string) => formatTimeOfDay(t).replace(':00', '');
  const a = fmt(w.start);
  const b = fmt(w.end);
  const [aTime, aMer] = a.split(' ');
  const [, bMer] = b.split(' ');
  return aMer === bMer ? `${aTime} to ${b}` : `${a} to ${b}`;
}

export function windowName(habit: Habit, index: number): string {
  const w = habit.windows[index];
  const m = parseTime(w.start);
  const name = m < 12 * 60 ? 'Morning' : m < 17 * 60 ? 'Afternoon' : 'Evening';
  const same = habit.windows.filter((x) => {
    const xm = parseTime(x.start);
    return (xm < 720 ? 'Morning' : xm < 1020 ? 'Afternoon' : 'Evening') === name;
  });
  return same.length > 1 ? `${name} ${same.indexOf(w) + 1}` : name;
}

/** "6:00 and 8:00 PM", or "11:00 AM and 1:00 PM" across noon. */
function betweenLabel(w: CheckinWindow): string {
  const a = formatTimeOfDay(w.start);
  const b = formatTimeOfDay(w.end);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} and ${b}` : `${a} and ${b}`;
}

function Header({ right, rightColor = colors.text2 }: { right?: string; rightColor?: string }) {
  return (
    <View style={styles.header}>
      <Text label>Today</Text>
      {right ? (
        <Text size={14} weight={700} color={rightColor} accessibilityLiveRegion="polite">
          {right}
        </Text>
      ) : null}
    </View>
  );
}

function Countdown({ state, habit, verb, now }: { state: Extract<WindowState, { kind: 'upcoming' }>; habit: Habit; verb: string; now: Date }) {
  const w = habit.windows[state.index];
  const secs = secondsUntil(state.opensAt, now);
  // VoiceOver reads minutes; announcing every second would be noise.
  const mins = Math.ceil(secs / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const spoken = h ? `${h} hour${h > 1 ? 's' : ''} ${m} minutes` : `${m} minutes`;
  return (
    <View style={{ gap: 16 }}>
      <View accessible accessibilityRole="timer" accessibilityLabel={`Check-in opens in ${spoken}`} style={{ alignItems: 'center', gap: 2, paddingVertical: 4 }}>
        <Text label>Opens in</Text>
        <Text size={46} weight={800} lineHeight={52} style={{ letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
          {formatCountdown(secs)}
        </Text>
        <Text size={14} weight={500} color={colors.text2}>
          Check in between {betweenLabel(w)}
        </Text>
      </View>
      <Button title={verb} disabled height={60} variant="secondary" textColor={colors.text3} />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_C = 2 * Math.PI * 68;

function Ring({ amount, target, color }: { amount: number; target: number; color: string }) {
  const p = Math.min(1, target ? amount / target : 0);
  const done = amount >= target;
  const reduced = useReducedMotion();
  // The arc slides to the new count instead of jumping.
  const progress = useRef(new Animated.Value(p)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(p);
      return;
    }
    const anim = Animated.timing(progress, { toValue: p, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [p, reduced, progress]);
  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [RING_C, 0] });
  return (
    <View style={{ width: 156, height: 156 }}>
      <Svg width={156} height={156} viewBox="0 0 156 156" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={78} cy={78} r={68} fill="none" stroke={colors.divider} strokeWidth={12} />
        <AnimatedCircle cx={78} cy={78} r={68} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${RING_C}`} strokeDashoffset={dashOffset} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 2 }]} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${amount} of ${target}. ${done ? 'Done for today' : `${target - amount} to go`}`}>
        <Text size={44} weight={800} lineHeight={48}>
          {amount}
          <Text size={22} weight={700} color={colors.text2}>
            {' '}/ {target}
          </Text>
        </Text>
        {/* "Done for today" lives in the card header (as on Check off), so the ring just shows a check. */}
        {done ? (
          <Icon name="check" size={18} color={color} strokeWidth={3} />
        ) : (
          <Text size={13} weight={600} color={colors.text2}>
            {`${target - amount} to go`}
          </Text>
        )}
      </View>
    </View>
  );
}

function RoundStep({ glyph, label, onPress, disabled, color, size = 64, filled }: { glyph: 'plus' | 'minus'; label: string; onPress: () => void; disabled?: boolean; color: string; size?: number; filled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: filled ? color : tint(color, 0.18),
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Icon name={glyph} size={size > 50 ? 28 : 20} color={filled ? colors.onAccent : color} strokeWidth={2.8} />
    </Pressable>
  );
}

function ListItems({ habit, value, onToggle, color, enabled }: { habit: Habit; value: CheckinValue; onToggle: (id: string) => void; color: string; enabled: boolean }) {
  const items = habit.config.listItems ?? [];
  const done = value.kind === 'list' ? value.done : [];
  return (
    <View accessibilityRole="list">
      {items.map((it, i) => {
        const on = done.includes(it.id);
        return (
          <Pressable
            key={it.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: !enabled }}
            disabled={!enabled}
            onPress={() => onToggle(it.id)}
            style={[styles.item, i < items.length - 1 && styles.itemDivider]}
          >
            <View style={[styles.box, { backgroundColor: on ? color : colors.divider }]}>{on ? <Icon name="check" size={16} color={colors.onAccent} strokeWidth={3.2} /> : null}</View>
            <Text size={16} weight={600} color={on ? colors.text3 : colors.text} style={[{ flex: 1 }, on && { textDecorationLine: 'line-through' }]}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function verbFor(_habit: Habit) {
  return 'Check in';
}

export function TodayCard({ view, now, onAct, onUndo }: { view: HabitView; now: Date; onAct: CheckInAction; onUndo: () => void }) {
  const { habit, today } = view;
  const color = flowerColors[habit.flowerKind];
  const nowMin = minutesOfDay(now);
  const perWindow = habit.windowMode === 'per' && habit.windows.length > 1;
  const valueFor = (slot: number) => today.rows.find((r) => r.slot === slot)?.value ?? emptyValue(habit);

  // Per-window mode: one row per window (PushupsWindows.dc.html).
  if (perWindow && habit.checkinType !== 'list') {
    const target = slotTarget(habit);
    const doneWindows = habit.windows.filter((_, i) => today.completeSlots.has(i)).length;
    const total = today.amount;
    const totalTarget = target * habit.windows.length;
    return (
      <View style={[styles.card, { padding: 20, gap: 14 }]}>
        <Header right={habit.checkinType === 'check' ? `${doneWindows} of ${habit.windows.length} today` : `${total} of ${totalTarget} today`} rightColor={today.complete ? color : colors.text2} />
        {habit.windows.map((w, i) => {
          const value = valueFor(i);
          const amount = valueAmount(value);
          const complete = today.completeSlots.has(i);
          const single = windowState({ ...habit, windows: [w] }, nowMin);
          const open = canCheckIn(single);
          const row = today.rows.find((r) => r.slot === i);
          const doneAt = row && complete ? new Date(row.updatedAt) : null;
          const sub = complete
            ? `${shortRange(w)}${doneAt ? `, done at ${formatTimeOfDay(`${String(doneAt.getHours()).padStart(2, '0')}:${String(doneAt.getMinutes()).padStart(2, '0')}`)}` : ''}`
            : single.kind === 'open'
              ? `Open until ${formatTimeOfDay(w.end).replace(':00', '')}`
              : single.kind === 'grace'
                ? 'You can still check in'
                : single.kind === 'upcoming'
                  ? `Opens at ${formatTimeOfDay(w.start)}`
                  : 'Closed';
          return (
            <View key={i} style={[styles.slot, { backgroundColor: complete ? tint(color, 0.1) : colors.raised }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text size={15} weight={700}>
                  {windowName(habit, i)}
                </Text>
                <Text size={13} weight={600} color={complete ? calendar.windowDoneSub : colors.text2}>
                  {sub}
                </Text>
              </View>
              {complete ? (
                <View style={[styles.slotPill, { backgroundColor: color }]}>
                  <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3.2} />
                  <Text size={13} weight={800} color={colors.onAccent}>
                    {habit.checkinType === 'check' ? 'Done' : `${target}/${target}`}
                  </Text>
                </View>
              ) : open ? (
                habit.checkinType === 'check' ? (
                  <Button title="Check in" height={44} color={color} textColor={colors.onAccent} onPress={() => onAct(i, { kind: 'check' })} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <RoundStep glyph="minus" size={44} label={`Remove one from ${windowName(habit, i)}`} color={color} disabled={amount <= 0} onPress={() => onAct(i, increment(value, -1, target))} />
                    <Text size={18} weight={800} align="center" style={{ minWidth: 36 }}>
                      {amount}
                    </Text>
                    <RoundStep glyph="plus" size={44} filled label={`Add one to ${windowName(habit, i)}`} color={color} onPress={() => onAct(i, increment(value, 1, target))} />
                  </View>
                )
              ) : (
                <View style={[styles.slotPill, { backgroundColor: colors.divider }]}>
                  <Icon name="clock" size={14} color={colors.chipMutedText} strokeWidth={2.6} />
                  <Text size={13} weight={700} color={colors.chipMutedText}>
                    {habit.checkinType === 'check' ? 'To do' : `${amount}/${target}`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  const win = view.window;
  const slot = slotFor(habit, win);
  const value = valueFor(slot);
  const open = canCheckIn(win) || today.complete;

  if (!today.complete && !today.started && win.kind === 'upcoming') {
    return (
      <View style={[styles.card, { padding: 16, gap: 12 }]}>
        <Header />
        <Countdown state={win} habit={habit} verb={verbFor(habit)} now={now} />
      </View>
    );
  }

  if (!today.complete && win.kind === 'closed') {
    return (
      <View style={[styles.card, { padding: 20, gap: 8 }]}>
        <Header />
        <Text size={17} weight={800}>
          Closed for today
        </Text>
        <Text size={14} weight={500} color={colors.text2}>
          The last check-in window has ended.
        </Text>
      </View>
    );
  }

  if (habit.checkinType === 'count') {
    const target = slotTarget(habit);
    const amount = valueAmount(value);
    return (
      <View style={[styles.card, { paddingVertical: 22, paddingHorizontal: 20, gap: 18, alignItems: 'center' }, today.complete && { backgroundColor: tint(color, 0.12) }]}>
        <View style={{ alignSelf: 'stretch' }}>
          <Header
            right={today.complete ? 'Done for today' : perWindow ? windowName(habit, slot) : undefined}
            rightColor={today.complete ? color : colors.text2}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' }}>
          <RoundStep glyph="minus" label="Remove one" color={color} disabled={amount <= 0} onPress={() => onAct(slot, increment(value, -1, target))} />
          <Ring amount={amount} target={target} color={color} />
          <RoundStep glyph="plus" filled label="Add one" color={color} disabled={amount >= target || !open} onPress={() => onAct(slot, increment(value, 1, target))} />
        </View>
      </View>
    );
  }

  if (habit.checkinType === 'list') {
    const items = habit.config.listItems ?? [];
    const count = value.kind === 'list' ? value.done.filter((d) => items.some((i) => i.id === d)).length : 0;
    const complete = items.length > 0 && count >= items.length;
    return (
      <View style={[styles.card, { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 12, gap: 10 }, today.complete && { backgroundColor: tint(color, 0.12) }]}>
        <View style={{ paddingHorizontal: 4 }}>
          <Header right={complete ? 'Done for today' : `${count} of ${items.length}`} rightColor={complete ? color : colors.text2} />
        </View>
        {perWindow ? (
          <Text size={13} weight={600} color={colors.text2} style={{ paddingHorizontal: 4 }}>
            {windowName(habit, slot)}
          </Text>
        ) : null}
        <View style={styles.bar} importantForAccessibility="no-hide-descendants">
          <View style={{ height: '100%', width: `${items.length ? Math.round((count / items.length) * 100) : 0}%`, borderRadius: 4, backgroundColor: color }} />
        </View>
        <ListItems habit={habit} value={value} color={color} enabled={open} onToggle={(id) => onAct(slot, toggleItem(value, id))} />
      </View>
    );
  }

  // Check off
  if (today.complete) {
    return (
      <View style={[styles.card, { padding: 20, gap: 14, backgroundColor: tint(color, 0.12) }]}>
        <Header right="Done for today" rightColor={color} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.doneBadge, { backgroundColor: color }]}>
            <Icon name="check" size={22} color={colors.onAccent} strokeWidth={3.2} />
          </View>
          <Text size={17} weight={800} style={{ flex: 1 }}>
            Checked in
          </Text>
          <Pressable accessibilityRole="button" onPress={onUndo} style={[styles.undo, { backgroundColor: tint(color, 0.18) }]}>
            <Text size={14} weight={700} color={color}>
              Undo
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.card, { padding: 16, gap: 12 }]}>
      <View style={{ paddingHorizontal: 4 }}>
        <Header right={win.kind === 'open' || win.kind === 'grace' ? `Open until ${formatTimeOfDay(habit.windows[win.index].end)}` : undefined} />
      </View>
      <Button title="Check in" icon="check" height={60} color={color} textColor={colors.onAccent} onPress={() => onAct(slot, { kind: 'check' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, borderCurve: 'continuous' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 10, paddingLeft: 16, paddingRight: 12, borderRadius: 18, borderCurve: 'continuous' },
  slotPill: { height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  bar: { height: 8, marginHorizontal: 4, marginBottom: 4, borderRadius: 4, backgroundColor: colors.divider, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 54, paddingHorizontal: 6 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  box: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  doneBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  undo: { height: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center' },
});
