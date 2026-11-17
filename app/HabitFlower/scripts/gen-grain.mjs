/**
 * Generates the background grain tile (assets/images/grain.png, @2x, @3x).
 * Matches the mockups: a 140pt tile of white fractal noise at 7% opacity
 * (feTurbulence fractalNoise, baseFrequency 0.85, 3 octaves).
 * Tileable: the noise lattice wraps at the tile edge.
 *
 *   node scripts/gen-grain.mjs
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');
const TILE_PT = 140;
const BASE_FREQ = 0.85; // cycles per point, as in the mockups
const OCTAVES = 3;
const OPACITY = 0.04;

// Deterministic PRNG so the file is stable between runs.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeOctave(period, rand) {
  const grid = new Float32Array(period * period).map(() => rand());
  const at = (x, y) => grid[((y % period) + period) % period * period + (((x % period) + period) % period)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = smooth(x - x0);
    const sy = smooth(y - y0);
    const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
    const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
    return top * (1 - sy) + bottom * sy;
  };
}

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, scale) {
  const rand = mulberry32(7);
  const basePeriod = Math.round(TILE_PT * BASE_FREQ);
  const octaves = Array.from({ length: OCTAVES }, (_, i) => ({ fn: makeOctave(basePeriod << i, rand), amp: 1 / (1 << i), period: basePeriod << i }));
  const norm = octaves.reduce((s, o) => s + o.amp, 0);
  // Grey + alpha, one filter byte per row.
  const raw = Buffer.alloc(size * (size * 2 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 2 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const o of octaves) v += o.fn((x / size) * o.period, (y / size) * o.period) * o.amp;
      v /= norm;
      // Stretch contrast a little: fractal noise clusters around 0.5.
      const a = Math.min(1, Math.max(0, (v - 0.5) * 1.5 + 0.5));
      const i = y * (size * 2 + 1) + 1 + x * 2;
      raw[i] = 255;
      raw[i + 1] = Math.round(a * OPACITY * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 4; // grey + alpha
  const file = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  const name = scale === 1 ? 'grain.png' : `grain@${scale}x.png`;
  writeFileSync(join(OUT, name), file);
  console.log(`wrote ${name} (${size}px, ${file.length} bytes)`);
}

for (const scale of [1, 2, 3]) png(TILE_PT * scale, scale);
