/**
 * Verifies Sign in with Apple and Google identity tokens on the server.
 * Only the stable subject id is kept; no email or name is stored.
 */
import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export type Provider = 'apple' | 'google';
export type VerifiedIdentity = { provider: Provider; subject: string };

export class IdentityError extends Error {}

export type IdentityConfig = {
  appleBundleId: string;
  googleClientIds: string[];
  /** Injectable for tests. */
  appleKeys?: JWTVerifyGetKey;
  googleKeys?: JWTVerifyGetKey;
};

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function identityVerifier(cfg: IdentityConfig) {
  const appleKeys = cfg.appleKeys ?? createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  const googleKeys = cfg.googleKeys ?? createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

  return async function verify(provider: Provider, idToken: string, nonce?: string): Promise<VerifiedIdentity> {
    try {
      if (provider === 'apple') {
        const { payload } = await jwtVerify(idToken, appleKeys, { issuer: 'https://appleid.apple.com', audience: cfg.appleBundleId });
        // The app sends the raw nonce; Apple signs its SHA-256.
        if (nonce !== undefined && payload.nonce !== sha256(nonce)) throw new IdentityError('nonce mismatch');
        if (!payload.sub) throw new IdentityError('missing subject');
        return { provider, subject: payload.sub };
      }
      if (cfg.googleClientIds.length === 0) throw new IdentityError('google not configured');
      const { payload } = await jwtVerify(idToken, googleKeys, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: cfg.googleClientIds,
      });
      if (nonce !== undefined && payload.nonce !== undefined && payload.nonce !== nonce) throw new IdentityError('nonce mismatch');
      if (!payload.sub) throw new IdentityError('missing subject');
      return { provider, subject: payload.sub };
    } catch (e) {
      if (e instanceof IdentityError) throw e;
      throw new IdentityError((e as Error).message);
    }
  };
}

export type IdentityVerifier = ReturnType<typeof identityVerifier>;
