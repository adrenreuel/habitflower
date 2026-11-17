/**
 * Applies migrations/*.sql in name order, once each. Files in migrations/next
 * are not applied. Run: npm run migrate (or automatically on container start).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDb, type Sql } from './db.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');

export async function migrate(sql: Sql, log = console.log): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  const applied = new Set((await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) continue;
    const body = fs.readFileSync(path.join(DIR, f), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${f})`;
    });
    log(`migrated ${f}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const sql = createDb(url);
  migrate(sql)
    .then(() => sql.end())
    .catch(async (e) => {
      console.error(e);
      await sql.end();
      process.exit(1);
    });
}
