import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { createDb } from './db.js';
import { loadEnv } from './env.js';
import { identityVerifier } from './lib/identity.js';
import { tokenService } from './lib/tokens.js';
import { migrate } from './migrate.js';

const env = loadEnv();
const sql = createDb(env.DATABASE_URL);

await migrate(sql);

const app = createApp({
  sql,
  tokens: tokenService(env.JWT_SECRET),
  verifyIdentity: identityVerifier({
    appleBundleId: env.APPLE_BUNDLE_ID,
    googleClientIds: env.GOOGLE_CLIENT_IDS.split(',').map((s) => s.trim()).filter(Boolean),
  }),
  maxBodyBytes: env.MAX_BODY_BYTES,
});

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => console.log(`habitflower api on :${info.port}`));

const shutdown = async () => {
  server.close();
  await sql.end({ timeout: 5 });
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
