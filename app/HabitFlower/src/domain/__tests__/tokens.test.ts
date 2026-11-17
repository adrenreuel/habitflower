/**
 * Design tokens live in src/theme/tokens.ts. Screens and components must not
 * hardcode colours. Allowed exceptions: the theme itself, the flower artwork
 * and brand logos in Icon.tsx.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const ALLOWED = ['src/theme/', 'src/flower/', 'src/ui/Icon.tsx'];

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : files(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

test('no hardcoded colours outside the theme', () => {
  const offenders: string[] = [];
  for (const f of [...files(path.join(ROOT, 'app')), ...files(path.join(ROOT, 'src'))]) {
    const rel = path.relative(ROOT, f);
    if (ALLOWED.some((a) => rel.startsWith(a))) continue;
    const text = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const hits = text.match(/['"`]#[0-9A-Fa-f]{3,8}['"`]|rgba?\(/g);
    if (hits) offenders.push(`${rel}: ${hits.join(' ')}`);
  }
  expect(offenders).toEqual([]);
});
