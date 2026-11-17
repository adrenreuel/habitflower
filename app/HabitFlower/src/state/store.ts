/**
 * App state. Loaded from SQLite at launch; every action writes through to
 * the database first, then updates memory. Screens read derived views from
 * src/state/selectors.ts.
 */
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { isComplete } from '@/domain/checkin';
import { localDay } from '@/domain/day';
import { applyRuleEdit } from '@/domain/rules';
import { nextDue } from '@/domain/tasks';
import type {
  AppNotification,
  AwayRange,
  ChecklistItem,
  CheckIn,
  CheckinValue,
  Habit,
  LocalDay,
  PauseRange,
  Task,
  User,
  UserSettings,
} from '@/domain/types';
import { wipeDb } from '@/data/db';
import { repo } from '@/data/repo';

export const uuid = () => Crypto.randomUUID();
const nowISO = () => new Date().toISOString();

export const DEFAULT_SETTINGS: UserSettings = {
  weekStart: 0,
  dayResetHour: 0,
  away: false,
  notifications: {
    reminders: true,
    windowClosing: true,
    wilting: true,
    milestones: true,
    nudges: true,
    reactions: true,
    requests: true,
    friendPosts: false,
  },
};

function newUser(): User {
  return {
    id: uuid(),
    username: null,
    avatarSeed: uuid().slice(0, 8),
    linkedProviders: [],
    settings: DEFAULT_SETTINGS,
    usernameChangedAt: null,
  };
}

const meta = () => {
  const t = nowISO();
  return { createdAt: t, updatedAt: t, syncedAt: null, deletedAt: null };
};

export type HabitInput = Pick<
  Habit,
  'name' | 'flowerKind' | 'checkinType' | 'config' | 'schedule' | 'windows' | 'windowMode' | 'reminders' | 'sharing'
>;

export type TaskInput = Pick<Task, 'title' | 'notes' | 'dueDay' | 'dueTime' | 'repeat' | 'checklist'>;

/** What "Mark as done" did, so it can be undone. */
export type TaskCompletion = { task: Task; nextDueDay: LocalDay | null };

type State = {
  ready: boolean;
  onboarded: boolean;
  user: User;
  habits: Habit[];
  checkIns: CheckIn[];
  pauses: PauseRange[];
  aways: AwayRange[];
  tasks: Task[];
  notifications: AppNotification[];
};

type Actions = {
  init(): void;
  today(): LocalDay;
  completeOnboarding(): void;
  updateSettings(patch: Partial<UserSettings>): void;
  updateUser(patch: Partial<Omit<User, 'id' | 'settings'>>): void;
  setAway(on: boolean): void;

  createHabit(input: HabitInput): Habit;
  updateHabit(id: string, patch: Partial<HabitInput>): void;
  deleteHabit(id: string): void;
  pauseHabit(id: string): void;
  restoreHabit(id: string): void;
  setCheckIn(habitId: string, day: LocalDay, slot: number, value: CheckinValue): CheckIn;
  clearCheckIn(habitId: string, day: LocalDay, slot: number): void;

  createTask(input: TaskInput): Task;
  updateTask(id: string, patch: Partial<TaskInput>): void;
  deleteTask(id: string): void;
  completeTask(id: string): TaskCompletion | null;
  undoCompleteTask(c: TaskCompletion): void;
  /** Reopen a finished one-off task (Undo after leaving and coming back). */
  reopenTask(id: string): void;
  toggleChecklistItem(taskId: string, itemId: string): void;
  addChecklistItem(taskId: string, label: string): void;

  addNotification(n: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'readAt'>): void;
  markNotificationsRead(): void;

  /** Delete account / sign out: wipe local data and start fresh. */
  resetAll(): void;
};

export type AppStore = State & Actions;

