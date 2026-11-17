/**
 * Local SQLite database. Offline first: every write lands here and is
 * marked unsynced (synced_at NULL or older than updated_at) for the sync
 * client to push later.
 *
 * Each table stores the full domain object as JSON in `data`, plus the
 * columns needed for lookups and sync. New fields (v1.1, v1.2) only touch
 * the JSON, so they need no migration.
 */
import * as SQLite from 'expo-sqlite';

export type Table = 'habits' | 'check_ins' | 'pause_ranges' | 'away_ranges' | 'tasks' | 'notifications';

export const TABLES: Table[] = ['habits', 'check_ins', 'pause_ranges', 'away_ranges', 'tasks', 'notifications'];

const MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS check_ins (
    id TEXT PRIMARY KEY NOT NULL,
    habit_id TEXT NOT NULL,
    local_day TEXT NOT NULL,
    slot INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS check_ins_unique ON check_ins (habit_id, local_day, slot);

  CREATE TABLE IF NOT EXISTS pause_ranges (
    id TEXT PRIMARY KEY NOT NULL,
    habit_id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS away_ranges (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    deleted_at TEXT
  );
  `,
];

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync('habitflower.db');
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(d: SQLite.SQLiteDatabase) {
  const row = d.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    d.withTransactionSync(() => {
      d.execSync(MIGRATIONS[v]);
      d.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

/** Removes every local row. Used by Delete account and Sign out. */
export function wipeDb() {
  const d = getDb();
  d.withTransactionSync(() => {
    for (const t of TABLES) d.execSync(`DELETE FROM ${t}`);
    d.execSync('DELETE FROM kv');
  });
}
