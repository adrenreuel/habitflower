/**
 * Habitflower API (v1).
 *
 *   GET    /health
 *   POST   /v1/auth/anonymous   create the anonymous account for the device's user id
 *   POST   /v1/auth/link        link Apple or Google to the current account
 *   POST   /v1/auth/signin      sign in to the account linked to an Apple/Google identity
 *   POST   /v1/sync             push local changes, pull server changes
 *   DELETE /v1/account          delete the account and all data
 *   POST   /v1/feedback         send feedback from Help and feedback
 *
 * v1.1 adds /v1/friends, /v1/feed, /v1/photos/presign and /v1/push-tokens.
 */
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import type { Sql } from './db.js';
import { IdentityError, type IdentityVerifier, type Provider } from './lib/identity.js';
import { rateLimit } from './lib/rateLimit.js';
import { PULL_OVERLAP_MS, rowColumns, SYNC_KEYS, syncRequest, TABLES } from './lib/sync.js';
import type { TokenService } from './lib/tokens.js';

export type AppDeps = {
  sql: Sql;
  tokens: TokenService;
  verifyIdentity: IdentityVerifier;
  maxBodyBytes: number;
  /** Disable rate limits in tests. */
  rateLimits?: boolean;
};

type Vars = { userId: string };

const providerToken = z.object({
  provider: z.enum(['apple', 'google']),
  idToken: z.string().min(10).max(10_000),
  nonce: z.string().max(200).optional(),
});

function bad(c: Context, code: string, message: string, status: 400 | 401 | 403 | 404 | 409 | 422 = 400) {
  return c.json({ code, message }, status);
}

async function linkedProviders(sql: Sql, userId: string): Promise<Provider[]> {
  const rows = await sql<{ provider: Provider }[]>`SELECT provider FROM identities WHERE user_id = ${userId} ORDER BY created_at`;
  return rows.map((r) => r.provider);
}

async function serverUser(sql: Sql, userId: string) {
  const [u] = await sql<{ id: string; username: string | null; created_at: Date }[]>`SELECT id, username, created_at FROM users WHERE id = ${userId}`;
  return { id: u.id, username: u.username, linkedProviders: await linkedProviders(sql, userId), createdAt: u.created_at.toISOString() };
}