export const useStore = create<AppStore>()((set, get) => ({
  ready: false,
  onboarded: false,
  user: newUser(),
  habits: [],
  checkIns: [],
  pauses: [],
  aways: [],
  tasks: [],
  notifications: [],

  init() {
    let user = repo.getKV<User>('user');
    if (!user) {
      user = newUser();
      repo.setKV('user', user);
    }
    // Fill settings added after the user row was first written.
    user = { ...user, settings: { ...DEFAULT_SETTINGS, ...user.settings, notifications: { ...DEFAULT_SETTINGS.notifications, ...user.settings?.notifications } } };
    set({
      ready: true,
      onboarded: repo.getKV<boolean>('onboarded') ?? false,
      user,
      habits: repo.loadHabits(),
      checkIns: repo.loadCheckIns(),
      pauses: repo.loadPauses(),
      aways: repo.loadAways(),
      tasks: repo.loadTasks(),
      notifications: repo.loadNotifications(),
    });
  },

  today() {
    return localDay(new Date(), get().user.settings.dayResetHour);
  },

  completeOnboarding() {
    repo.setKV('onboarded', true);
    set({ onboarded: true });
  },

  updateSettings(patch) {
    const user = { ...get().user, settings: { ...get().user.settings, ...patch } };
    repo.setKV('user', user);
    set({ user });
  },

  updateUser(patch) {
    const user = { ...get().user, ...patch };
    repo.setKV('user', user);
    set({ user });
  },

  setAway(on) {
    const today = get().today();
    const aways = [...get().aways];
    if (on) {
      const a: AwayRange = { ...meta(), id: uuid(), userId: get().user.id, start: today, end: null };
      repo.saveAway(a);
      aways.push(a);
    } else {
      const i = aways.findIndex((a) => a.end === null);
      if (i >= 0) {
        // Turned on and off the same day: drop the range entirely.
        const a = aways[i];
        const ended: AwayRange =
          a.start >= today
            ? { ...a, deletedAt: nowISO(), updatedAt: nowISO() }
            : { ...a, end: today, updatedAt: nowISO() };
        repo.saveAway(ended);
        if (ended.deletedAt) aways.splice(i, 1);
        else aways[i] = ended;
      }
    }
    get().updateSettings({ away: on });
    set({ aways });
  },

  createHabit(input) {
    const habits = get().habits;
    const h: Habit = {
      ...meta(),
      ...input,
      id: uuid(),
      ownerId: get().user.id,
      groupId: null,
      pausedAt: null,
      startDay: get().today(),
      sortOrder: habits.length ? Math.max(...habits.map((x) => x.sortOrder)) + 1 : 0,
    };
    repo.saveHabit(h);
    set({ habits: [...habits, h] });
    return h;
  },

  updateHabit(id, patch) {
    set({
      habits: get().habits.map((h) => {
        if (h.id !== id) return h;
        // Past days keep the rules they were judged by; the check-in type is locked.
        const next = { ...h, ...applyRuleEdit(h, patch, get().today()), updatedAt: nowISO() };
        repo.saveHabit(next);
        return next;
      }),
    });
  },

  deleteHabit(id) {
    const h = get().habits.find((x) => x.id === id);
    if (!h) return;
    const t = nowISO();
    repo.saveHabit({ ...h, deletedAt: t, updatedAt: t });
    const gone = get().checkIns.filter((c) => c.habitId === id);
    gone.forEach((c) => repo.saveCheckIn({ ...c, deletedAt: t, updatedAt: t }));
    set({
      habits: get().habits.filter((x) => x.id !== id),
      checkIns: get().checkIns.filter((c) => c.habitId !== id),
      pauses: get().pauses.filter((p) => p.habitId !== id),
    });
  },

  pauseHabit(id) {
    const today = get().today();
    const p: PauseRange = { ...meta(), id: uuid(), habitId: id, start: today, end: null };
    repo.savePause(p);
    set({
      pauses: [...get().pauses, p],
      habits: get().habits.map((h) => (h.id === id ? withSave({ ...h, pausedAt: nowISO() }) : h)),
    });
  },

  restoreHabit(id) {
    const today = get().today();
    const pauses = get().pauses.map((p) => {
      if (p.habitId !== id || p.end !== null) return p;
      const next: PauseRange =
        p.start >= today ? { ...p, deletedAt: nowISO(), updatedAt: nowISO() } : { ...p, end: today, updatedAt: nowISO() };
      repo.savePause(next);
      return next;
    });
    set({
      pauses: pauses.filter((p) => !p.deletedAt),
      habits: get().habits.map((h) => (h.id === id ? withSave({ ...h, pausedAt: null }) : h)),
    });
  },

  setCheckIn(habitId, day, slot, value) {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) throw new Error('Habit not found');
    const inMemory = get().checkIns.find((c) => c.habitId === habitId && c.localDay === day && c.slot === slot);
    // An undone check-in stays in the database (soft-deleted, so the undo syncs).
    // Revive that row instead of inserting a second one for the same slot.
    const existing = inMemory ?? repo.findCheckIn(habitId, day, slot);
    const t = nowISO();
    const c: CheckIn = existing
      ? { ...existing, value, complete: isComplete(habit, value), updatedAt: t, deletedAt: null }
      : {
          ...meta(),
          id: uuid(),
          habitId,
          userId: get().user.id,
          localDay: day,
          slot,
          value,
          complete: isComplete(habit, value),
          photoAudience: null,
        };
    repo.saveCheckIn(c);
    set({ checkIns: inMemory ? get().checkIns.map((x) => (x.id === c.id ? c : x)) : [...get().checkIns, c] });
    return c;
  },

  clearCheckIn(habitId, day, slot) {
    const existing = get().checkIns.find((c) => c.habitId === habitId && c.localDay === day && c.slot === slot);
    if (!existing) return;
    const t = nowISO();
    repo.saveCheckIn({ ...existing, deletedAt: t, updatedAt: t });
    set({ checkIns: get().checkIns.filter((c) => c.id !== existing.id) });
  },

  createTask(input) {
    const task: Task = { ...meta(), ...input, id: uuid(), ownerId: get().user.id, sharedWith: [], completedAt: null, doneLog: [] };
    repo.saveTask(task);
    set({ tasks: [...get().tasks, task] });
    return task;
  },

  updateTask(id, patch) {
    set({
      tasks: get().tasks.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch, updatedAt: nowISO() };
        repo.saveTask(next);
        return next;
      }),
    });
  },

  deleteTask(id) {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const t = nowISO();
    repo.saveTask({ ...task, deletedAt: t, updatedAt: t });
    set({ tasks: get().tasks.filter((x) => x.id !== id) });
  },

  completeTask(id) {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return null;
    const today = get().today();
    const due = nextDue(task, today);
    const doneLog = [...(task.doneLog ?? []), today];
    const next: Task = due
      ? // Repeating: roll forward to the next one with a fresh checklist.
        { ...task, dueDay: due, doneLog, checklist: task.checklist.map((i) => ({ ...i, done: false })), updatedAt: nowISO() }
      : { ...task, doneLog, completedAt: nowISO(), updatedAt: nowISO() };
    repo.saveTask(next);
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
    return { task, nextDueDay: due };
  },

  undoCompleteTask(c) {
    const restored = { ...c.task, updatedAt: nowISO() };
    repo.saveTask(restored);
    set({ tasks: get().tasks.map((t) => (t.id === c.task.id ? restored : t)) });
  },

  reopenTask(id) {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next: Task = { ...task, completedAt: null, doneLog: task.doneLog.slice(0, -1), updatedAt: nowISO() };
    repo.saveTask(next);
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
  },

  toggleChecklistItem(taskId, itemId) {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    get().updateTask(taskId, {
      checklist: task.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    });
  },

  addChecklistItem(taskId, label) {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !label.trim()) return;
    const item: ChecklistItem = { id: uuid(), label: label.trim(), done: false };
    get().updateTask(taskId, { checklist: [...task.checklist, item] });
  },

  addNotification(n) {
    const full: AppNotification = { ...n, id: uuid(), userId: get().user.id, createdAt: nowISO(), readAt: null };
    repo.saveNotification(full);
    set({ notifications: [full, ...get().notifications] });
  },

  markNotificationsRead() {
    const t = nowISO();
    set({
      notifications: get().notifications.map((n) => {
        if (n.readAt) return n;
        const next = { ...n, readAt: t };
        repo.saveNotification(next);
        return next;
      }),
    });
  },

  resetAll() {
    wipeDb();
    const user = newUser();
    repo.setKV('user', user);
    set({
      onboarded: false,
      user,
      habits: [],
      checkIns: [],
      pauses: [],
      aways: [],
      tasks: [],
      notifications: [],
    });
  },
}));

function withSave(h: Habit): Habit {
  const next = { ...h, updatedAt: nowISO() };
  repo.saveHabit(next);
  return next;
}
