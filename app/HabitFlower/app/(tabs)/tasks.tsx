import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { diffDays, formatDay, formatDayTime, formatTimeOfDay, startOfWeek, weekdayShort, weekday } from '@/domain/day';
import { isRepeating, repeatLabel, sortTasks, taskSection, type TaskSection } from '@/domain/tasks';
import type { RepeatRule, Task } from '@/domain/types';
import { useToday } from '@/state/selectors';
import { useStore, type TaskCompletion } from '@/state/store';
import { colors, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TabScreen } from '@/ui/TabScreen';
import { Text } from '@/ui/Text';

const SECTIONS: { key: TaskSection; title: string; color: string }[] = [
  { key: 'overdue', title: 'Overdue', color: colors.badge },
  { key: 'today', title: 'Today', color: colors.accent },
  { key: 'upcoming', title: 'Upcoming', color: colors.chipMutedText },
  { key: 'other', title: 'Other', color: colors.chipMutedText },
];

function dueLabel(t: Task, today: string): { text: string; color: string } | null {
  if (!t.dueDay) return null;
  const late = diffDays(t.dueDay, today);
  if (late > 0) return { text: `Due ${weekdayShort(weekday(t.dueDay))}, ${late === 1 ? '1 day' : `${late} days`} late`, color: colors.badge };
  if (late === 0) return { text: t.dueTime ? formatTimeOfDay(t.dueTime) : 'Today', color: colors.text2 };
  return { text: formatDayTime(t.dueDay, t.dueTime, today), color: colors.text2 };
}

