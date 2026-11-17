import { StyleSheet, View } from 'react-native';

import { buildSnapshot } from '@/widgets/snapshot';
import { WidgetPreview } from '@/features/settings/WidgetPreview';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { BackLink } from '@/ui/BackLink';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const STEPS = ['Touch and hold your Home Screen', 'Tap Edit, then Add Widget', 'Search HabitFlower and pick a size'];

export default function WidgetsHelp() {
  const state = useStore();
  const snapshot = buildSnapshot(state);
  return (
    <Screen contentStyle={{ gap: 16 }}>
      <BackLink label="Settings" fallback="/settings" />
      <Text size={30} display accessibilityRole="header">
        Widgets
      </Text>
      <WidgetPreview snapshot={snapshot} />
      <View style={styles.card}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.row, i < STEPS.length - 1 && styles.divider]}>
            <View style={styles.num}>
              <Text size={14} weight={800} color={colors.accentTintText}>
                {i + 1}
              </Text>
            </View>
            <Text size={15} weight={600} style={{ flex: 1 }}>
              {s}
            </Text>
          </View>
        ))}
      </View>
      <Text size={13.5} weight={500} color={colors.text3} lineHeight={20} style={{ marginHorizontal: 4 }}>
        Tap a flower on the widget to open that habit.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
});
