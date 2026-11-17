import { Pressable, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { Text } from './Text';

export function StepButton({ label, onPress, disabled, glyph }: { label: string; onPress: () => void; disabled?: boolean; glyph: '−' | '+' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 14, borderCurve: 'continuous',
        backgroundColor: colors.raised,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <Text size={20} weight={700}>
        {glyph}
      </Text>
    </Pressable>
  );
}

/** Card row with a label and a − value + stepper. */
export function StepperRow({
  label,
  sublabel,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  fewerLabel = 'Fewer',
  moreLabel = 'More',
}: {
  label: string;
  sublabel?: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fewerLabel?: string;
  moreLabel?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, paddingLeft: 16, paddingRight: 8, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card }}>
      <View style={{ gap: 2, flex: 1 }}>
        <Text size={15} weight={600}>
          {label}
        </Text>
        {sublabel ? (
          <Text size={12.5} weight={500} color={colors.text2}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <StepButton glyph="−" label={fewerLabel} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
        <Text size={18} weight={800} align="center" style={{ minWidth: 28 }} accessibilityLiveRegion="polite">
          {display ?? value}
        </Text>
        <StepButton glyph="+" label={moreLabel} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
      </View>
    </View>
  );
}
