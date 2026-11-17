import { flowerColors, type FlowerKind } from '@/theme/tokens';

export const FLOWER_KINDS: FlowerKind[] = [
  'sunflower',
  'daisy',
  'tulip',
  'rose',
  'spider',
  'lavender',
  'blossom',
  'marigold',
];

export const FLOWER_NAMES: Record<FlowerKind, string> = {
  sunflower: 'Sunflower',
  daisy: 'Daisy',
  tulip: 'Tulip',
  rose: 'Rose',
  spider: 'Spider lily',
  lavender: 'Lavender',
  blossom: 'Blossom',
  marigold: 'Marigold',
};

export function flowerColor(kind: FlowerKind): string {
  return flowerColors[kind];
}

/** Default flower for a new habit: the first kind no other habit uses yet. */
export function firstUnusedFlower(used: FlowerKind[]): FlowerKind {
  return FLOWER_KINDS.find((k) => !used.includes(k)) ?? FLOWER_KINDS[used.length % FLOWER_KINDS.length];
}
