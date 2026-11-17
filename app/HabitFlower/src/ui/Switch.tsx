/**
 * Toggle drawn to the mockup spec (NewHabit.dc.html): 52x32 track, 3px
 * padding, 26px knob. Custom instead of the native UISwitch, whose size
 * changes between iOS versions and breaks row alignment.
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import { colors } from '@/theme/tokens';

const TRACK_W = 52;
const TRACK_H = 32;
const PAD = 3;
const KNOB = TRACK_H - PAD * 2;
const TRAVEL = TRACK_W - KNOB - PAD * 2;

export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const t = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: value ? 1 : 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [value, t]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onValueChange(!value);
      }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={{
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          padding: PAD,
          backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: [colors.switchOff, colors.switchOn] }),
        }}
      >
        <Animated.View
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: [colors.chipText, colors.text] }),
            transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
