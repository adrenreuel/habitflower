import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, sizes } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'tint' | 'destructive' | 'destructiveTint' | 'light' | 'ghost';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Overrides the primary fill (habit pages use the flower colour). */
  color?: string;
  textColor?: string;
  icon?: IconName;
  iconRight?: ReactNode;
  /** Custom leading element, e.g. a brand logo. */
  leading?: ReactNode;
  height?: number;
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: boolean;
};

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.accent, fg: colors.onAccentDeep },
  secondary: { bg: colors.raised, fg: colors.text },
  tint: { bg: colors.accentTint, fg: colors.accentTintText },
  destructive: { bg: colors.deleteText, fg: colors.onDelete },
  light: { bg: colors.text, fg: colors.onAccent },
  destructiveTint: { bg: colors.driedUpTint, fg: colors.destructive },
  ghost: { bg: colors.transparent, fg: colors.text2 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  color,
  textColor,
  icon,
  iconRight,
  leading,
  height = sizes.buttonHeight,
  disabled,
  loading,
  flex,
  style,
  accessibilityLabel,
  haptic = true,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const bg = color ?? v.bg;
  const fg = textColor ?? v.fg;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={() => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: height / 2, backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        flex && { flex: 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {leading}
          {icon ? <Icon name={icon} size={20} color={fg} strokeWidth={2.6} /> : null}
          <Text size={height >= 56 ? 17 : 16} weight={800} color={fg}>
            {title}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = colors.text,
  bg = colors.card,
  size = 44,
  iconSize = 20,
}: {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  bg?: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Icon name={name} size={iconSize} color={color} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
