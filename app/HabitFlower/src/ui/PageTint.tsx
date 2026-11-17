/**
 * Soft gradient of a habit's flower colour at the top of its page, fading
 * into the background (0.24 at the top, 0.09 at 240pt, gone by 420pt).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { pageTint, tint } from '@/theme/tokens';

export function PageTint({ color }: { color: string }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[tint(color, pageTint.top), tint(color, pageTint.mid), tint(color, 0)]}
      locations={[0, pageTint.midAt / pageTint.endAt, 1]}
      style={[StyleSheet.absoluteFill, { bottom: undefined, height: pageTint.endAt }]}
    />
  );
}
