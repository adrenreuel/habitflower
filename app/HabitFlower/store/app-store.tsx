import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { newId } from "@/lib/habits";
import type { AppData, Habit, HabitEntry, Task } from "@/lib/types";

const STORAGE_KEY = "habitflower:data:v1";

/** First-run sample data, so the app isn't empty on install. */
function seedData(): AppData {
  const now = new Date().toISOString();
  return {
    version: 1,
    habits: [
      { id: "seed-gym", title: "Hit the gym", type: "check", color: "#6B3F69", daysPerWeek: 3, createdAt: now },
      {
        id: "seed-workout",
        title: "Gym workout",
        type: "checklist",
        color: "#4BAF17",
        daysPerWeek: 5,
        tasksByDay: {
          Mon: ["Bench press", "Incline dumbbell", "Tricep dips"],
          Tue: ["Squats", "Lunges", "Calf raises"],
          Wed: ["Pull-ups", "Barbell rows", "Bicep curls"],
          Thu: ["Shoulder press", "Lateral raises", "Face pulls"],
          Fri: ["Deadlifts", "Hip thrusts", "Leg curls"],
        },
        createdAt: now,
      },
      { id: "seed-pushups", title: "Push-ups", type: "count", color: "#FFB020", target: 3, daysPerWeek: 7, createdAt: now },
      {
        id: "seed-scales",
        title: "Practice scales",
        type: "count",
        color: "#3B82F6",
        target: 3,
        daysPerWeek: 5,
        timesByDay: { Mon: 2, Wed: 3, Fri: 1 },
        createdAt: now,
      },
    ],
    habitLog: {},
    tasks: [
      {
        id: "seed-assignment",
        title: "Finish assignment",
        description: "Finish the math assignment before class",
        datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subtasks: [],
        done: false,
        createdAt: now,
      },
      {
        id: "seed-grocery",
        title: "Grocery run",
        description: "Quick trip to pick up essentials for the week",
        datetime: now,
        subtasks: ["Milk", "Eggs", "Bread"].map((text) => ({ id: newId(), text, done: false })),
        done: false,
        createdAt: now,
      },
    ],
  };
}

export type NewTask = Pick<Task, "title" | "description" | "datetime"> & {
  subtasks?: string[];
};
export type NewHabit = Omit<Habit, "id" | "createdAt">;

type Store = {
  ready: boolean;
  data: AppData;
  // habits
  addHabit: (h: NewHabit) => void;
  updateHabit: (id: string, patch: Partial<NewHabit>) => void;
  deleteHabit: (id: string) => void;
  setHabitEntry: (
    habitId: string,
    key: string,
    update: (prev: HabitEntry) => HabitEntry,
  ) => void;
  // tasks
  addTask: (t: NewTask) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  setTaskDone: (id: string, done: boolean) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
};

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(seedData);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppData;
          if (parsed?.version === 1) setData(parsed);
        }
      } catch (e) {
        console.warn("Failed to load HabitFlower data", e);
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change after load
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>
      console.warn("Failed to save HabitFlower data", e),
    );
  }, [data]);

  const addHabit = useCallback((h: NewHabit) => {
    setData((d) => ({
      ...d,
      habits: [...d.habits, { ...h, id: newId(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<NewHabit>) => {
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setData((d) => {
      const { [id]: _removed, ...habitLog } = d.habitLog;
      return { ...d, habits: d.habits.filter((h) => h.id !== id), habitLog };
    });
  }, []);

  const setHabitEntry = useCallback<Store["setHabitEntry"]>((habitId, key, update) => {
    setData((d) => {
      const entries = d.habitLog[habitId] ?? {};
      return {
        ...d,
        habitLog: {
          ...d.habitLog,
          [habitId]: { ...entries, [key]: update(entries[key] ?? {}) },
        },
      };
    });
  }, []);

  const addTask = useCallback((t: NewTask) => {
    setData((d) => ({
      ...d,
      tasks: [
        ...d.tasks,
        {
          id: newId(),
          title: t.title,
          description: t.description,
          datetime: t.datetime,
          subtasks: (t.subtasks ?? []).map((text) => ({ id: newId(), text, done: false })),
          done: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Omit<Task, "id">>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  const setTaskDone = useCallback((id: string, done: boolean) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? { ...t, done, completedAt: done ? new Date().toISOString() : undefined }
          : t,
      ),
    }));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s,
              ),
            }
          : t,
      ),
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      data,
      addHabit,
      updateHabit,
      deleteHabit,
      setHabitEntry,
      addTask,
      updateTask,
      deleteTask,
      setTaskDone,
      toggleSubtask,
    }),
    [ready, data, addHabit, updateHabit, deleteHabit, setHabitEntry, addTask, updateTask, deleteTask, setTaskDone, toggleSubtask],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): Store {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