function TaskRow({
  task,
  section,
  today,
  completion,
  onToggle,
  last,
}: {
  task: Task;
  section: TaskSection;
  today: string;
  completion: TaskCompletion | undefined;
  onToggle: () => void;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggleItem = useStore((s) => s.toggleChecklistItem);
  const checked = !!completion;
  const shown = completion?.task ?? task;
  const due = dueLabel(shown, today);
  const subs = shown.checklist;
  const subDone = subs.filter((c) => c.done).length;
  const boxBg = checked ? colors.accent : section === 'overdue' ? colors.overdueBox : colors.checkboxOff;

  return (
    <View style={!last && styles.divider}>
      <View style={styles.row}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={shown.title} onPress={onToggle} style={styles.check}>
          <View style={[styles.box, { backgroundColor: boxBg }]}>{checked ? <Icon name="check" size={16} color={colors.onAccentDeep} strokeWidth={3.2} /> : null}</View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/task/${task.id}`)} style={{ flex: 1, gap: 3, paddingVertical: 5 }}>
          <Text size={15.5} weight={600} lineHeight={20} color={checked ? colors.text3 : colors.text} style={checked && { textDecorationLine: 'line-through' }}>
            {shown.title}
          </Text>
          {due || isRepeating(shown.repeat) || subs.length ? (
            <View style={styles.meta}>
              {due ? (
                <Text size={12.5} weight={600} color={checked ? colors.doneDueText : due.color}>
                  {due.text}
                </Text>
              ) : null}
              {isRepeating(shown.repeat) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="repeat" size={12} color={colors.text2} />
                  <Text size={12.5} weight={600} color={colors.text2}>
                    {repeatLabel(shown.repeat)}
                  </Text>
                </View>
              ) : null}
              {subs.length ? (
                <Text size={12.5} weight={600} color={colors.text2}>
                  {subDone} of {subs.length} items
                </Text>
              ) : null}
            </View>
          ) : null}
          {checked && completion?.nextDueDay ? (
            <Text size={12.5} weight={700} color={colors.accent}>
              Next due {formatDay(completion.nextDueDay)}
            </Text>
          ) : null}
        </Pressable>
        {subs.length && !checked ? (
          <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Hide checklist' : 'Show checklist'} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.check}>
            <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <Icon name="chevronDown" size={20} color={colors.text2} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {open && !checked ? (
        <View style={styles.subs}>
          {subs.map((c) => (
            <Pressable key={c.id} accessibilityRole="checkbox" accessibilityState={{ checked: c.done }} onPress={() => toggleItem(task.id, c.id)} style={styles.sub}>
              <View style={[styles.subBox, { backgroundColor: c.done ? colors.accent : colors.checkboxOff }]}>{c.done ? <Icon name="check" size={12} color={colors.onAccentDeep} strokeWidth={3.4} /> : null}</View>
              <Text size={15} weight={500} color={c.done ? colors.text3 : colors.chipText} style={c.done && { textDecorationLine: 'line-through' }}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const IDEAS: { name: string; when: string; repeat?: RepeatRule['kind']; param: { title: string; repeat?: string; when?: string } }[] = [
  { name: 'Pay credit card', when: 'Monthly', repeat: 'monthly', param: { title: 'Pay credit card', repeat: 'monthly' } },
  { name: 'Finish homework', when: 'Tomorrow', param: { title: 'Finish homework', when: 'tomorrow' } },
  { name: 'Do groceries', when: 'Weekly', repeat: 'weekly', param: { title: 'Do groceries', repeat: 'weekly' } },
];

function TasksEmpty() {
  const ghost = [
    { done: true, w: '62%' },
    { done: false, w: '78%' },
    { done: false, w: '48%' },
  ] as const;
  return (
    <View style={{ gap: 22, paddingTop: 20 }}>
      <View style={styles.emptyHero}>
        <View style={styles.ghost} importantForAccessibility="no-hide-descendants">
          {ghost.map((g, i) => (
            <View key={i} style={[styles.ghostRow, { opacity: 1 - i * 0.25 }]}>
              <View style={[styles.ghostBox, { backgroundColor: g.done ? colors.accent : colors.raised }]}>{g.done ? <Icon name="check" size={11} color={colors.onAccentDeep} strokeWidth={3.6} /> : null}</View>
              <View style={{ height: 7, width: g.w, borderRadius: 4, backgroundColor: g.done ? colors.switchOff : colors.raised }} />
            </View>
          ))}
        </View>
        <Text size={22} display>
          No tasks yet
        </Text>
        <Button title="Add a task" icon="plus" height={50} onPress={() => router.push('/task/new')} style={{ alignSelf: 'stretch' }} />
      </View>
      <View style={{ gap: 12 }}>
        <Text size={18} weight={700} accessibilityRole="header">
          Suggestions
        </Text>
        <View style={styles.card}>
          {IDEAS.map((i, idx) => (
            <Pressable
              key={i.name}
              accessibilityRole="button"
              accessibilityLabel={`Add ${i.name}`}
              onPress={() => router.push({ pathname: '/task/new', params: i.param })}
              style={({ pressed }) => [styles.idea, idx < IDEAS.length - 1 && styles.divider, pressed && { backgroundColor: colors.cardPressed }]}
            >
              <View style={styles.ideaBox} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text size={15} weight={700}>
                  {i.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {i.repeat ? <Icon name="repeat" size={12} color={colors.text3} /> : null}
                  <Text size={12.5} weight={600} color={colors.text3}>
                    {i.when}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const today = useToday();
  const tasks = useStore((s) => s.tasks);
  const weekStart = useStore((s) => s.user.settings.weekStart);
  const { completeTask, undoCompleteTask } = useStore.getState();
  // Tasks checked off while this screen is open stay in place (checked) so they can be unchecked.
  const [checked, setChecked] = useState<Record<string, TaskCompletion>>({});
  const [showDone, setShowDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => setChecked({});
    }, []),
  );

  const toggle = (t: Task) => {
    const c = checked[t.id];
    if (c) {
      undoCompleteTask(c);
      const { [t.id]: _, ...rest } = checked;
      setChecked(rest);
    } else {
      const res = completeTask(t.id);
      if (res) setChecked({ ...checked, [t.id]: res });
    }
  };

  // A checked task keeps its original section until the screen is left.
  const visible = tasks.filter((t) => !t.completedAt || checked[t.id]);
  const sectionOf = (t: Task) => taskSection(checked[t.id]?.task ?? t, today);
  const weekFirst = startOfWeek(today, weekStart);
  const doneThisWeek = tasks.reduce((n, t) => n + t.doneLog.filter((d) => d >= weekFirst).length, 0);
  const doneTasks = tasks.filter((t) => t.completedAt && !checked[t.id] && t.doneLog.some((d) => d >= weekFirst));

  return (
    <TabScreen title="My Tasks">

        {tasks.length === 0 ? (
          <TasksEmpty />
        ) : (
          <View style={{ gap: 14, paddingTop: 12 }}>
            {SECTIONS.map((sec) => {
              const items = sortTasks(visible.filter((t) => sectionOf(t) === sec.key));
              if (!items.length) return null;
              return (
                <View key={sec.key} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} accessibilityRole="header">
                    <Text label color={sec.color}>
                      {sec.title}
                    </Text>
                    <Text size={13} weight={600} color={colors.text3}>
                      ({items.length})
                    </Text>
                  </View>
                  <View style={styles.card}>
                    {items.map((t, i) => (
                      <TaskRow key={t.id} task={t} section={sec.key} today={today} completion={checked[t.id]} onToggle={() => toggle(t)} last={i === items.length - 1} />
                    ))}
                  </View>
                </View>
              );
            })}
            {doneThisWeek > 0 ? (
              <View style={{ gap: 8 }}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDone }} onPress={() => setShowDone(!showDone)} style={styles.doneRow}>
                  <Text size={14} weight={700} color={colors.text2}>
                    {doneThisWeek} done this week
                  </Text>
                  <View style={{ transform: [{ rotate: showDone ? '180deg' : '0deg' }] }}>
                    <Icon name="chevronDown" size={18} color={colors.text2} />
                  </View>
                </Pressable>
                {showDone && doneTasks.length ? (
                  <View style={styles.card}>
                    {doneTasks.map((t, i) => (
                      <Pressable key={t.id} accessibilityRole="button" onPress={() => router.push(`/task/${t.id}`)} style={[styles.row, { paddingLeft: 16 }, i < doneTasks.length - 1 && styles.divider]}>
                        <Icon name="check" size={16} color={colors.accent} strokeWidth={3} />
                        <Text size={15} weight={600} color={colors.text3} style={{ textDecorationLine: 'line-through', flex: 1 }}>
                          {t.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 56, paddingVertical: 5, paddingLeft: 6, paddingRight: 8 },
  check: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  subs: { paddingLeft: 50, paddingRight: 14, paddingBottom: 10 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  subBox: { width: 20, height: 20, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  doneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  emptyHero: { borderRadius: 28, borderCurve: 'continuous', backgroundColor: colors.card, padding: 14, paddingBottom: 16, alignItems: 'center', gap: 14 },
  ghost: { alignSelf: 'stretch', height: 132, borderRadius: 20, borderCurve: 'continuous', backgroundColor: tint(colors.taskBlue, 0.1), justifyContent: 'center', gap: 8, paddingHorizontal: 36 },
  ghostRow: { height: 30, borderRadius: 10, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10 },
  ghostBox: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10, paddingLeft: 14, paddingRight: 12 },
  ideaBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.raised },
});
