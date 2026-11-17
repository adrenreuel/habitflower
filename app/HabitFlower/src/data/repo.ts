/**
 * Thin typed access to the local tables. Rows go in and out as domain objects.
 */
import { getDb, type Table } from './db';
import type { AppNotification, AwayRange, CheckIn, Habit, PauseRange, SyncMeta, Task } from '@/domain/types';

type Row = { data: string };

type Synced = SyncMeta & { id: string };

function loadAll<T>(table: Table): T[] {
  return getDb()
    .getAllSync<Row>(`SELECT data FROM ${table} WHERE deleted_at IS NULL`)
    .map((r) => JSON.parse(r.data) as T);
}

function upsert(table: Table, obj: Synced, extra: Record<string, string | number> = {}) {
  const cols = ['id', 'data', 'updated_at', 'synced_at', 'deleted_at', ...Object.keys(extra)];
  const vals = [obj.id, JSON.stringify(obj), obj.updatedAt, obj.syncedAt, obj.deletedAt, ...Object.values(extra)];
  const placeholders = cols.map(() => '?').join(', ');
  const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ');
  getDb().runSync(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`,
    vals,
  );
}

export const repo = {
  loadHabits: () => loadAll<Habit>('habits'),
  saveHabit: (h: Habit) => upsert('habits', h),

  loadCheckIns: () => loadAll<CheckIn>('check_ins'),
  saveCheckIn: (c: CheckIn) => upsert('check_ins', c, { habit_id: c.habitId, local_day: c.localDay, slot: c.slot }),
  /** The stored row for a habit, day and slot, including a soft-deleted one (undone check-in). */
  findCheckIn: (habitId: string, day: string, slot: number): CheckIn | null => {
    const row = getDb().getFirstSync<Row>('SELECT data FROM check_ins WHERE habit_id = ? AND local_day = ? AND slot = ?', [habitId, day, slot]);
    return row ? (JSON.parse(row.data) as CheckIn) : null;
  },

  loadPauses: () => loadAll<PauseRange>('pause_ranges'),
  savePause: (p: PauseRange) => upsert('pause_ranges', p, { habit_id: p.habitId }),

  loadAways: () => loadAll<AwayRange>('away_ranges'),
  saveAway: (a: AwayRange) => upsert('away_ranges', a),

  loadTasks: () => loadAll<Task>('tasks').map((t) => ({ ...t, doneLog: t.doneLog ?? [] })),
  saveTask: (t: Task) => upsert('tasks', t),

  loadNotifications: () =>
    getDb()
      .getAllSync<Row>('SELECT data FROM notifications WHERE deleted_at IS NULL')
      .map((r) => JSON.parse(r.data) as AppNotification),
  saveNotification: (n: AppNotification) =>
    getDb().runSync(
      'INSERT INTO notifications (id, data, updated_at, synced_at, deleted_at) VALUES (?, ?, ?, NULL, NULL) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
      [n.id, JSON.stringify(n), n.readAt ?? n.createdAt],
    ),

  getKV<T>(key: string): T | null {
    const row = getDb().getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
    return row ? (JSON.parse(row.value) as T) : null;
  },
  setKV(key: string, value: unknown) {
    getDb().runSync(
      'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, JSON.stringify(value)],
    );
  },

  /** Rows the server has not seen yet (sync push). */
  unsynced(table: Table): unknown[] {
    return getDb()
      .getAllSync<Row>(`SELECT data FROM ${table} WHERE synced_at IS NULL OR synced_at < updated_at`)
      .map((r) => JSON.parse(r.data));
  },
  markSynced(table: Table, ids: string[], at: string) {
    const d = getDb();
    d.withTransactionSync(() => {
      for (const id of ids) {
        const row = d.getFirstSync<Row>(`SELECT data FROM ${table} WHERE id = ?`, [id]);
        if (!row) continue;
        const obj = { ...JSON.parse(row.data), syncedAt: at };
        d.runSync(`UPDATE ${table} SET synced_at = ?, data = ? WHERE id = ?`, [at, JSON.stringify(obj), id]);
      }
    });
  },
};
