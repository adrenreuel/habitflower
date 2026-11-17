/**
 * Offline-first sync. Local SQLite is the source of truth for the device;
 * unsynced rows are pushed and newer server rows are pulled. Conflicts are
 * last write wins on `updatedAt`.
 */
import { repo } from '@/data/repo';
import type { Table } from '@/data/db';
import { getDb } from '@/data/db';
import type { SyncMeta } from '@/domain/types';
import { useStore } from '@/state/store';
import { api, ApiError, getToken, setToken, type SyncTables } from './client';
import { backendEnabled } from './config';

const TABLE_OF: Record<keyof SyncTables, Table> = {
  habits: 'habits',
  checkIns: 'check_ins',
  pauses: 'pause_ranges',
  aways: 'away_ranges',
  tasks: 'tasks',
};

type Row = SyncMeta & { id: string };

function extraColumns(key: keyof SyncTables, row: Record<string, unknown>): Record<string, string | number> {
  if (key === 'checkIns') return { habit_id: row.habitId as string, local_day: row.localDay as string, slot: row.slot as number };
  if (key === 'pauses') return { habit_id: row.habitId as string };
  return {};
}

function applyRemote(key: keyof SyncTables, rows: Row[], serverTime: string) {
  const table = TABLE_OF[key];
  const db = getDb();
  db.withTransactionSync(() => {
    for (const remote of rows) {
      const local = db.getFirstSync<{ updated_at: string }>(`SELECT updated_at FROM ${table} WHERE id = ?`, [remote.id]);
      if (local && local.updated_at > remote.updatedAt) continue; // local edit is newer; it will be pushed
      const obj = { ...remote, syncedAt: serverTime };
      const extra = extraColumns(key, obj as unknown as Record<string, unknown>);
      const cols = ['id', 'data', 'updated_at', 'synced_at', 'deleted_at', ...Object.keys(extra)];
      const vals = [obj.id, JSON.stringify(obj), obj.updatedAt, serverTime, obj.deletedAt, ...Object.values(extra)];
      if (key === 'checkIns') {
        // One row per habit, day and slot: drop a local duplicate made offline.
        const e = extra as { habit_id: string; local_day: string; slot: number };
        db.runSync(`DELETE FROM check_ins WHERE habit_id = ? AND local_day = ? AND slot = ? AND id != ?`, [e.habit_id, e.local_day, e.slot, obj.id]);
      }
      db.runSync(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) ON CONFLICT(id) DO UPDATE SET ${cols
          .filter((c) => c !== 'id')
          .map((c) => `${c} = excluded.${c}`)
          .join(', ')}`,
        vals,
      );
    }
  });
}

/** Makes sure this device has a server account. Safe to call often. */
export async function ensureAccount(): Promise<boolean> {
  if (!backendEnabled()) return false;
  if (await getToken()) return true;
  try {
    const res = await api.signUpAnonymous(useStore.getState().user.id);
    await setToken(res.token);
    return true;
  } catch {
    return false;
  }
}

let running: Promise<void> | null = null;

export function syncNow(): Promise<void> {
  if (!running) {
    running = doSync().finally(() => {
      running = null;
    });
  }
  return running;
}

async function doSync() {
  if (!(await ensureAccount())) return;
  const since = repo.getKV<string>('syncCursor');
  const changes = {
    habits: repo.unsynced('habits'),
    checkIns: repo.unsynced('check_ins'),
    pauses: repo.unsynced('pause_ranges'),
    aways: repo.unsynced('away_ranges'),
    tasks: repo.unsynced('tasks'),
  } as SyncTables;
  try {
    const res = await api.sync({ since, changes });
    (Object.keys(TABLE_OF) as (keyof SyncTables)[]).forEach((k) => {
      repo.markSynced(TABLE_OF[k], (changes[k] as Row[]).map((r) => r.id), res.serverTime);
      applyRemote(k, res.changes[k] as Row[], res.serverTime);
    });
    repo.setKV('syncCursor', res.serverTime);
    if (Object.values(res.changes).some((list) => list.length > 0)) useStore.getState().init();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) await setToken(null);
  }
}
