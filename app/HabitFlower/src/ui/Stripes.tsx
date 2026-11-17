import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

let n = 0;

/** Blue diagonal stripes used for Paused and Away days. Fills its parent. */
/** `swatch`: finer, stronger stripes for the 10px legend swatch. */
export function Stripes({ radius = 0, swatch = false }: { radius?: number; swatch?: boolean }) {
  const w = swatch ? 4 : 8;
  const id = `stripes-${n++}`;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={w} height={w} patternTransform="rotate(45)">
          <Rect width={w} height={w} fill={swatch ? colors.pausedSwatchB : colors.pausedStripeB} />
          <Rect width={w / 2} height={w} fill={swatch ? colors.pausedSwatchA : colors.pausedStripeA} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${id})`} />
    </Svg>
  );
}
