/**
 * Generates the widget's flower images from the design source of truth
 * (docs/handoff/design/Flower.dc.html) as vector SVG image sets.
 *
 *   node scripts/gen-widget-flowers.mjs
 *
 * Output: targets/widget/Assets.xcassets/flower-<kind>-<stage>-<health>.imageset
 * Re-run whenever Flower.dc.html changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../../docs/handoff/design/Flower.dc.html');
const OUT = path.resolve(here, '../targets/widget/Assets.xcassets');

const COLORS = {
  sunflower: '#FFC93C', daisy: '#F7F2EA', tulip: '#FF6B8A', rose: '#E8455A',
  spider: '#FF5A4E', lavender: '#A98BEA', blossom: '#FFB7C9', marigold: '#FF9F1C',
};
const BLOOM_FLAG = {
  sunflower: 'isSunflower', daisy: 'isDaisy', tulip: 'isTulip', rose: 'isRose',
  spider: 'isSpider', lavender: 'isLavender', blossom: 'isBlossom', marigold: 'isMarigold',
};

function mix(hex, toHex, t) {
  const a = parseInt(hex.slice(1), 16), c = parseInt(toHex.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((c >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const html = fs.readFileSync(SRC, 'utf8');
const blocks = {};
for (const m of html.matchAll(/<sc-if value="\{\{(\w+)\}\}"[^>]*>\s*(<svg[\s\S]*?<\/svg>)\s*<\/sc-if>/g)) {
  blocks[m[1]] = m[2];
}

function svgFor(flag, kind) {
  const color = COLORS[kind];
  return blocks[flag]
    .replace(/\{\{px\}\}/g, '128')
    .replace(/\{\{budColor\}\}/g, color)
    .replace(/\{\{faded\}\}/g, mix(color, '#9A8A92', 0.4))
    .replace(/\{\{fadedCenter\}\}/g, mix('#FFD24A', '#9A8A92', 0.45))
    .replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"');
}

function write(name, svg) {
  const dir = path.join(OUT, `${name}.imageset`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
  fs.writeFileSync(
    path.join(dir, 'Contents.json'),
    JSON.stringify({ images: [{ filename: `${name}.svg`, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true } }, null, 2),
  );
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2));

let n = 0;
for (const kind of Object.keys(COLORS)) {
  write(`flower-${kind}-seed-ok`, svgFor('isSeed', kind));
  write(`flower-${kind}-bud-ok`, svgFor('isBud', kind));
  write(`flower-${kind}-bloom-ok`, svgFor(BLOOM_FLAG[kind], kind));
  write(`flower-${kind}-seed-wilt`, svgFor('isWiltSeed', kind));
  write(`flower-${kind}-bud-wilt`, svgFor('isWiltBud', kind));
  write(`flower-${kind}-bloom-wilt`, svgFor('isWiltBloom', kind));
  for (const stage of ['seed', 'bud', 'bloom']) write(`flower-${kind}-${stage}-dormant`, svgFor('isDormant', kind));
  n += 9;
}
console.log(`Wrote ${n} flower image sets to ${path.relative(process.cwd(), OUT)}`);
