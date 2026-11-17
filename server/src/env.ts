import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  /** HS256 secret for API tokens. Generate with: openssl rand -base64 48 */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  /** iOS bundle id; the audience of Sign in with Apple identity tokens. */
  APPLE_BUNDLE_ID: z.string().min(1),
  /** Comma-separated Google OAuth client ids (iOS, web) accepted as audiences. */
  GOOGLE_CLIENT_IDS: z.string().default(''),
  /** Max JSON body size for sync, in bytes. */
  MAX_BODY_BYTES: z.coerce.number().int().default(2_000_000),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
