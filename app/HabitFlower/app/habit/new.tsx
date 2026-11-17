import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { emptyDraft, HabitForm, type HabitDraft } from '@/features/habit-form/HabitForm';
import { SUGGESTIONS } from '@/features/home/HabitsEmpty';
import { FLOWER_KINDS, firstUnusedFlower } from '@/flower/kinds';
import { flowersInUse } from '@/state/selectors';
import { useStore } from '@/state/store';
import type { FlowerKind } from '@/theme/tokens';

/**
 * New habit. Params:
 * - `name`, `kind`: start from a suggestion.
 * - `from`: a habit id; pre-fills everything so the user can pick another way
 *   to check in ("To check in another way, start a new habit").
 */
export default function NewHabitScreen() {
  const params = useLocalSearchParams<{ name?: string; kind?: string; from?: string }>();
  const habits = useStore((s) => s.habits);
  const createHabit = useStore((s) => s.createHabit);
  const [draft, setDraft] = useState<HabitDraft>(() => {
    const source = params.from ? habits.find((h) => h.id === params.from) : undefined;
    if (source) {
      const { name, flowerKind, checkinType, config, schedule, windows, windowMode, reminders, sharing } = source;
      return { name, flowerKind, checkinType, config, schedule, windows, windowMode, reminders, sharing };
    }
    // A new habit defaults to a flower the user isn't using yet.
    const kind = FLOWER_KINDS.includes(params.kind as FlowerKind) ? (params.kind as FlowerKind) : firstUnusedFlower(habits.map((h) => h.flowerKind));
    const base = emptyDraft(params.name ?? '', kind);
    const preset = SUGGESTIONS.find((s) => s.name === params.name)?.preset;
    return preset ? { ...base, ...preset, config: { ...base.config, ...preset.config } } : base;
  });

  return (
    <HabitForm
      title="New habit"
      draft={draft}
      onChange={setDraft}
      submitLabel="Create habit"
      usedBy={flowersInUse(habits)}
      onCancel={() => router.back()}
      onSubmit={() => {
        createHabit({ ...draft, name: draft.name.trim() });
        router.back();
      }}
    />
  );
}
