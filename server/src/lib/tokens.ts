/**
 * API tokens: HS256 JWTs with the user id and a token version. They don't
 * expire; bumping users.token_version (or deleting the account) revokes them.
 */
import { jwtVerify, SignJWT } from 'jose';

export type TokenClaims = { sub: string; ver: number };

export function tokenService(secret: string) {
  const key = new TextEncoder().encode(secret);
  return {
    async sign(c: TokenClaims): Promise<string> {
      return new SignJWT({ ver: c.ver }).setProtectedHeader({ alg: 'HS256' }).setSubject(c.sub).setIssuedAt().setIssuer('habitflower').sign(key);
    },
    async verify(token: string): Promise<TokenClaims | null> {
      try {
        const { payload } = await jwtVerify(token, key, { issuer: 'habitflower', algorithms: ['HS256'] });
        if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null;
        return { sub: payload.sub, ver: payload.ver };
      } catch {
        return null;
      }
    },
  };
}

export type TokenService = ReturnType<typeof tokenService>;
