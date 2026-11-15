export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type DayName = (typeof DAY_NAMES)[number];

export type HabitType = "check" | "count" | "checklist";

export type Habit = {
  id: string;
  title: string;
  type: HabitType;
  color: string;
  daysPerWeek?: number;
  /** count habits: default target per day */
  target?: number;
  /** count habits: per-weekday override of target */
  timesByDay?: Partial<Record<DayName, number>>;
  /** checklist habits: items per weekday */
  tasksByDay?: Partial<Record<DayName, string[]>>;
  createdAt: string; // ISO
};

/** One day's progress on a habit. */
export type HabitEntry = {
  done?: boolean; // check habits
  count?: number; // count habits
  tasks?: Record<string, boolean>; // checklist habits
};

/** habitId -> dateKey (YYYY-MM-DD) -> entry */
export type HabitLog = Record<string, Record<string, HabitEntry>>;

export type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  datetime?: string; // ISO
  subtasks: Subtask[];
  done: boolean;
  completedAt?: string; // ISO
  createdAt: string; // ISO
};

export type AppData = {
  version: 1;
  habits: Habit[];
  habitLog: HabitLog;
  tasks: Task[];
};