export function createApp(deps: AppDeps) {
  const { sql, tokens, verifyIdentity } = deps;
  const limits = deps.rateLimits ?? true;
  const app = new Hono<{ Variables: Vars }>();
  const limit = (windowMs: number, max: number): MiddlewareHandler => (limits ? rateLimit({ windowMs, max }) : async (_c, next) => next());

  app.use('*', secureHeaders());
  app.use('/v1/*', bodyLimit({ maxSize: deps.maxBodyBytes, onError: (c) => c.json({ code: 'too_large', message: 'Request too large' }, 413) }));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ code: 'server_error', message: 'Something went wrong' }, 500);
  });

  const auth: MiddlewareHandler<{ Variables: Vars }> = async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const claims = header.startsWith('Bearer ') ? await tokens.verify(header.slice(7)) : null;
    if (!claims) return bad(c, 'unauthorized', 'Missing or invalid token', 401);
    const [u] = await sql<{ token_version: number }[]>`SELECT token_version FROM users WHERE id = ${claims.sub}`;
    if (!u || u.token_version !== claims.ver) return bad(c, 'unauthorized', 'Token revoked', 401);
    c.set('userId', claims.sub);
    await next();
  };

  app.get('/health', async (c) => {
    await sql`SELECT 1`;
    return c.json({ ok: true });
  });

  // ---------- Auth ----------

  app.post('/v1/auth/anonymous', limit(60 * 60_000, 20), async (c) => {
    const body = z.object({ userId: z.string().uuid() }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return bad(c, 'invalid', 'userId must be a UUID', 422);
    const inserted = await sql`INSERT INTO users (id) VALUES (${body.data.userId}) ON CONFLICT (id) DO NOTHING RETURNING id`;
    if (inserted.length === 0) return bad(c, 'user_exists', 'That account already exists', 409);
    const token = await tokens.sign({ sub: body.data.userId, ver: 1 });
    return c.json({ token, user: await serverUser(sql, body.data.userId) }, 201);
  });

  app.post('/v1/auth/link', auth, limit(60_000, 20), async (c) => {
    const body = providerToken.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return bad(c, 'invalid', 'provider and idToken are required', 422);
    let identity;
    try {
      identity = await verifyIdentity(body.data.provider, body.data.idToken, body.data.nonce);
    } catch (e) {
      if (e instanceof IdentityError) return bad(c, 'invalid_identity', 'Could not verify that sign-in', 401);
      throw e;
    }
    const userId = c.get('userId');
    const [existing] = await sql<{ user_id: string }[]>`SELECT user_id FROM identities WHERE provider = ${identity.provider} AND subject = ${identity.subject}`;
    if (existing && existing.user_id !== userId) return bad(c, 'identity_in_use', 'That sign-in already backs up another account', 409);
    if (!existing) await sql`INSERT INTO identities (provider, subject, user_id) VALUES (${identity.provider}, ${identity.subject}, ${userId})`;
    return c.json({ user: await serverUser(sql, userId) });
  });

  app.post('/v1/auth/signin', limit(60_000, 20), async (c) => {
    const body = providerToken.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return bad(c, 'invalid', 'provider and idToken are required', 422);
    let identity;
    try {
      identity = await verifyIdentity(body.data.provider, body.data.idToken, body.data.nonce);
    } catch (e) {
      if (e instanceof IdentityError) return bad(c, 'invalid_identity', 'Could not verify that sign-in', 401);
      throw e;
    }
    const [row] = await sql<{ user_id: string; token_version: number }[]>`
      SELECT i.user_id, u.token_version FROM identities i JOIN users u ON u.id = i.user_id
      WHERE i.provider = ${identity.provider} AND i.subject = ${identity.subject}`;
    if (!row) return bad(c, 'not_found', 'No account is linked to that sign-in', 404);
    const token = await tokens.sign({ sub: row.user_id, ver: row.token_version });
    return c.json({ token, user: await serverUser(sql, row.user_id) });
  });

  // ---------- Sync ----------

  app.post('/v1/sync', auth, limit(60_000, 120), async (c) => {
    const parsed = syncRequest.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return bad(c, 'invalid', parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 422);
    const userId = c.get('userId');
    const { since, changes } = parsed.data;

    const result = await sql.begin(async (tx) => {
      for (const key of SYNC_KEYS) {
        const table = TABLES[key].table;
        for (const row of changes[key]) {
          const cols = rowColumns(key, row, userId);
          // Last write wins, and never overwrite another user's row.
          await tx`
            INSERT INTO ${tx(table)} ${tx(cols as Record<string, string>)}
            ON CONFLICT (id) DO UPDATE SET
              data = excluded.data,
              updated_at = excluded.updated_at,
              deleted_at = excluded.deleted_at,
              server_updated_at = now()
            WHERE ${tx(table)}.user_id = excluded.user_id AND ${tx(table)}.updated_at < excluded.updated_at`;
        }
      }
      const [{ now }] = await tx<{ now: Date }[]>`SELECT now()`;
      const from = since ? new Date(new Date(since).getTime() - PULL_OVERLAP_MS) : new Date(0);
      const pulled: Record<string, unknown[]> = {};
      for (const key of SYNC_KEYS) {
        const rows = await tx<{ data: Record<string, unknown> }[]>`
          SELECT data FROM ${tx(TABLES[key].table)} WHERE user_id = ${userId} AND server_updated_at > ${from}`;
        pulled[key] = rows.map((r) => r.data);
      }
      return { serverTime: now.toISOString(), changes: pulled };
    });
    return c.json(result);
  });

  // ---------- Account ----------

  app.delete('/v1/account', auth, async (c) => {
    // Cascades to identities and every synced row.
    await sql`DELETE FROM users WHERE id = ${c.get('userId')}`;
    return c.body(null, 204);
  });

  app.post('/v1/feedback', auth, limit(60 * 60_000, 10), async (c) => {
    const body = z.object({ message: z.string().trim().min(1).max(2000) }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return bad(c, 'invalid', 'message is required', 422);
    await sql`INSERT INTO feedback (user_id, message) VALUES (${c.get('userId')}, ${body.data.message})`;
    return c.body(null, 204);
  });

  app.notFound((c) => c.json({ code: 'not_found', message: 'Not found' }, 404));
  return app;
}
