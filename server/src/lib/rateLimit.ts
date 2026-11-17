/**
 * Small in-memory fixed-window rate limiter keyed by client IP. Enough for a
 * single t4g.small instance behind Caddy; swap for Redis if you scale out.
 */
import type { MiddlewareHandler } from 'hono';

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'local';
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || h.reset < now) hits.set(ip, { count: 1, reset: now + windowMs });
    else if (++h.count > max) {
      c.header('Retry-After', String(Math.ceil((h.reset - now) / 1000)));
      return c.json({ code: 'rate_limited', message: 'Too many requests' }, 429);
    }
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    await next();
  };
}
