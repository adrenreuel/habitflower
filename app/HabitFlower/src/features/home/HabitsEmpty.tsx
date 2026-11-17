/**
 * Empty Home (HabitsEmpty.dc.html): a hero card with Plant now (kept by owner
 * decision, though the mockup drops it), then "Suggestions" as
 * seed-packet cards tinted with their flower colour, the habit name in
 * Young Serif, a meta line and a large flower in the corner.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HabitConfig, Habit } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { colors, flowerColors, lighten, packetMeta, tint, type FlowerKind } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

type Preset = Partial<Pick<Habit, 'checkinType' | 'schedule'>> & { config?: HabitConfig };

export const SUGGESTIONS: { name: string; kind: FlowerKind; meta: string; preset?: Preset }[] = [
  { name: 'Hit the gym', kind: 'lavender', meta: 'Mon, Wed, Fri', preset: { schedule: { kind: 'days', days: [1, 3, 5] } } },
  { name: 'Morning walk', kind: 'sunflower', meta: 'Every day' },
  { name: 'Drink water', kind: 'blossom', meta: '8 times a day', preset: { checkinType: 'count', config: { countTarget: 8 } } },
  { name: 'Check mail', kind: 'daisy', meta: 'Every day' },
];

export function HabitsEmpty() {
  return (
    <View style={{ gap: 22, paddingTop: 20 }}>
      <View style={styles.hero}>
        <View style={styles.heroArt} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Flower kind="sunflower" stage="seed" size={76} />
          <Flower kind="sunflower" stage="bud" size={96} />
          <Flower kind="sunflower" stage="bloom" size={112} />
        </View>
        <Text size={22} display align="center" accessibilityRole="header">
          Plant your first HabitFlower
        </Text>
        <Button title="Plant now" icon="plus" height={50} onPress={() => router.push('/habit/new')} style={{ alignSelf: 'stretch' }} />
      </View>
      <View style={{ gap: 12 }} accessibilityLabel="Suggestions">
        <Text size={18} weight={700} accessibilityRole="header">
          Suggestions
        </Text>
        <View style={styles.grid}>
          {SUGGESTIONS.map((i) => (
            <View key={i.name} style={styles.col}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Plant ${i.name}`}
                onPress={() => router.push({ pathname: '/habit/new', params: { name: i.name, kind: i.kind } })}
                style={({ pressed }) => [styles.packet, { backgroundColor: tint(flowerColors[i.kind], 0.14) }, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.packetText}>
                  <Text size={18} display lineHeight={21}>
                    {i.name}
                  </Text>
                  <Text size={12.5} weight={600} color={packetMeta[i.kind] ?? lighten(flowerColors[i.kind], 0.45)}>
                    {i.meta}
                  </Text>
                </View>
                <View style={styles.packetFlower} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <Flower kind={i.kind} size={92} />
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, borderCurve: 'continuous', backgroundColor: colors.card, padding: 14, paddingBottom: 16, alignItems: 'center', gap: 14 },
  heroArt: { alignSelf: 'stretch', height: 132, borderRadius: 20, borderCurve: 'continuous', backgroundColor: tint(colors.accent, 0.1), flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -5 },
  col: { width: '50%', padding: 5 },
  packet: { height: 136, borderRadius: 22, borderCurve: 'continuous', overflow: 'hidden' },
  packetText: { gap: 3, paddingTop: 18, paddingHorizontal: 14, zIndex: 1 },
  packetFlower: { position: 'absolute', right: -10, bottom: -6 },
});
