import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { addDays } from '@/domain/day';
import type { RepeatRule } from '@/domain/types';
import { emptyTask, TaskForm } from '@/features/tasks/TaskForm';
import { useStore } from '@/state/store';

const PRESETS: Record<string, RepeatRule> = {
  monthly: { kind: 'monthly' },
  weekly: { kind: 'weekly', days: [new Date().getDay()] },
};

export default function NewTaskScreen() {
  const params = useLocalSearchParams<{ title?: string; repeat?: string; when?: string }>();
  const today = useStore.getState().today();
  const [task, setTask] = useState(() =>
    emptyTask(today, params.title ?? '', PRESETS[params.repeat ?? ''] ?? { kind: 'never' }, params.when === 'tomorrow' ? addDays(today, 1) : today),
  );
  const createTask = useStore((s) => s.createTask);
  return (
    <TaskForm
      title="New task"
      task={task}
      onChange={setTask}
      submitLabel="Save task"
      onCancel={() => router.back()}
      onSubmit={() => {
        createTask({ ...task, title: task.title.trim(), notes: task.notes.trim() });
        router.back();
      }}
    />
  );
}
