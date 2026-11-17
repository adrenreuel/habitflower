/**
 * History on the habit page (Detail.dc.html):
 * - HistoryCard: one tappable card with this week, a divider and two stats.
 * - HistorySheet: 2x2 stats, month navigation and the calendar with its legend.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, addMonths, dayOfMonth, daysInMonth, monthLong, monthShort, startOfMonth, startOfWeek, weekday, weekdayLetter, weekdayLong } from '@/domain/day';
import { bestStreak, historyStats } from '@/domain/flower';
import type { DayInfo } from '@/domain/schedule';
import type { LocalDay } from '@/domain/types';
import { calendar, colors, tint } from '@/theme/tokens';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { Stripes } from '@/ui/Stripes';
import { Text } from '@/ui/Text';

type CellState = 'done' | 'part' | 'miss' | 'pause' | 'today' | 'todayDone' | 'empty';

function cellState(info: DayInfo | undefined, isToday: boolean): CellState {
  if (isToday) return info?.status === 'done' ? 'todayDone' : 'today';
  switch (info?.status) {
    case 'done':
      return 'done';
    case 'partial':
      return 'part';
    case 'missed':
      return 'miss';
    case 'paused':
      return 'pause';
    default:
      return 'empty';
  }
}

function cellColors(s: CellState, color: string, started: boolean): { bg: string; fg: string } {
  switch (s) {
    case 'done':
    case 'todayDone':
      return { bg: color, fg: calendar.doneTextOnColor };
    case 'part':
      return { bg: tint(color, 0.4), fg: colors.text };
    case 'today':
      return started ? { bg: tint(color, 0.4), fg: colors.text } : { bg: calendar.emptyCell, fg: colors.text };
    case 'miss':
      return { bg: colors.missed, fg: colors.missedText };
    case 'pause':
      return { bg: 'transparent', fg: colors.pausedText };
    default:
      return { bg: calendar.emptyCell, fg: calendar.emptyText };
  }
}

const STATUS_WORD: Record<CellState, string> = {
  done: 'done',
  todayDone: 'done',
  part: 'partly done',
  miss: 'missed',
  pause: 'paused',
  today: 'today',
  empty: '',
};

type DaysProps = { days: Map<LocalDay, DayInfo>; today: LocalDay; weekStart: 0 | 1; color: string; startedToday: boolean };

/** The 7 days of the current week. */
export function WeekRow({ days, today, weekStart, color, startedToday }: DaysProps) {
  const first = startOfWeek(today, weekStart);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(first, i);
        const isToday = d === today;
        const s = d > today ? 'empty' : cellState(days.get(d), isToday);
        const c = cellColors(s, color, startedToday);
        return (
          <View key={d} style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${weekdayLong(weekday(d))} ${dayOfMonth(d)}${STATUS_WORD[s] ? `, ${STATUS_WORD[s]}` : ''}`}>
            <Text size={12} weight={600} color={colors.text2}>
              {weekdayLetter(weekday(d))}
            </Text>
            <View style={[styles.weekRing, isToday && { borderColor: color }]}>
              <View style={[styles.weekCell, { backgroundColor: c.bg }]}>
                {s === 'pause' ? <Stripes radius={20} /> : null}
                <Text size={14} weight={700} color={s === 'empty' ? colors.text3 : c.fg}>
                  {dayOfMonth(d)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function monthCount(days: DayInfo[], today: LocalDay): { done: number; counted: number } {
  const monthFirst = startOfMonth(today);
  const inMonth = days.filter((d) => d.day >= monthFirst && d.day <= today);
  return {
    done: inMonth.filter((d) => d.status === 'done' && d.effect === 'grow').length,
    counted: inMonth.filter((d) => d.effect !== 'none' || (d.day === today && d.status === 'pending')).length,
  };
}

function InlineStat({ value, unit, label, a11y }: { value: string; unit?: string; label: string; a11y: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={a11y}>
      <Text size={22} weight={800}>
        {value}
        {unit ? (
          <Text size={14} weight={700} color={colors.chipMutedText}>
            {unit}
          </Text>
        ) : null}
      </Text>
      <Text size={12} weight={600} color={colors.text2}>
        {label}
      </Text>
    </View>
  );
}

const daysUnit = (n: number) => (n === 1 ? ' day' : ' days');

/** This week, a divider and two stats. Tapping it opens the History sheet. */
export function HistoryCard({ list, onPress, ...p }: DaysProps & { list: DayInfo[]; onPress: () => void }) {
  const best = bestStreak(list);
  const m = monthCount(list, p.today);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="This week. See history"
      accessibilityHint="Opens your stats and calendar"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.cardPressed }]}
    >
      <View style={styles.cardHead}>
        <Text size={18} weight={700}>
          This week
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text size={13.5} weight={700} color={colors.text2}>
            History
          </Text>
          <Icon name="chevronRight" size={16} color={colors.text2} strokeWidth={2.6} />
        </View>
      </View>
      <WeekRow {...p} />
      <View style={styles.divider} />
      <View style={{ flexDirection: 'row' }}>
        <InlineStat value={String(best)} unit={daysUnit(best)} label="Best streak" a11y={`Best streak ${best}${daysUnit(best)}`} />
        <InlineStat value={`${m.done}/${m.counted}`} label={`Days in ${monthShort(p.today)}`} a11y={`${m.done} of ${m.counted} days in ${monthLong(p.today)}`} />
      </View>
    </Pressable>
  );
}

function Legend({ color }: { color: string }) {
  const items: [string, React.ReactNode][] = [
    ['Done', <View key="d" style={[styles.swatch, { backgroundColor: color }]} />],
    ['Partly', <View key="p" style={[styles.swatch, { backgroundColor: tint(color, 0.4) }]} />],
    ['Missed', <View key="m" style={[styles.swatch, { backgroundColor: tint(colors.badge, 0.45) }]} />],
    [
      'Paused',
      <View key="z" style={[styles.swatch, { overflow: 'hidden' }]}>
        <Stripes radius={3} swatch />
      </View>,
    ],
  ];
  return (
    <View style={styles.legend} importantForAccessibility="no-hide-descendants">
      {items.map(([label, swatch]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {swatch}
          <Text size={12} weight={600} color={colors.text2}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The calendar grid for the month containing `month`. */
export function MonthGrid({ days, today, weekStart, color, startedToday, month }: DaysProps & { month: LocalDay }) {
  const first = startOfMonth(month);
  const lead = (weekday(first) - weekStart + 7) % 7;
  const total = daysInMonth(first);
  const cells: (LocalDay | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);
  const rows: (LocalDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const letters = Array.from({ length: 7 }, (_, i) => weekdayLetter((i + weekStart) % 7));

  return (
    <View style={{ gap: 6 }} accessibilityLabel={`${monthLong(first)} history`}>
      <View style={styles.monthRow}>
        {letters.map((l, i) => (
          <Text key={i} size={11} weight={600} color={colors.text3Small} align="center" style={{ flex: 1 }}>
            {l}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={styles.monthRow}>
          {r.map((d, ci) => {
            if (!d) return <View key={ci} style={{ flex: 1 }} />;
            const isToday = d === today;
            const s = d > today ? 'empty' : cellState(days.get(d), isToday);
            const c = cellColors(s, color, startedToday);
            return (
              <View
                key={d}
                accessible
                accessibilityLabel={`${monthLong(d)} ${dayOfMonth(d)}${STATUS_WORD[s] ? `, ${STATUS_WORD[s]}` : ''}`}
                style={[styles.cellRing, isToday && { borderColor: color }]}
              >
                <View style={[styles.cell, { backgroundColor: c.bg }]}>
                  {s === 'pause' ? <Stripes radius={10} /> : null}
                  <Text size={13} weight={700} color={c.fg}>
                    {dayOfMonth(d)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function StatTile({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.statTile} accessible accessibilityLabel={`${label} ${value}${unit ?? ''}`}>
      <Text size={22} weight={800}>
        {value}
        {unit ? (
          <Text size={14} weight={700} color={colors.chipMutedText}>
            {unit}
          </Text>
        ) : null}
      </Text>
      <Text size={12} weight={600} color={colors.text2}>
        {label}
      </Text>
    </View>
  );
}

function MonthArrow({ dir, disabled, onPress }: { dir: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 'prev' ? 'Previous month' : 'Next month'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.75 }]}
    >
      <View style={dir === 'prev' ? { transform: [{ scaleX: -1 }] } : undefined}>
        <Icon name="chevronRight" size={16} color={disabled ? calendar.navDisabled : colors.chipText} strokeWidth={2.6} />
      </View>
    </Pressable>
  );
}

export function HistorySheet({
  visible,
  onClose,
  list,
  startDay,
  ...p
}: DaysProps & { visible: boolean; onClose: () => void; list: DayInfo[]; startDay: LocalDay }) {
  const current = startOfMonth(p.today);
  const [month, setMonth] = useState(current);
  const stats = historyStats(list);
  const atCurrent = month >= current;
  const atStart = month <= startOfMonth(startDay);

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        onClose();
        setMonth(current);
      }}
      title="History"
    >
      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatTile value={String(stats.bestStreak)} unit={daysUnit(stats.bestStreak)} label="Best streak" />
          <StatTile value={String(stats.completion)} unit="%" label="Completion" />
        </View>
        <View style={styles.statRow}>
          <StatTile value={String(stats.totalCheckIns)} label="Total check-ins" />
          <StatTile value={String(stats.longestBloom)} unit={daysUnit(stats.longestBloom)} label="Longest bloom" />
        </View>
      </View>
      <View style={styles.monthCard}>
        <View style={styles.monthHead}>
          <MonthArrow dir="prev" disabled={atStart} onPress={() => setMonth(addMonths(month, -1))} />
          <Text size={16} weight={700} accessibilityRole="header">
            {`${monthLong(month)} ${month.slice(0, 4)}`}
          </Text>
          <MonthArrow dir="next" disabled={atCurrent} onPress={() => setMonth(addMonths(month, 1))} />
        </View>
        <MonthGrid {...p} month={month} />
        <Legend color={p.color} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, borderCurve: 'continuous', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14, gap: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.divider },
  weekRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', margin: -4 },
  weekCell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  statGrid: { gap: 10 },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: colors.card, borderRadius: 18, borderCurve: 'continuous', padding: 14, gap: 4 },
  monthCard: { backgroundColor: colors.card, borderRadius: 22, borderCurve: 'continuous', padding: 16, gap: 12 },
  monthHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  monthRow: { flexDirection: 'row', gap: 6 },
  cellRing: { flex: 1, borderRadius: 13, borderWidth: 2, borderColor: 'transparent', padding: 2, margin: -4 },
  cell: { height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, alignItems: 'center', paddingTop: 2 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
});
