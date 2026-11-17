import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HabitForm, type HabitDraft } from '@/features/habit-form/HabitForm';
import { flowersInUse } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';

function ManageRow({ icon, title, subtitle, color, onPress }: { icon: IconName; title: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.manage, pressed && { backgroundColor: colors.cardPressed }]}>
      <Icon name={icon} size={22} color={color} strokeWidth={2} />
      <View style={{ gap: 2, flex: 1 }}>
        <Text size={15} weight={700} color={color}>
          {title}
        </Text>
        <Text size={13} weight={500} color={colors.text2}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useStore((s) => s.habits.find((h) => h.id === id));
  const habits = useStore((s) => s.habits);
  const { updateHabit, pauseHabit, deleteHabit } = useStore.getState();
  const [draft, setDraft] = useState<HabitDraft | null>(() =>
    habit
      ? {
          name: habit.name,
          flowerKind: habit.flowerKind,
          checkinType: habit.checkinType,
          config: habit.config,
          schedule: habit.schedule,
          windows: habit.windows,
          windowMode: habit.windowMode,
          reminders: habit.reminders,
          sharing: habit.sharing,
        }
      : null,
  );
  const [sheet, setSheet] = useState<'pause' | 'delete' | null>(null);

  if (!habit || !draft) return null;

  const pause = () => {
    setSheet(null);
    pauseHabit(habit.id);
    router.dismissAll();
    router.push('/habits/paused');
  };

  return (
    <>
      <HabitForm
        title="Edit habit"
        draft={draft}
        onChange={setDraft}
        submitLabel="Save changes"
        usedBy={flowersInUse(habits, habit.id)}
        lockedType
        originalSchedule={habit.schedule}
        onStartNew={() => router.push({ pathname: '/habit/new', params: { from: habit.id } })}
        onCancel={() => router.back()}
        onSubmit={() => {
          updateHabit(habit.id, { ...draft, name: draft.name.trim() });
          router.back();
        }}
        manage={
          <View style={{ gap: 8, marginTop: 6 }} accessibilityLabel="Manage habit">
            {!habit.pausedAt ? (
              <ManageRow icon="pause" title="Pause habit" subtitle="Hide it and stop tracking. Restore any time." color={colors.text} onPress={() => setSheet('pause')} />
            ) : null}
            <ManageRow icon="trash" title="Delete habit" subtitle="Removes its history for good" color={colors.deleteText} onPress={() => setSheet('delete')} />
          </View>
        }
      />

      <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)} title={`Pause ${habit.name}?`}>
        <View style={{ gap: 10 }}>
          <Text size={14.5} weight={500} color={colors.sheetBody} lineHeight={20}>
            It leaves your Habits screen and widget, and stops sending reminders.
          </Text>
          <Text size={14.5} weight={500} color={colors.sheetBody} lineHeight={20}>
            Its flower is kept safe under glass. Days while paused don’t count as missed.
          </Text>
        </View>
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Button title="Pause" variant="light" height={52} onPress={pause} />
          <Button title="Keep it active" variant="secondary" height={52} onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'delete'} onClose={() => setSheet(null)} title={`Delete ${habit.name}?`}>
        <Text size={14.5} weight={500} color={colors.sheetBody} lineHeight={20}>
          This removes its flower and history. You can’t undo this. If you might come back to it, pause it instead.
        </Text>
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Button
            title="Delete habit"
            variant="destructive"
            height={52}
            onPress={() => {
              setSheet(null);
              deleteHabit(habit.id);
              router.dismissAll();
            }}
          />
          {!habit.pausedAt ? <Button title="Pause instead" variant="secondary" height={52} onPress={pause} /> : null}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  manage: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card },
});
