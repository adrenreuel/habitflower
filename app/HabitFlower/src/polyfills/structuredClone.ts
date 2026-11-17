/**
 * Hermes (React Native 0.81) has no structuredClone. DiceBear only clones
 * plain JSON (style definitions and options), so a deep copy of plain
 * objects and arrays is enough.
 */
function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(clone) as T;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = clone(v);
  return out as T;
}

const g = globalThis as { structuredClone?: <T>(v: T) => T };
if (typeof g.structuredClone !== 'function') g.structuredClone = clone;

export {};
