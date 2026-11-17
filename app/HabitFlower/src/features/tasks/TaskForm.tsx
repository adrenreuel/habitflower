/**
 * New / Edit task form (NewTask.dc.html, EditTask.dc.html).
 * Share with friends is v1.2 and hidden in v1.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, formatDay, formatTimeOfDay, localDay } from '@/domain/day';
import { repeatLabel, repeatSummary } from '@/domain/tasks';
import type { RepeatRule, RepeatUnit } from '@/domain/types';
import { useToday } from '@/state/selectors';
import { useStore, uuid, type TaskInput } from '@/state/store';
import { colors, fonts } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Switch } from '@/ui/Card';
import { DayPicker } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { StepperRow } from '@/ui/Stepper';
import { Text } from '@/ui/Text';
import { TimeSheet } from '@/ui/TimeSheet';
import { Grain } from '@/ui/Grain';

export function emptyTask(today: string, title = '', repeat: RepeatRule = { kind: 'never' }, dueDay: string | null = today): TaskInput {
  return { title, notes: '', dueDay, dueTime: null, repeat, checklist: [] };
}

export function validateTask(t: TaskInput): string | null {
  if (!t.title.trim()) return 'Give your task a name.';
  if (t.repeat.kind === 'weekly' && t.repeat.days.length === 0) return 'Pick at least one day.';
  return null;
}

function Chip({ label, on, onPress, flex }: { label: string; on: boolean; onPress: () => void; flex?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, flex && { flex: 1, paddingHorizontal: 0 }, { backgroundColor: on ? colors.accentTint : colors.raised }]}
    >
      <Text size={14} weight={700} color={on ? colors.accentTintText : colors.chipText}>
        {label}
      </Text>
    </Pressable>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text label accessibilityRole="header">
      {children}
    </Text>
  );
}

type When = 'today' | 'tomorrow' | 'date' | 'none';

export function TaskForm({
  title,
  task,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  extra,
}: {
  title: string;
  task: TaskInput;
  onChange: (t: TaskInput) => void;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  extra?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const weekStart = useStore((s) => s.user.settings.weekStart);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const set = (patch: Partial<TaskInput>) => onChange({ ...task, ...patch });

  const tomorrow = addDays(today, 1);
  const when: When = task.dueDay === null ? 'none' : task.dueDay === today ? 'today' : task.dueDay === tomorrow ? 'tomorrow' : 'date';
  const error = validateTask(task);
  const r = task.repeat;

  const setRepeatKind = (kind: RepeatRule['kind']) => {
    const dow = new Date().getDay();
    if (kind === 'never' || kind === 'daily' || kind === 'monthly') set({ repeat: { kind } });
    else if (kind === 'weekly') set({ repeat: { kind, days: r.kind === 'weekly' ? r.days : [dow] } });
    else set({ repeat: r.kind === 'custom' ? r : { kind: 'custom', every: 2, unit: 'week', from: 'due' } });
  };

  const addItem = () => {
    const label = newItem.trim();
    if (!label) return;
    set({ checklist: [...task.checklist, { id: uuid(), label, done: false }] });
    setNewItem('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Grain />
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 16 }]}>
        <Text size={24} display accessibilityRole="header">
          {title}
        </Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            <TextInput
              accessibilityLabel="Task name"
              value={task.title}
              onChangeText={(t) => set({ title: t })}
              placeholder="Task name"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.title}
              maxLength={120}
            />
            <TextInput
              accessibilityLabel="Notes"
              value={task.notes}
              onChangeText={(notes) => set({ notes })}
              placeholder="Add notes"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.notes}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Label>When</Label>
            <View style={styles.chips}>
              <Chip label="Today" on={when === 'today'} onPress={() => set({ dueDay: today })} />
              <Chip label="Tomorrow" on={when === 'tomorrow'} onPress={() => set({ dueDay: tomorrow })} />
              <Chip label={when === 'date' && task.dueDay ? formatDay(task.dueDay) : 'Pick date'} on={when === 'date'} onPress={() => setDateOpen(true)} />
              <Chip label="No date" on={when === 'none'} onPress={() => set({ dueDay: null, dueTime: null })} />
            </View>
            {task.dueDay ? (
              <View style={styles.timeRow}>
                <Text size={15} weight={600}>
                  Time
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {task.dueTime ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Change time, ${formatTimeOfDay(task.dueTime)}`} onPress={() => setTimeOpen(true)}>
                      <Text size={15} weight={600} color={colors.accent}>
                        {formatTimeOfDay(task.dueTime)}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Switch accessibilityLabel="Set a time" value={!!task.dueTime} onValueChange={(on) => (on ? setTimeOpen(true) : set({ dueTime: null }))} />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Label>Repeat</Label>
            <Pressable accessibilityRole="button" accessibilityLabel={`Repeat: ${repeatLabel(r, weekStart)}`} onPress={() => setRepeatOpen(true)} style={styles.pickRow}>
              <Text size={15.5} weight={600} style={{ flex: 1 }}>
                {repeatLabel(r, weekStart)}
              </Text>
              <Icon name="chevronRight" size={18} color={colors.text3} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Label>Checklist</Label>
            <View style={styles.card}>
              {task.checklist.map((it) => (
                <View key={it.id} style={[styles.itemRow, styles.divider]}>
                  <View style={styles.stub} />
                  <Text size={15} weight={500} style={{ flex: 1 }}>
                    {it.label}
                  </Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${it.label}`} onPress={() => set({ checklist: task.checklist.filter((c) => c.id !== it.id) })} style={styles.iconBtn}>
                    <Icon name="close" size={18} color={colors.text3Small} />
                  </Pressable>
                </View>
              ))}
              <View style={[styles.itemRow, { paddingRight: 4 }]}>
                <Icon name="plusSmall" size={18} color={colors.accent} strokeWidth={2.6} />
                <TextInput
                  accessibilityLabel="Add item"
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={addItem}
                  blurOnSubmit={false}
                  placeholder="Add item"
                  placeholderTextColor={colors.accent}
                  style={styles.itemInput}
                  returnKeyType="done"
                />
                {newItem.trim() ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={addItem} style={styles.iconBtn}>
                    <Icon name="check" size={18} color={colors.accent} strokeWidth={2.8} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          {extra}

          {showErrors && error ? (
            <Text size={14} weight={600} color={colors.wilting} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Button title="Cancel" variant="secondary" height={52} onPress={onCancel} style={{ flex: 1 }} />
        <Button
          title={submitLabel}
          height={52}
          style={{ flex: 2 }}
          onPress={() => {
            if (error) return setShowErrors(true);
            onSubmit();
          }}
        />
      </View>

      <Sheet
        visible={repeatOpen}
        onClose={() => setRepeatOpen(false)}
        title="Repeat"
        footer={<Button title="Done" variant="light" height={52} flex onPress={() => setRepeatOpen(false)} />}
      >
        <View style={styles.chips}>
          {(
            [
              ['never', 'Never'],
              ['daily', 'Daily'],
              ['weekly', 'Weekly'],
              ['monthly', 'Monthly'],
              ['custom', 'Custom'],
            ] as [RepeatRule['kind'], string][]
          ).map(([k, label]) => (
            <Chip key={k} label={label} on={r.kind === k} onPress={() => setRepeatKind(k)} />
          ))}
        </View>
        {r.kind === 'weekly' ? (
          <View style={styles.dayCard}>
            <DayPicker value={r.days} weekStart={weekStart} onChange={(days) => set({ repeat: { kind: 'weekly', days } })} />
          </View>
        ) : null}
        {r.kind === 'custom' ? (
          <View style={styles.customCard}>
            <StepperRow label="Every" value={r.every} min={1} max={99} onChange={(every) => set({ repeat: { ...r, every } })} />
            <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16 }}>
              {(['day', 'week', 'month'] as RepeatUnit[]).map((u) => (
                <Chip key={u} flex label={`${u[0].toUpperCase()}${u.slice(1)}s`} on={r.unit === u} onPress={() => set({ repeat: { ...r, unit: u } })} />
              ))}
            </View>
            <View style={[styles.divider, { marginHorizontal: 16 }]} />
            <View style={{ gap: 8, paddingHorizontal: 16 }}>
              <Text size={15} weight={600}>
                Count from
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Chip flex label="Due date" on={r.from === 'due'} onPress={() => set({ repeat: { ...r, from: 'due' } })} />
                <Chip flex label="When I finish" on={r.from === 'completion'} onPress={() => set({ repeat: { ...r, from: 'completion' } })} />
              </View>
            </View>
          </View>
        ) : null}
        {r.kind !== 'never' ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="repeat" size={16} color={colors.chipMutedText} />
            <Text size={13.5} weight={600} color={colors.chipMutedText} lineHeight={20} style={{ flex: 1 }}>
              {repeatSummary(r, task.dueDay)}
            </Text>
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={dateOpen} onClose={() => setDateOpen(false)} title="Pick date" dragFromContent={false} footer={<Button title="Done" variant="light" height={52} flex onPress={() => setDateOpen(false)} />}>
        <DateTimePicker
          value={task.dueDay ? new Date(`${task.dueDay}T12:00:00`) : new Date()}
          mode="date"
          display="inline"
          themeVariant="dark"
          accentColor={colors.accent}
          minimumDate={new Date()}
          onChange={(_, d) => d && set({ dueDay: localDay(d, 0) })}
        />
      </Sheet>

      <TimeSheet
        visible={timeOpen}
        title="Time"
        initial={task.dueTime ?? '10:00'}
        onClose={() => setTimeOpen(false)}
        onDone={(t) => {
          set({ dueTime: t });
          setTimeOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.headerBorder },
  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 22 },
  title: { height: 54, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  notes: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  section: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, paddingLeft: 16, paddingRight: 12, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingLeft: 16, paddingRight: 14, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  card: { borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingLeft: 16, paddingRight: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  stub: { width: 20, height: 20, borderRadius: 7, backgroundColor: colors.divider },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  itemInput: { flex: 1, height: 50, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  dayCard: { padding: 12, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  customCard: { gap: 14, paddingBottom: 16, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.headerBorder },
});
