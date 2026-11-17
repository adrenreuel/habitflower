/**
 * Sync payload validation and per-table storage rules.
 * Rows arrive as the app's domain objects. The server trusts only the
 * authenticated user id for ownership and keeps last write wins on updatedAt.
 */
import { z } from 'zod';

const iso = z.string().datetime({ offset: true });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const base = z
  .object({
    id: z.string().uuid(),
    updatedAt: iso,
    deletedAt: iso.nullable().default(null),
    createdAt: iso.optional(),
  })
  .passthrough();

export const TABLES = {
  habits: { table: 'habits', schema: base.extend({ groupId: z.string().uuid().nullable().optional() }) },
  checkIns: {
    table: 'check_ins',
    schema: base.extend({ habitId: z.string().uuid(), localDay: day, slot: z.number().int().min(0).max(2) }),
  },
  pauses: { table: 'pause_ranges', schema: base.extend({ habitId: z.string().uuid() }) },
  aways: { table: 'away_ranges', schema: base },
  tasks: { table: 'tasks', schema: base },
} as const;

export type SyncKey = keyof typeof TABLES;
export const SYNC_KEYS = Object.keys(TABLES) as SyncKey[];

const MAX_ROWS_PER_TABLE = 5000;

export const syncRequest = z.object({
  since: iso.nullable(),
  changes: z.object(
    Object.fromEntries(SYNC_KEYS.map((k) => [k, z.array(TABLES[k].schema).max(MAX_ROWS_PER_TABLE).default([])])) as {
      [K in SyncKey]: z.ZodDefault<z.ZodArray<(typeof TABLES)[K]['schema']>>;
    },
  ),
});

export type SyncRequest = z.infer<typeof syncRequest>;
type AnyRow = z.infer<typeof base> & Record<string, unknown>;

/** Columns written for a row, with ownership forced to the caller. */
export function rowColumns(key: SyncKey, row: AnyRow, userId: string): Record<string, unknown> {
  // The server's copy never carries client sync bookkeeping or someone else's ids.
  const data: Record<string, unknown> = { ...row, syncedAt: null };
  if (key === 'habits' || key === 'tasks') data.ownerId = userId;
  else data.userId = userId;

  const cols: Record<string, unknown> = {
    id: row.id,
    user_id: userId,
    data,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? null,
  };
  if (key === 'habits') cols.group_id = (row.groupId as string | null | undefined) ?? null;
  if (key === 'checkIns') {
    cols.habit_id = row.habitId;
    cols.local_day = row.localDay;
    cols.slot = row.slot;
  }
  if (key === 'pauses') cols.habit_id = row.habitId;
  return cols;
}

/** Pulls overlap a few seconds so rows from transactions committing late are not missed. */
export const PULL_OVERLAP_MS = 5000;
