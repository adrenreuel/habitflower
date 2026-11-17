/**
 * Enforces the copy rules (HANDOFF.md section 5) across all app source:
 * no em dashes, no "·", "HabitFlowers" not garden, "check in" not water.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const DIRS = ['app', 'src'];

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : files(p);
    return /\.(tsx?|json)$/.test(e.name) ? [p] : [];
  });
}

const sources = DIRS.flatMap((d) => files(path.join(ROOT, d))).map((f) => ({
  file: path.relative(ROOT, f),
  text: fs.readFileSync(f, 'utf8'),
}));

/** String literals and JSX text only, comments stripped. */
function userFacing(text: string): string {
  const noComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const literals = noComments.match(/(['"`])(?:\\.|(?!\1).)*\1/g) ?? [];
  const jsxText = noComments.match(/>[^<>{}]*</g) ?? [];
  // Habit names in suggestions are user content, not product copy.
  return [...literals, ...jsxText].join('\n').replace(/Drink water/g, '');
}

const rules: { name: string; re: RegExp }[] = [
  { name: 'em dash', re: /—/ },
  { name: 'middle dot separator', re: /·/ },
  { name: '"garden" (say HabitFlowers)', re: /\bgarden/i },
  { name: '"circle" as a social term', re: /\bcircle\b(?!\s*(cx|r=))/i },
  { name: '"water" (say check in; only the Watered reaction is allowed)', re: /\bwater(?!ed\b)|\bwatering\b/i },
  { name: '"Habitflowers" casing', re: /\bHabit[Ff]lowers\b(?<!HabitFlowers)/ },
];

describe('copy rules', () => {
  test('sources were found', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  for (const rule of rules) {
    test(`no ${rule.name}`, () => {
      const offenders = sources
        .filter((s) => rule.re.test(userFacing(s.text)))
        .map((s) => s.file);
      expect(offenders).toEqual([]);
    });
  }
});
