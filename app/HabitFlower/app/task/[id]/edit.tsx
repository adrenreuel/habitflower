import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { isRepeating, repeatLabel } from '@/domain/tasks';
import { TaskForm } from '@/features/tasks/TaskForm';
import { useStore, type TaskInput } from '@/state/store';
import { colors } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useStore((s) => s.tasks.find((t) => t.id === id));
  const { updateTask, deleteTask } = useStore.getState();
  const [task, setTask] = useState<TaskInput | null>(() =>
    existing ? { title: existing.title, notes: existing.notes, dueDay: existing.dueDay, dueTime: existing.dueTime, repeat: existing.repeat, checklist: existing.checklist } : null,
  );
  const [confirm, setConfirm] = useState(false);
  if (!existing || !task) return null;

  return (
    <>
      <TaskForm
        title="Edit task"
        task={task}
        onChange={setTask}
        submitLabel="Save changes"
        onCancel={() => router.back()}
        onSubmit={() => {
          updateTask(existing.id, { ...task, title: task.title.trim(), notes: task.notes.trim() });
          router.back();
        }}
        extra={
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirm(true)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', backgroundColor: pressed ? colors.cardPressed : colors.card })}
          >
            <Icon name="trash" size={22} color={colors.deleteText} strokeWidth={2} />
            <Text size={15} weight={700} color={colors.deleteText}>
              Delete task
            </Text>
          </Pressable>
        }
      />
      <Sheet visible={confirm} onClose={() => setConfirm(false)} title="Delete this task?">
        {isRepeating(existing.repeat) ? (
          <Text size={14.5} weight={500} color={colors.text2} lineHeight={21}>
            It repeats {repeatLabel(existing.repeat).toLowerCase()}. Future ones will be deleted too.
          </Text>
        ) : null}
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Button
            title="Delete task"
            variant="destructive"
            height={52}
            onPress={() => {
              setConfirm(false);
              deleteTask(existing.id);
              router.dismissAll();
            }}
          />
          <Button title="Keep it" variant="secondary" height={52} onPress={() => setConfirm(false)} />
        </View>
      </Sheet>
    </>
  );
}
