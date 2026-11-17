/**
 * Friends tab. Friends ship in v1.1; v1 shows the FriendsEmpty art with a
 * coming soon note instead of the Add a friend actions.
 */
import { StyleSheet, View } from 'react-native';

import { Flower } from '@/flower/Flower';
import type { FlowerStage } from '@/domain/types';
import { colors, shadows, tint, type FlowerKind } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { TabScreen } from '@/ui/TabScreen';
import { Text } from '@/ui/Text';

const CARDS: { name: string; rot: string; x: number; y: number; f: [FlowerKind, FlowerStage][] }[] = [
  { name: '@mayac', rot: '-7deg', x: -52, y: 4, f: [['tulip', 'bloom'], ['rose', 'bloom'], ['lavender', 'bloom'], ['daisy', 'bloom'], ['marigold', 'bud'], ['blossom', 'seed']] },
  { name: '@sampatel', rot: '6deg', x: 52, y: -4, f: [['sunflower', 'bloom'], ['marigold', 'bloom'], ['spider', 'bloom'], ['daisy', 'bud'], ['lavender', 'bud'], ['tulip', 'seed']] },
];

export default function FriendsScreen() {
  return (
    <TabScreen title="Friends" contentStyle={{ gap: 20 }}>
      <View style={styles.hero}>
        <View style={styles.art} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {CARDS.map((c) => (
            <View key={c.name} style={[styles.card, { transform: [{ translateX: c.x }, { translateY: c.y }, { rotate: c.rot }] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Avatar seed={c.name} size={20} />
                <Text size={11} weight={800}>
                  {c.name}
                </Text>
              </View>
              <View style={styles.grid}>
                {c.f.map(([kind, stage], i) => (
                  <View key={i} style={{ width: '33.3%', alignItems: 'center' }}>
                    <Flower kind={kind} stage={stage} size={30} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        <Text size={22} display align="center">
          Grow together
        </Text>
        <Text size={15} weight={500} color={colors.text2} align="center" style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
          See each other’s HabitFlowers and cheer each other on. Friends are coming soon.
        </Text>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, borderCurve: 'continuous', backgroundColor: colors.card, padding: 14, paddingBottom: 16, alignItems: 'center', gap: 14 },
  art: { alignSelf: 'stretch', height: 172, borderRadius: 20, borderCurve: 'continuous', backgroundColor: tint(colors.friendPink, 0.1), alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: 128, height: 128, paddingTop: 9, paddingHorizontal: 8, paddingBottom: 6, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.raised, gap: 2, boxShadow: shadows.floatingCard },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-end' },
});
