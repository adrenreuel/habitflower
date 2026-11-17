/**
 * Every flower in every state (FlowerSheet.dc.html + FlowerStates.dc.html).
 * A visual check for the Flower port. Dev builds open it from Settings
 * (long-press the title).
 */
import { StyleSheet, View } from 'react-native';

import { Flower } from '@/flower/Flower';
import { FLOWER_KINDS, FLOWER_NAMES } from '@/flower/kinds';
import { colors, flowerColors } from '@/theme/tokens';
import { BackLink } from '@/ui/BackLink';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const STATES = [
  { stage: 'seed', health: 'ok', label: 'Sprout', rule: 'Just planted. Missing a day dries it up', color: colors.text },
  { stage: 'bud', health: 'ok', label: 'Bud', rule: 'After 1 check-in', color: colors.text },
  { stage: 'bloom', health: 'ok', label: 'Bloom', rule: 'After 2. The number counts days in bloom', color: colors.text },
  { stage: 'bloom', health: 'wilt', label: 'Wilting', rule: 'Missed 1 day. Count pauses until you check in', color: colors.wilting },
  { stage: 'bloom', health: 'dormant', label: 'Dried up', rule: 'Missed 2 in a row. Count resets, comes back as a bud', color: colors.driedUp },
] as const;

export default function FlowerGallery() {
  return (
    <Screen contentStyle={{ gap: 20 }}>
      <BackLink label="Settings" fallback="/settings" />
      <Text size={26} display accessibilityRole="header">
        All flowers
      </Text>
      <View style={styles.states}>
        {STATES.map((s) => (
          <View key={s.label} style={styles.state}>
            <Flower kind="lavender" stage={s.stage} health={s.health} size={56} />
            <Text size={13} weight={800} color={s.color}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <View style={styles.headRow}>
          <Text label style={{ width: 96 }}>
            Each flower
          </Text>
          {['Bud', 'Bloom', 'Wilting'].map((h) => (
            <Text key={h} label align="center" color={h === 'Wilting' ? colors.wilting : colors.text2} style={{ flex: 1 }}>
              {h}
            </Text>
          ))}
        </View>
        {FLOWER_KINDS.map((k) => (
          <View key={k} style={styles.row}>
            <View style={{ width: 96, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: flowerColors[k] }} />
              <Text size={14} weight={700}>
                {FLOWER_NAMES[k]}
              </Text>
            </View>
            <View style={styles.cell}>
              <Flower kind={k} stage="bud" size={64} />
            </View>
            <View style={styles.cell}>
              <Flower kind={k} stage="bloom" size={64} />
            </View>
            <View style={styles.cell}>
              <Flower kind={k} stage="bloom" health="wilt" size={64} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  states: { flexDirection: 'row', gap: 6 },
  state: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.card },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.card },
  cell: { flex: 1, alignItems: 'center' },
});
