/**
 * New / Edit habit form (NewHabit.dc.html, EditHabit.dc.html).
 * Field order: flower (tile with Change), name, how you check in, schedule,
 * window, reminders. Grow together and Sharing need friends (v1.1, v1.2) and
 * are hidden in v1.
 *
 * Edit rules: how you check in is locked (its settings stay editable),
 * schedule changes start tomorrow, everything else applies from today.
 */
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COUNT_MAX, COUNT_MIN } from '@/domain/checkin';
import { formatTimeOfDay, parseTime } from '@/domain/day';
import { sameSchedule } from '@/domain/rules';
import { V1_CHECKIN_TYPES, type CheckinType, type HabitConfig, type Schedule, type CheckinWindow, type WindowMode } from '@/domain/types';
import { MAX_REMINDERS, MAX_WINDOWS, formatWindow } from '@/domain/windows';
import type { HabitInput } from '@/state/store';
import { useStore, uuid } from '@/state/store';
import { colors, fonts, infoNote, tint, type FlowerKind } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Switch } from '@/ui/Card';
import { DayPicker } from '@/ui/Chip';
import { Icon, type IconName } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { StepperRow } from '@/ui/Stepper';
import { Text } from '@/ui/Text';
import { TimeSheet, WindowSheet } from '@/ui/TimeSheet';
import { FlowerButton, FlowerPickerSheet } from './FlowerPicker';
import { Grain } from '@/ui/Grain';

export type HabitDraft = HabitInput;

export function emptyDraft(name = '', kind: FlowerKind = 'sunflower'): HabitDraft {
  return {
    name,
    flowerKind: kind,
    checkinType: 'check',
    config: { countTarget: 3, listItems: [] },
    schedule: { kind: 'daily' },
    windows: [],
    windowMode: 'per',
    reminders: [],
    sharing: { progress: { kind: 'everyone' }, photos: 'same' },
  };
}

const KINDS: Record<CheckinType, { label: string; desc: string; icon: IconName }> = {
  check: { label: 'Check off', desc: 'Tap once to finish', icon: 'checkCircle' },
  count: { label: 'Count', desc: 'Do it a set number of times', icon: 'counter' },
  list: { label: 'List', desc: 'Check off every item', icon: 'list' },
  photo: { label: 'Photo', desc: 'Snap a photo', icon: 'camera' },
  health: { label: 'Health', desc: 'Syncs from Apple Health', icon: 'health' },
};

export function validateDraft(d: HabitDraft): string | null {
  if (!d.name.trim()) return 'Give your habit a name.';
  if (d.schedule.kind === 'days' && d.schedule.days.length === 0) return 'Pick at least one day.';
  if (d.checkinType === 'list' && !(d.config.listItems ?? []).some((i) => i.label.trim())) return 'Add at least one item.';
  return null;
}

function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text label accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <Text size={13.5} weight={500} color={colors.text2}>
      {children}
    </Text>
  );
}

function SelectChip({ label, on, onPress, flex, accessibilityLabel }: { label: string; on: boolean; onPress: () => void; flex?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[styles.chip, flex && { flex: 1, paddingHorizontal: 0 }, { backgroundColor: on ? colors.accentTint : colors.raised }]}
    >
      <Text size={14} weight={700} color={on ? colors.accentTintText : colors.chipText}>
        {label}
      </Text>
    </Pressable>
  );
}

function ListRow({ label, onRemove, removeLabel, icon }: { label: string; onRemove: () => void; removeLabel: string; icon?: IconName }) {
  return (
    <View style={styles.listRow}>
      {icon ? <Icon name={icon} size={18} color={colors.accentTintText} /> : <View style={styles.checkStub} />}
      <Text size={15} weight={600} color={icon ? colors.accentTintText : colors.text} style={{ flex: 1 }}>
        {label}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} onPress={onRemove} style={styles.iconBtn}>
        <Icon name="close" size={18} color={colors.text3Small} />
      </Pressable>
    </View>
  );
}

function AddRow({ label, onPress, color = colors.accent }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.addRow]}>
      <Icon name="plusSmall" size={18} color={color} strokeWidth={2.6} />
      <Text size={15} weight={700} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

function suggestWindow(existing: CheckinWindow[]): CheckinWindow {
  const presets: CheckinWindow[] = [
    { start: '07:00', end: '09:00' },
    { start: '12:00', end: '13:00' },
    { start: '18:00', end: '20:00' },
  ];
  return presets.find((p) => !existing.some((w) => w.start === p.start)) ?? { start: '20:00', end: '21:00' };
}

