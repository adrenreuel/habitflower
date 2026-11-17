/**
 * Generated abstract avatars (DiceBear "Loops" style, CC0).
 * Seeded from the user's avatarSeed, so every account has one from first
 * launch, before a username exists. Never shows letters or real names.
 */
// Must load before @dicebear/core runs.
import '@/polyfills/structuredClone';

import { Avatar as DiceAvatar, Style } from '@dicebear/core';
import loops from '@dicebear/styles/loops.json';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const style = new Style(loops as ConstructorParameters<typeof Style>[0]);
const cache = new Map<string, string>();

/** SVG markup for a seed, cleaned for react-native-svg (no RDF metadata or comments). */
export function avatarSvg(seed: string): string {
  const hit = cache.get(seed);
  if (hit) return hit;
  const svg = new DiceAvatar(style, { seed })
    .toString()
    .replace(/<metadata[\s\S]*?<\/metadata>/, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  if (cache.size > 200) cache.clear();
  cache.set(seed, svg);
  return svg;
}

function AvatarImpl({ seed, size = 44, accessibilityLabel }: { seed: string; size?: number; accessibilityLabel?: string }) {
  const xml = useMemo(() => avatarSvg(seed), [seed]);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

export const Avatar = memo(AvatarImpl);
