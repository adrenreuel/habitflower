import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Switch } from './Switch';
import { Text } from './Text';

export { Switch };

export function Card({ children, style, padding = 16 }: { children: ReactNode; style?: StyleProp<ViewStyle>; padding?: number }) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

/** A card holding rows separated by 1px dividers. */
export function Group({ children, label, footer, style }: { children: ReactNode; label?: string; footer?: string; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? (
        <Text label style={{ paddingHorizontal: 4 }}>
          {label}
        </Text>
      ) : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text size={13} weight={500} color={colors.text3Small} style={{ paddingHorizontal: 4 }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export type RowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  icon?: IconName;
  iconColor?: string;
  iconBg?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  titleColor?: string;
  accessibilityLabel?: string;
};

export function Row({
  title,
  subtitle,
  value,
  valueColor = colors.text2,
  icon,
  iconColor = colors.text2,
  iconBg = colors.raised,
  left,
  right,
  onPress,
  chevron = !!onPress,
  destructive,
  titleColor,
  accessibilityLabel,
}: RowProps) {
  const content = (
    <View style={styles.row}>
      {left}
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={16} weight={700} color={titleColor ?? (destructive ? colors.destructive : colors.text)}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={13} weight={500} color={colors.text2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text size={15} weight={600} color={valueColor} numberOfLines={1} style={{ maxWidth: '50%' }}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? <Icon name="chevronRight" size={18} color={colors.text3} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [pressed && { backgroundColor: colors.cardPressed }]}
    >
      {content}
    </Pressable>
  );
}

export function SwitchRow({ title, subtitle, value, onValueChange, icon }: { title: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void; icon?: IconName }) {
  return (
    <Row
      title={title}
      subtitle={subtitle}
      icon={icon}
      chevron={false}
      right={<Switch value={value} onValueChange={onValueChange} accessibilityLabel={title} />}
    />
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderCurve: 'continuous' },
  group: { backgroundColor: colors.card, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