export function HabitForm({
  title,
  draft,
  onChange,
  submitLabel,
  onSubmit,
  onCancel,
  manage,
  usedBy = {},
  lockedType,
  onStartNew,
  originalSchedule,
}: {
  title: string;
  draft: HabitDraft;
  onChange: (d: HabitDraft) => void;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  /** Edit only: Pause and Delete. */
  manage?: ReactNode;
  /** Flowers other habits use (shown as a "Used" hint in the picker). */
  usedBy?: Partial<Record<FlowerKind, string>>;
  /** Edit only: the check-in type can't change after creation. */
  lockedType?: boolean;
  /** Edit only: opens New habit pre-filled, to check in another way. */
  onStartNew?: () => void;
  /** Edit only: the saved schedule, to explain when changes start. */
  originalSchedule?: Schedule;
}) {
  const insets = useSafeAreaInsets();
  const weekStart = useStore((st) => st.user.settings.weekStart);
  const [pickOpen, setPickOpen] = useState(false);
  const [kindsOpen, setKindsOpen] = useState(false);
  const [windowEdit, setWindowEdit] = useState<{ index: number | null; value: CheckinWindow } | null>(null);
  const [reminderEdit, setReminderEdit] = useState<{ index: number | null; value: string } | null>(null);
  const [newItem, setNewItem] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const set = (patch: Partial<HabitDraft>) => onChange({ ...draft, ...patch });
  const setConfig = (patch: Partial<HabitConfig>) => set({ config: { ...draft.config, ...patch } });

  const multi = draft.windows.length >= 2;
  const perWin = multi && draft.windowMode === 'per';
  const times = draft.config.countTarget ?? COUNT_MIN;
  const items = draft.config.listItems ?? [];
  const error = validateDraft(draft);

  const kindHint =
    draft.checkinType === 'check'
      ? 'Tap once to mark the day done.'
      : draft.checkinType === 'list'
        ? perWin
          ? 'Check off every item in each window.'
          : 'Check off every item to finish the day.'
        : `Done after ${times} times.`;

  const s = draft.schedule;
  const schedHint =
    s.kind === 'daily'
      ? 'Missing a day restarts your streak.'
      : s.kind === 'days'
        ? s.days.length
          ? 'Other days are rest days and won’t break your streak.'
          : 'Pick at least one day.'
        : `Any ${s.times} days count.`;

  const winHint = multi
    ? `${draft.windowMode === 'per' ? 'Check in during each window. ' : 'Any open window counts. '}You can log up to 1 hour after a window ends.`
    : 'You can still check in up to 1 hour after a window ends.';

  const setSchedule = (kind: Schedule['kind']) => {
    if (kind === 'daily') set({ schedule: { kind } });
    else if (kind === 'days') set({ schedule: { kind, days: s.kind === 'days' ? s.days : [1, 3, 5] } });
    else set({ schedule: { kind, times: s.kind === 'perWeek' ? s.times : 3 } });
  };

  const addItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setConfig({ listItems: [...items, { id: uuid(), label }] });
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
      <KeyboardAwareScroll>
        <View style={{ gap: 16 }}>
          <FlowerButton kind={draft.flowerKind} onPress={() => setPickOpen(true)} />
          <TextInput
            accessibilityLabel="Habit name"
            value={draft.name}
            onChangeText={(name) => set({ name })}
            placeholder="Habit name"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.nameInput}
            returnKeyType="done"
            maxLength={60}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel>How you check in</SectionLabel>
          {lockedType ? (
            <>
              <View accessible accessibilityLabel={`How you check in: ${KINDS[draft.checkinType].label}. Locked`} style={styles.pickRow}>
                <View style={styles.kindTile}>
                  <Icon name={KINDS[draft.checkinType].icon} size={20} color={colors.accentTintText} />
                </View>
                <Text size={16} weight={700} style={{ flex: 1 }}>
                  {KINDS[draft.checkinType].label}
                </Text>
                <Icon name="lock" size={18} color={colors.text3} strokeWidth={2.2} />
              </View>
              <Text size={13.5} weight={500} color={colors.text2}>
                {'To check in another way, '}
                <Text size={13.5} weight={700} color={colors.accentTintText} onPress={onStartNew} accessibilityRole="link">
                  start a new habit
                </Text>
                .
              </Text>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`How you check in: ${KINDS[draft.checkinType].label}`}
                onPress={() => setKindsOpen(true)}
                style={styles.pickRow}
              >
                <View style={styles.kindTile}>
                  <Icon name={KINDS[draft.checkinType].icon} size={20} color={colors.accentTintText} />
                </View>
                <Text size={16} weight={700} style={{ flex: 1 }}>
                  {KINDS[draft.checkinType].label}
                </Text>
                <Icon name="chevronDownSmall" size={20} color={colors.text3} />
              </Pressable>
              <Hint>{kindHint}</Hint>
            </>
          )}
          {draft.checkinType === 'count' ? (
            <StepperRow
              label={perWin ? 'Times per window' : 'Times a day'}
              sublabel={perWin ? `${times * draft.windows.length} times a day` : undefined}
              value={times}
              min={COUNT_MIN}
              max={COUNT_MAX}
              onChange={(n) => setConfig({ countTarget: n })}
            />
          ) : null}
          {draft.checkinType === 'list' ? (
            <View style={styles.cardList}>
              {items.map((it, i) => (
                <View key={it.id}>
                  <ListRow label={it.label} removeLabel={`Remove ${it.label}`} onRemove={() => setConfig({ listItems: items.filter((_, j) => j !== i) })} />
                  <View style={styles.divider} />
                </View>
              ))}
              <View style={[styles.listRow, { paddingRight: 8 }]}>
                <Icon name="plusSmall" size={18} color={colors.accentTintText} strokeWidth={2.6} />
                <TextInput
                  accessibilityLabel="Add item"
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={addItem}
                  placeholder="Add item"
                  placeholderTextColor={colors.accentTintText}
                  style={styles.itemInput}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                {newItem.trim() ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={addItem} style={styles.iconBtn}>
                    <Icon name="check" size={18} color={colors.accent} strokeWidth={2.8} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionLabel>Schedule</SectionLabel>
          <View style={styles.chips}>
            <SelectChip label="Every day" on={s.kind === 'daily'} onPress={() => setSchedule('daily')} />
            <SelectChip label="Specific days" on={s.kind === 'days'} onPress={() => setSchedule('days')} />
            <SelectChip label="Days a week" on={s.kind === 'perWeek'} onPress={() => setSchedule('perWeek')} />
          </View>
          {s.kind === 'days' ? (
            <View style={styles.dayCard}>
              <DayPicker value={s.days} weekStart={weekStart} onChange={(days) => set({ schedule: { kind: 'days', days } })} />
            </View>
          ) : null}
          {s.kind === 'perWeek' ? (
            <StepperRow label="Days a week" value={s.times} min={1} max={6} onChange={(t) => set({ schedule: { kind: 'perWeek', times: t } })} />
          ) : null}
          <Hint>{schedHint}</Hint>
          {originalSchedule && !sameSchedule(originalSchedule, s) ? (
            <View style={styles.note} accessibilityRole="text" accessibilityLiveRegion="polite">
              <Icon name="clock" size={16} color={infoNote.text} strokeWidth={2.2} />
              <Text size={13} weight={600} color={infoNote.text} style={{ flex: 1 }}>
                Changes start tomorrow. Past days stay as they were.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.cardList}>
            <View style={styles.switchRow}>
              <Text size={15} weight={600}>
                Check-in window
              </Text>
              <Switch
                accessibilityLabel="Check-in window"
                value={draft.windows.length > 0}
                onValueChange={(on) => set({ windows: on ? [suggestWindow([])] : [] })}
              />
            </View>
            {draft.windows.map((w, i) => (
              <View key={`${w.start}-${i}`}>
                <View style={styles.divider} />
                <Pressable accessibilityRole="button" accessibilityLabel={`Change ${formatWindow(w)}`} onPress={() => setWindowEdit({ index: i, value: w })}>
                  <ListRow
                    icon="clock"
                    label={formatWindow(w)}
                    removeLabel={`Remove ${formatWindow(w)}`}
                    onRemove={() => set({ windows: draft.windows.filter((_, j) => j !== i) })}
                  />
                </Pressable>
              </View>
            ))}
            {draft.windows.length > 0 && draft.windows.length < MAX_WINDOWS ? (
              <>
                <View style={styles.divider} />
                <AddRow label="Add window" onPress={() => setWindowEdit({ index: null, value: suggestWindow(draft.windows) })} />
              </>
            ) : null}
          </View>
          {multi ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(
                [
                  ['per', 'Per window'],
                  ['any', 'Any window'],
                ] as [WindowMode, string][]
              ).map(([m, label]) => (
                <SelectChip key={m} label={label} flex on={draft.windowMode === m} onPress={() => set({ windowMode: m })} />
              ))}
            </View>
          ) : null}
          {draft.windows.length > 0 ? <Hint>{winHint}</Hint> : null}
        </View>

        <View style={styles.cardList}>
          <View style={styles.switchRow}>
            <Text size={15} weight={600}>
              Reminders
            </Text>
            <Switch
              accessibilityLabel="Reminders"
              value={draft.reminders.length > 0}
              onValueChange={(on) => set({ reminders: on ? [draft.windows[0]?.start ?? '08:00'] : [] })}
            />
          </View>
          {draft.reminders.map((r, i) => (
            <View key={`${r}-${i}`}>
              <View style={styles.divider} />
              <Pressable accessibilityRole="button" accessibilityLabel={`Change reminder at ${formatTimeOfDay(r)}`} onPress={() => setReminderEdit({ index: i, value: r })}>
                <ListRow
                  icon="bell"
                  label={formatTimeOfDay(r)}
                  removeLabel={`Remove reminder at ${formatTimeOfDay(r)}`}
                  onRemove={() => set({ reminders: draft.reminders.filter((_, j) => j !== i) })}
                />
              </Pressable>
            </View>
          ))}
          {draft.reminders.length > 0 && draft.reminders.length < MAX_REMINDERS ? (
            <>
              <View style={styles.divider} />
              <AddRow label="Add reminder" onPress={() => setReminderEdit({ index: null, value: '20:00' })} />
            </>
          ) : null}
        </View>

        {manage}

        {showErrors && error ? (
          <Text size={14} weight={600} color={colors.wilting} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}
      </KeyboardAwareScroll>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Button title="Cancel" variant="secondary" height={52} onPress={onCancel} style={{ flex: 1 }} />
        <Button
          title={submitLabel}
          height={52}
          style={{ flex: 2 }}
          onPress={() => {
            if (error) {
              setShowErrors(true);
              return;
            }
            onSubmit();
          }}
        />
      </View>

      <FlowerPickerSheet
        visible={pickOpen}
        value={draft.flowerKind}
        usedBy={usedBy}
        onClose={() => setPickOpen(false)}
        onPick={(flowerKind) => {
          set({ flowerKind });
          setPickOpen(false);
        }}
      />

      <Sheet visible={kindsOpen} onClose={() => setKindsOpen(false)} title="How you check in">
        <View accessibilityRole="radiogroup" style={{ gap: 6 }}>
          {V1_CHECKIN_TYPES.map((k) => {
            const on = draft.checkinType === k;
            return (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  set({ checkinType: k });
                  setKindsOpen(false);
                }}
                style={[styles.kindOption, { backgroundColor: on ? colors.accentTint : colors.card }]}
              >
                <View style={[styles.kindOptionTile, { backgroundColor: on ? tint(colors.accent, 0.25) : colors.raised }]}>
                  <Icon name={KINDS[k].icon} size={20} color={on ? colors.accentTintText : colors.chipText} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text size={16} weight={700} color={on ? colors.accentTintText : colors.text}>
                    {KINDS[k].label}
                  </Text>
                  <Text size={13} weight={500} color={on ? colors.selectedDesc : colors.text3Small}>
                    {KINDS[k].desc}
                  </Text>
                </View>
                {on ? <Icon name="check" size={20} color={colors.accentTintText} strokeWidth={2.8} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <WindowSheet
        visible={!!windowEdit}
        initial={windowEdit?.value ?? { start: '07:00', end: '09:00' }}
        onClose={() => setWindowEdit(null)}
        onDone={(w) => {
          const next = [...draft.windows];
          if (windowEdit?.index == null) next.push(w);
          else next[windowEdit.index] = w;
          next.sort((a, b) => parseTime(a.start) - parseTime(b.start));
          set({ windows: next });
          setWindowEdit(null);
        }}
      />

      <TimeSheet
        visible={!!reminderEdit}
        title="Reminder"
        initial={reminderEdit?.value ?? '20:00'}
        onClose={() => setReminderEdit(null)}
        onDone={(t) => {
          const next = [...draft.reminders];
          if (reminderEdit?.index == null) next.push(t);
          else next[reminderEdit.index] = t;
          set({ reminders: Array.from(new Set(next)).sort() });
          setReminderEdit(null);
        }}
      />
    </View>
  );
}


function KeyboardAwareScroll({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.headerBorder },
  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 22 },
  nameInput: { height: 50, paddingHorizontal: 14, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.card, color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  section: { gap: 10 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderCurve: 'continuous', backgroundColor: infoNote.bg },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingLeft: 12, paddingRight: 14, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  kindTile: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayCard: { padding: 12, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
  cardList: { borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingLeft: 14, paddingRight: 4 },
  checkStub: { width: 22, height: 22, borderRadius: 7, backgroundColor: colors.divider },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  itemInput: { flex: 1, height: 52, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16 },
  divider: { height: 1, backgroundColor: colors.divider },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, paddingLeft: 16, paddingRight: 12 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.headerBorder },
  kindOption: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingLeft: 12, paddingRight: 16, borderRadius: 18, borderCurve: 'continuous' },
  kindOptionTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
