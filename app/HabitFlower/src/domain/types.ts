/**
 * Domain model (HANDOFF.md section 14).
 * v1 uses the solo parts. Fields marked v1.1 / v1.2 exist now so the schema
 * and sync payloads do not need rewriting when friends and groups arrive.
 */
import type { FlowerKind } from '@/theme/tokens';

export type { FlowerKind };

/** Local calendar day, "YYYY-MM-DD", already shifted by the day-reset hour. */
export type LocalDay = string;
/** "HH:MM", 24h. */
export type TimeOfDay = string;
export type ID = string;
export type ISODateTime = string;

/** Columns every synced row carries. */
export type SyncMeta = {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** null until the server has acknowledged this version. */
  syncedAt: ISODateTime | null;
  /** Soft delete so deletions sync. */
  deletedAt: ISODateTime | null;
};

export type FlowerStage = 'seed' | 'bud' | 'bloom';
export type FlowerHealth = 'ok' | 'wilt' | 'dormant';

export type DayResetHour = 0 | 2 | 4;
export type WeekStart = 0 | 1; // 0 Sunday, 1 Monday

export type NotificationPrefs = {
  reminders: boolean;
  windowClosing: boolean;
  wilting: boolean;
  milestones: boolean;
  // v1.1
  nudges: boolean;
  reactions: boolean;
  requests: boolean;
  friendPosts: boolean;
};

export type UserSettings = {
  weekStart: WeekStart;
  dayResetHour: DayResetHour;
  away: boolean;
  notifications: NotificationPrefs;
};

export type LinkedProvider = 'apple' | 'google';

export type User = {
  id: ID;
  /** Unique, null until the user picks one for social features (v1.1). */
  username: string | null;
  avatarSeed: string;
  linkedProviders: LinkedProvider[];
  settings: UserSettings;
  usernameChangedAt: ISODateTime | null;
};

// ---------- Habits ----------

export type CheckinType = 'check' | 'count' | 'list' | 'photo' | 'health';
/** Check-in types offered in this release. Photo is v1.1, Health is v1.2. */
export const V1_CHECKIN_TYPES: CheckinType[] = ['check', 'count', 'list'];

export type HealthMetric = 'steps' | 'exercise' | 'move' | 'distance';

export type ListItem = { id: ID; label: string };

export type HabitConfig = {
  /** Count: times per day, or per window in per-window mode. 2 to 20. */
  countTarget?: number;
  /** List: every item must be checked. */
  listItems?: ListItem[];
  /** Photo (v1.1): 1 to 8. */
  photoCount?: number;
  /** Health (v1.2). */
  healthMetric?: HealthMetric;
  healthGoal?: number;
};

export type Schedule =
  | { kind: 'daily' }
  /** 0 Sunday ... 6 Saturday */
  | { kind: 'days'; days: number[] }
  | { kind: 'perWeek'; times: number };

export type CheckinWindow = { start: TimeOfDay; end: TimeOfDay };
export type WindowMode = 'per' | 'any';

export type ProgressAudience = { kind: 'everyone' } | { kind: 'friends'; userIds: ID[] };
export type PhotoAudience = 'same' | 'close' | 'me';

/**
 * v1.1: who can open the full calendar and stats. Everyone else who can see
 * the habit sees this week only (flower, streak, current week).
 */
export type HistoryAudience = 'nobody' | 'close' | 'everyone';

export type HabitSharing = {
  progress: ProgressAudience;
  photos: PhotoAudience;
  /** Missing on older rows; treat as 'nobody'. */
  history?: HistoryAudience;
};

/**
 * Rules a habit used before an edit. Past days are always judged by the
 * rules in force on that day, so editing never rewrites history.
 * A version covers every day before `until` (and after the previous version).
 */
export type ScheduleVersion = { until: LocalDay; schedule: Schedule };
export type SlotsVersion = { until: LocalDay; windows: CheckinWindow[]; windowMode: WindowMode };

export type Habit = SyncMeta & {
  id: ID;
  ownerId: ID;
  /** v1.2 grow together. */
  groupId: ID | null;
  name: string;
  flowerKind: FlowerKind;
  checkinType: CheckinType;
  config: HabitConfig;
  schedule: Schedule;
  /** Up to 3. Empty means any time of day. */
  windows: CheckinWindow[];
  windowMode: WindowMode;
  /** Up to 5. */
  reminders: TimeOfDay[];
  sharing: HabitSharing;
  pausedAt: ISODateTime | null;
  /** Earlier schedules, oldest first. Schedule edits start tomorrow. */
  pastSchedules?: ScheduleVersion[];
  /** Earlier windows and window mode, oldest first. Window edits start today. */
  pastSlots?: SlotsVersion[];
  /** Local day the habit was created; the first day it can grow. */
  startDay: LocalDay;
  sortOrder: number;
};

