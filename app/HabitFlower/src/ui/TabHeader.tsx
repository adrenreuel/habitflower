/**
 * Header for the main tabs: date line above a 32/800 title, optional action
 * on the right. Shared so content below lines up across Habits, Tasks and
 * Friends.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { formatHeaderDay } from '@/domain/day';
import { useToday } from '@/state/selectors';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  const today = useToday();
  return (
    <View style={{ paddingTop: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={14} weight={600} color={colors.text2}>
          {formatHeaderDay(today)}
        </Text>
        <Text size={32} display lineHeight={40} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
