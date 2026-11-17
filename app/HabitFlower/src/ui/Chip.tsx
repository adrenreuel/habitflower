import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Selectable chip. Selected state is a tinted fill, never an outline. */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  tintBg = colors.accentTint,
  tintFg = colors.accentTintText,
  style,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tintBg?: string;
  tintFg?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const fg = selected ? tintFg : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: sizes.chipHeight,
          paddingHorizontal: 16,
          borderRadius: radius.chip,
          backgroundColor: selected ? tintBg : colors.raised,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text size={15} weight={700} color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll }: { children: React.ReactNode; scroll?: boolean }) {
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {children}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

/** Small status pill used on cards (e.g. "1/3", "Done"). */
export function Pill({
  label,
  bg,
  fg,
  icon,
  height = 26,
}: {
  label: string;
  bg: string;
  fg: string;
  icon?: IconName;
  height?: number;
}) {
  return (
    <View style={{ height, paddingHorizontal: 10, borderRadius: height / 2, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon ? <Icon name={icon} size={13} color={fg} strokeWidth={icon === 'check' ? 3.2 : 2.6} /> : null}
      <Text size={12} weight={700} color={fg}>
        {label}
      </Text>
    </View>
  );
}

/** Weekday picker: 7 round toggles. */
export function DayPicker({ value, onChange, weekStart }: { value: number[]; onChange: (days: number[]) => void; weekStart: 0 | 1 }) {
  const order = [0, 1, 2, 3, 4, 5, 6].map((i) => (i + weekStart) % 7);
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {order.map((d) => {
        const on = value.includes(d);
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={names[d]}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: on ? colors.accentTint : colors.raised, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={14} weight={800} color={on ? colors.accentTintText : colors.text2}>
              {letters[d]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
