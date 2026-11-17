import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

/** "‹ Settings" style back link used at the top of pushed pages. */
export function BackLink({ label, fallback = '/' }: { label: string; fallback?: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingRight: 8 }}
    >
      <Icon name="back" size={22} color={colors.chipMutedText} />
      <Text size={16} weight={600} color={colors.chipMutedText}>
        {label}
      </Text>
    </Pressable>
  );
}
