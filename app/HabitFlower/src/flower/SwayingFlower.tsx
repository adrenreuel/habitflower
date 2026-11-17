/**
 * A flower that gently sways over still soil (habit page hero, flower picker).
 * The soil oval is drawn separately and never moves; the flower is drawn
 * without its own soil and rotates between -2 and 2 degrees over 4.5s,
 * pivoting near the stem base.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import type { FlowerHealth, FlowerStage } from '@/domain/types';
import { shadows, soilColor, type FlowerKind } from '@/theme/tokens';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { Flower } from './Flower';

const HALF_CYCLE = 2250;

/** Rotation between -2 and 2 degrees, looping. Shared so every swaying flower moves alike. */
export function useSway(enabled: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      v.setValue(0.5);
      return;
    }
    v.setValue(0);
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: HALF_CYCLE, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: HALF_CYCLE, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, v]);
  return v.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
}

export function SwayingFlower({
  kind,
  stage = 'bloom',
  health = 'ok',
  size,
  sway = true,
  shadow = false,
  box,
}: {
  kind: FlowerKind;
  stage?: FlowerStage;
  health?: FlowerHealth;
  size: number;
  /** Dried up (revive) pages stay still. */
  sway?: boolean;
  /** Soft blurred shadow under the soil (habit page hero). */
  shadow?: boolean;
  /** Outer box; defaults to the flower size. */
  box?: { width: number; height: number };
}) {
  const reduced = useReducedMotion();
  const moving = sway && !reduced;
  const rotate = useSway(moving);
  const w = box?.width ?? size;
  const h = box?.height ?? size;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'flex-end' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {shadow ? (
        <Svg width={120} height={30} style={{ position: 'absolute', bottom: -2 }}>
          <Defs>
            <RadialGradient id="soilShadow" cx="50%" cy="50%" rx="50%" ry="50%">
              {/* Soft falloff from the centre, no hard core. */}
              <Stop offset="0" stopColor={shadows.soil} stopOpacity={0.5} />
              <Stop offset="0.45" stopColor={shadows.soil} stopOpacity={0.28} />
              <Stop offset="1" stopColor={shadows.soil} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={60} cy={15} rx={60} ry={15} fill="url(#soilShadow)" />
        </Svg>
      ) : null}
      {sway ? (
        // The flower's own soil oval, drawn in the same 64x64 artwork space so it
        // matches still flowers exactly; it just doesn't rotate.
        <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute', bottom: 0 }}>
          <Ellipse cx={32} cy={58} rx={13} ry={3.5} fill={soilColor} />
        </Svg>
      ) : null}
      {/* Pivot at 50% / 92%: just above the soil, at the stem base. */}
      <Animated.View style={{ transformOrigin: ['50%', '92%', 0], transform: [{ rotate }] }}>
        <Flower kind={kind} stage={stage} health={health} size={size} soil={!sway} />
      </Animated.View>
    </View>
  );
}
