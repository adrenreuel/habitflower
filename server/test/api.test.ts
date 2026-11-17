/**
 * API integration tests against a real Postgres.
 *   TEST_DATABASE_URL=postgres://... npm test
 * Skipped when TEST_DATABASE_URL is not set.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createApp } from '../src/app.js';
import { createDb, type Sql } from '../src/db.js';
import { IdentityError, type IdentityVerifier } from '../src/lib/identity.js';
import { tokenService } from '../src/lib/tokens.js';
import { migrate } from '../src/migrate.js';

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

// Fake verifier: "apple:<sub>" tokens are valid.
const verifyIdentity: IdentityVerifier = async (provider, idToken) => {
  const [p, sub] = idToken.split(':');
  if (p !== provider || !sub) throw new IdentityError('bad token');
  return { provider, subject: sub };
};

d('api', () => {
  let sql: Sql;
  let app: ReturnType<typeof createApp>;

  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await app.request(path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  };

  const signUp = async () => {
    const id = randomUUID();
    const r = await call('POST', '/v1/auth/anonymous', { userId: id });
    expect(r.status).toBe(201);
    return { id, token: r.json.token as string };
  };

  const habit = (over: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    name: 'Push-ups',
    updatedAt: '2026-11-14T10:00:00.000Z',
    createdAt: '2026-11-14T10:00:00.000Z',
    deletedAt: null,
    syncedAt: null,
    ...over,
  });

  beforeAll(async () => {
    sql = createDb(url!, 3);
    await sql`DROP SCHEMA public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await migrate(sql, () => {});
    app = createApp({ sql, tokens: tokenService('x'.repeat(40)), verifyIdentity, maxBodyBytes: 2_000_000, rateLimits: false });
  });

  afterAll(async () => {
    await sql?.end();
  });

  test('anonymous sign-up, and the same id cannot be claimed twice', async () => {
    const { id } = await signUp();
    expect((await call('POST', '/v1/auth/anonymous', { userId: id })).status).toBe(409);
  });

  test('sync requires a valid token', async () => {
    expect((await call('POST', '/v1/sync', { since: null, changes: {} })).status).toBe(401);
    expect((await call('POST', '/v1/sync', { since: null, changes: {} }, 'nope')).status).toBe(401);
  });

  test('push then pull, last write wins, ownership forced', async () => {
    const a = await signUp();
    const h = habit({ ownerId: 'someone-else' });
    const first = await call('POST', '/v1/sync', { since: null, changes: { habits: [h] } }, a.token);
    expect(first.status).toBe(200);
    expect(first.json.changes.habits).toHaveLength(1);
    expect(first.json.changes.habits[0].ownerId).toBe(a.id);

    // An older write loses.
    await call('POST', '/v1/sync', { since: null, changes: { habits: [{ ...h, name: 'Old', updatedAt: '2026-11-13T10:00:00.000Z' }] } }, a.token);
    // A newer write wins.
    await call('POST', '/v1/sync', { since: null, changes: { habits: [{ ...h, name: 'New', updatedAt: '2026-11-15T10:00:00.000Z' }] } }, a.token);
    const pull = await call('POST', '/v1/sync', { since: null, changes: {} }, a.token);
    expect(pull.json.changes.habits[0].name).toBe('New');
  });

  test('a user cannot overwrite or read another user’s rows', async () => {
    const a = await signUp();
    const b = await signUp();
    const h = habit();
    await call('POST', '/v1/sync', { since: null, changes: { habits: [h] } }, a.token);
    const hijack = await call('POST', '/v1/sync', { since: null, changes: { habits: [{ ...h, name: 'Hacked', updatedAt: '2027-01-01T00:00:00.000Z' }] } }, b.token);
    expect(hijack.json.changes.habits).toHaveLength(0);
    const pull = await call('POST', '/v1/sync', { since: null, changes: {} }, a.token);
    expect(pull.json.changes.habits[0].name).toBe('Push-ups');
  });

  test('incremental pull only returns newer rows', async () => {
    const a = await signUp();
    const first = await call('POST', '/v1/sync', { since: null, changes: { tasks: [habit({ title: 'Rent' })] } }, a.token);
    const since = new Date(new Date(first.json.serverTime).getTime() + 10_000).toISOString();
    const next = await call('POST', '/v1/sync', { since, changes: {} }, a.token);
    expect(next.json.changes.tasks).toHaveLength(0);
  });

  test('validates check-ins', async () => {
    const a = await signUp();
    const bad = await call('POST', '/v1/sync', { since: null, changes: { checkIns: [habit({ habitId: 'x', localDay: '2026-11-14', slot: 0 })] } }, a.token);
    expect(bad.status).toBe(422);
    const ok = await call('POST', '/v1/sync', { since: null, changes: { checkIns: [habit({ habitId: randomUUID(), localDay: '2026-11-14', slot: 1, value: { kind: 'check' } })] } }, a.token);
    expect(ok.json.changes.checkIns[0].localDay).toBe('2026-11-14');
  });

  test('link, sign in on a new device, and identity in use', async () => {
    const a = await signUp();
    const link = await call('POST', '/v1/auth/link', { provider: 'apple', idToken: 'apple:sub-1' }, a.token);
    expect(link.status).toBe(200);
    expect(link.json.user.linkedProviders).toEqual(['apple']);

    const b = await signUp();
    expect((await call('POST', '/v1/auth/link', { provider: 'apple', idToken: 'apple:sub-1' }, b.token)).status).toBe(409);
    expect((await call('POST', '/v1/auth/link', { provider: 'apple', idToken: 'google:sub-1' }, b.token)).status).toBe(401);

    const signin = await call('POST', '/v1/auth/signin', { provider: 'apple', idToken: 'apple:sub-1' });
    expect(signin.json.user.id).toBe(a.id);
    expect((await call('POST', '/v1/auth/signin', { provider: 'apple', idToken: 'apple:unknown' })).status).toBe(404);
  });

  test('delete account removes all data and revokes the token', async () => {
    const a = await signUp();
    await call('POST', '/v1/auth/link', { provider: 'google', idToken: 'google:del-1' }, a.token);
    await call('POST', '/v1/sync', { since: null, changes: { habits: [habit()], tasks: [habit()] } }, a.token);
    expect((await call('DELETE', '/v1/account', undefined, a.token)).status).toBe(204);
    expect((await call('POST', '/v1/sync', { since: null, changes: {} }, a.token)).status).toBe(401);
    const [{ n }] = await sql<{ n: number }[]>`
      SELECT (SELECT count(*) FROM habits WHERE user_id = ${a.id}) + (SELECT count(*) FROM tasks WHERE user_id = ${a.id})
           + (SELECT count(*) FROM identities WHERE user_id = ${a.id}) AS n`;
    expect(Number(n)).toBe(0);
  });

  test('feedback', async () => {
    const a = await signUp();
    expect((await call('POST', '/v1/feedback', { message: 'Love it' }, a.token)).status).toBe(204);
  });
});