/** Value stored on a check-in row. One row per habit, day and slot. */
export type CheckinValue =
  | { kind: 'check' }
  | { kind: 'count'; n: number }
  | { kind: 'list'; done: ID[] }
  | { kind: 'photo'; photoIds: ID[] }
  | { kind: 'health'; value: number };

export type CheckIn = SyncMeta & {
  id: ID;
  habitId: ID;
  userId: ID;
  localDay: LocalDay;
  /** Window index in per-window mode, otherwise 0. */
  slot: number;
  value: CheckinValue;
  /**
   * Whether this slot was complete when written, using the habit config at
   * that time. Keeps history stable when the target or list changes later.
   */
  complete: boolean;
  /** v1.1: who can see the photo (only narrower than the habit's setting). */
  photoAudience: PhotoAudience | null;
};

/** Inclusive start day, exclusive end day (null while ongoing). */
export type DayRange = { start: LocalDay; end: LocalDay | null };

export type PauseRange = SyncMeta & DayRange & { id: ID; habitId: ID };
export type AwayRange = SyncMeta & DayRange & { id: ID; userId: ID };

export type FlowerState = {
  stage: FlowerStage;
  health: FlowerHealth;
  /** Days in bloom. 0 unless stage is bloom. Frozen while wilting. */
  bloomDays: number;
  /** Consecutive missed scheduled days. */
  missStreak: number;
  lastEvaluatedDay: LocalDay;
};

// ---------- Tasks ----------

export type RepeatUnit = 'day' | 'week' | 'month';

export type RepeatRule =
  | { kind: 'never' }
  | { kind: 'daily' }
  | { kind: 'weekly'; days: number[] }
  | { kind: 'monthly' }
  | { kind: 'custom'; every: number; unit: RepeatUnit; from: 'due' | 'completion' };

export type ChecklistItem = { id: ID; label: string; done: boolean };

export type Task = SyncMeta & {
  id: ID;
  ownerId: ID;
  title: string;
  notes: string;
  /** null means No date. */
  dueDay: LocalDay | null;
  dueTime: TimeOfDay | null;
  repeat: RepeatRule;
  checklist: ChecklistItem[];
  /** v1.2 shared tasks. */
  sharedWith: ID[];
  /** Set when a one-off task is done. Repeating tasks roll forward instead. */
  completedAt: ISODateTime | null;
  /** Local days it was marked done (every occurrence), for "done this week". */
  doneLog: LocalDay[];
};

// ---------- v1.1 / v1.2 (shapes only, not used in v1 UI) ----------

export type Friendship = {
  userA: ID;
  userB: ID;
  status: 'pending' | 'accepted';
  requestedBy: ID;
  closeFriendA: boolean;
  closeFriendB: boolean;
  createdAt: ISODateTime;
};

export type Block = { blocker: ID; blocked: ID; createdAt: ISODateTime };
export type Report = { id: ID; reporter: ID; targetUser: ID; targetPost: ID | null; reason: string; createdAt: ISODateTime };
export type Group = { id: ID; habitId: ID; members: ID[]; createdBy: ID; createdAt: ISODateTime };
export type Nudge = { from: ID; to: ID; habitId: ID; day: LocalDay };
export type ReactionType = 'love' | 'fire' | 'sparkle' | 'watered';
export type Post =
  | { id: ID; authorId: ID; kind: 'photo'; habitId: ID; checkInId: ID; photoIds: ID[]; createdAt: ISODateTime }
  | { id: ID; authorId: ID; kind: 'task'; taskId: ID; createdAt: ISODateTime };
export type Reaction = { postId: ID; userId: ID; type: ReactionType; createdAt: ISODateTime };

export type NotificationKind =
  | 'wilting'
  | 'driedUp'
  | 'milestone'
  | 'windowClosing'
  // v1.1+
  | 'nudge'
  | 'reaction'
  | 'requestAccepted'
  | 'groupJoined'
  | 'groupLeft'
  | 'sharedTaskDone';

export type AppNotification = {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  habitId: ID | null;
  /** Free-form payload: bloom streak length, actor id, etc. */
  data: Record<string, string | number>;
  createdAt: ISODateTime;
  readAt: ISODateTime | null;
};
