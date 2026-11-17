import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDay, formatDayTime } from '@/domain/day';
import { repeatLabel } from '@/domain/tasks';
import { useToday } from '@/state/selectors';
import { useStore, type TaskCompletion } from '@/state/store';
import { colors, flowerColors, fonts, glass, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import { Grain } from '@/ui/Grain';

function InfoRow({ icon, iconBg, iconColor, title, value, last }: { icon: IconName; iconBg: string; iconColor: string; title: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.info, !last && styles.divider]} accessible accessibilityLabel={`${title}, ${value}`}>
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text size={15} weight={600} style={{ flex: 1 }}>
        {title}
      </Text>
      <Text size={14.5} weight={600} color={colors.text2}>
        {value}
      </Text>
    </View>
  );
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const weekStart = useStore((s) => s.user.settings.weekStart);
  const { completeTask, undoCompleteTask, reopenTask, toggleChecklistItem, addChecklistItem } = useStore.getState();
  const [done, setDone] = useState<TaskCompletion | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState('');

  if (!task) return null;
  const finished = !!task.completedAt;
  const doneCount = task.checklist.filter((c) => c.done).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Tasks" onPress={() => (router.canGoBack() ? router.back() : router.replace('/tasks'))} style={styles.back}>
            <Icon name="back" size={22} color={colors.chipMutedText} />
            <Text size={16} weight={600} color={colors.chipMutedText}>
              Tasks
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={() => router.push(`/task/${task.id}/edit`)} style={styles.edit}>
            <Icon name="pencil" size={16} />
            <Text size={15} weight={600}>
              Edit
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 6, paddingHorizontal: 2 }}>
          <Text size={28} display lineHeight={36} color={finished ? colors.text3 : colors.text} style={finished && { textDecorationLine: 'line-through' }} accessibilityRole="header">
            {task.title}
          </Text>
          {task.notes ? (
            <Text size={15} weight={500} color={colors.text2}>
              {task.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <InfoRow icon="calendar" iconBg={tint(colors.taskBlue, 0.18)} iconColor={colors.infoText} title="Due" value={task.dueDay ? formatDayTime(task.dueDay, task.dueTime, today) : 'No date'} />
          <InfoRow icon="repeat" iconBg={tint(flowerColors.lavender, 0.2)} iconColor={colors.repeatIcon} title="Repeats" value={repeatLabel(task.repeat, weekStart)} last />
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={18} weight={700} accessibilityRole="header">
              Checklist
            </Text>
            {task.checklist.length ? (
              <Text size={14} weight={700} color={colors.text2}>
                {doneCount} of {task.checklist.length}
              </Text>
            ) : null}
          </View>
          <View style={styles.card}>
            {task.checklist.map((it) => (
              <Pressable
                key={it.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: it.done }}
                onPress={() => toggleChecklistItem(task.id, it.id)}
                style={[styles.item, styles.divider]}
              >
                <View style={[styles.box, { backgroundColor: it.done ? colors.accent : colors.checkboxOff }]}>
                  {it.done ? <Icon name="check" size={14} color={colors.onAccentDeep} strokeWidth={3.2} /> : null}
                </View>
                <Text size={15.5} weight={500} color={it.done ? colors.text3 : colors.chipText} style={[{ flex: 1 }, it.done && { textDecorationLine: 'line-through' }]}>
                  {it.label}
                </Text>
              </Pressable>
            ))}
            {adding ? (
              <View style={styles.item}>
                <Icon name="plusSmall" size={18} color={colors.accentTintText} strokeWidth={2.6} />
                <TextInput
                  autoFocus
                  accessibilityLabel="New item"
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={() => {
                    addChecklistItem(task.id, newItem);
                    setNewItem('');
                  }}
                  onBlur={() => setAdding(false)}
                  blurOnSubmit={false}
                  placeholder="New item"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                  returnKeyType="done"
                />
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.item}>
                <Icon name="plusSmall" size={18} color={colors.accentTintText} strokeWidth={2.6} />
                <Text size={15} weight={700} color={colors.accentTintText}>
                  Add item
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {done || finished ? (
          <View accessibilityRole="alert" style={styles.doneBar}>
            <Text size={15} weight={700} color={glass.toastText} style={{ flex: 1 }}>
              {done?.nextDueDay ? `Done. Next one ${formatDay(done.nextDueDay)}` : 'Done'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (done) undoCompleteTask(done);
                else reopenTask(task.id);
                setDone(null);
              }}
              style={styles.undo}
            >
              <Text size={14} weight={800}>
                Undo
              </Text>
            </Pressable>
          </View>
        ) : (
          <Button title="Mark as done" icon="check" height={54} onPress={() => setDone(completeTask(task.id))} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 18 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingRight: 8 },
  edit: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 6 },
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16 },
  infoIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 54, paddingHorizontal: 16 },
  box: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 54, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.headerBorder },
  doneBar: { height: 54, borderRadius: 27, backgroundColor: tint(colors.accent, 0.16), flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8 },
  undo: { height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.shade, justifyContent: 'center' },
});
