/**
 * In-app preview of the medium widget (mirrors targets/widget/HabitFlowersWidget.swift).
 */
import { StyleSheet, View } from 'react-native';

import type { FlowerHealth, FlowerStage } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { colors, type FlowerKind } from '@/theme/tokens';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import type { WidgetSnapshot } from '@/widgets/snapshot';

const SAMPLE: WidgetSnapshot = {
  leftToday: 5,
  updatedAt: '',
  flowers: [
    { id: '1', kind: 'marigold', stage: 'bloom', health: 'ok', count: 4, status: 'due', label: '', tone: 'due' },
    { id: '2', kind: 'tulip', stage: 'bud', health: 'ok', count: 0, status: 'due', label: '', tone: 'due' },
    { id: '3', kind: 'lavender', stage: 'bloom', health: 'ok', count: 12, status: 'later', label: '', tone: 'muted' },
    { id: '4', kind: 'daisy', stage: 'bud', health: 'dormant', count: 0, status: 'due', label: '', tone: 'driedUp' },
    { id: '5', kind: 'sunflower', stage: 'bloom', health: 'ok', count: 21, status: 'done', label: '', tone: 'done' },
    { id: '6', kind: 'rose', stage: 'bloom', health: 'wilt', count: 3, status: 'due', label: '', tone: 'wilting' },
  ],
};

export function WidgetPreview({ snapshot }: { snapshot: WidgetSnapshot }) {
  const data = snapshot.flowers.length ? snapshot : SAMPLE;
  return (
    <View style={styles.widget} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={styles.header}>
        <Text size={15} weight={800}>
          My HabitFlowers
        </Text>
        <Text size={12.5} weight={700} color={colors.chipMutedText}>
          {data.leftToday === 0 ? 'All done today' : `${data.leftToday} left today`}
        </Text>
      </View>
      <View style={styles.row}>
        {data.flowers.map((f) => (
          <View key={f.id} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 52, height: 52 }}>
              <Flower kind={f.kind as FlowerKind} stage={f.stage as FlowerStage} health={f.health as FlowerHealth} size={52} />
              {f.status === 'due' ? (
                <View style={styles.due}>
                  <Icon name="dueChevron" size={14} color={colors.accent} strokeWidth={3.4} />
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: f.status === 'done' ? colors.accent : colors.switchOff }]}>
                  <Icon name={f.status === 'done' ? 'check' : f.status === 'rest' ? 'moon' : 'clock'} size={10} color={f.status === 'done' ? colors.onAccent : colors.chipMutedText} strokeWidth={3} />
                </View>
              )}
              {f.count > 0 ? (
                <View style={styles.count}>
                  <Text size={10} weight={800} lineHeight={12} color={f.health === 'wilt' ? colors.wilting : colors.text}>
                    {f.count}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: { alignSelf: 'center', width: '100%', maxWidth: 364, height: 170, borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.sheet, padding: 14, justifyContent: 'space-between', marginVertical: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', gap: 2 },
  due: { position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.sheet, alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', right: -4, bottom: 2, minWidth: 19, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.divider, borderWidth: 2, borderColor: colors.sheet, alignItems: 'center', justifyContent: 'center' },
});
