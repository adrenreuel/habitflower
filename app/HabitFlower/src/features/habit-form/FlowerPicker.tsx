/**
 * Flower picker on New / Edit habit (NewHabit.dc.html, EditHabit.dc.html):
 * - FlowerButton: the 104px tinted tile at the top of the form with a white
 *   Change pill on its bottom edge.
 * - FlowerPickerSheet: preview card (swaying flower on still soil, name,
 *   sprout -> bud -> bloom), a 4-column grid that scrolls inside the sheet,
 *   and "Pick {Flower}". Tapping outside cancels.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Flower } from '@/flower/Flower';
import { FLOWER_KINDS, FLOWER_NAMES } from '@/flower/kinds';
import { SwayingFlower } from '@/flower/SwayingFlower';
import { colors, flowerColors, picker, tint, type FlowerKind } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';
import { GrowGuideSheet } from './GrowGuideSheet';

export function FlowerButton({ kind, onPress, disabled }: { kind: FlowerKind; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Flower: ${FLOWER_NAMES[kind]}. Change`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.flowerButton, pressed && { transform: [{ scale: 0.97 }] }, disabled && { opacity: 0.55 }]}
    >
      <View style={[styles.flowerTile, { backgroundColor: tint(flowerColors[kind], 0.16) }]}>
        <Flower kind={kind} size={84} />
      </View>
      <View style={styles.changePill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon name="swap" size={12} color={picker.onChangePill} strokeWidth={2.8} />
        <Text size={12} weight={800} color={picker.onChangePill}>
          Change
        </Text>
      </View>
    </Pressable>
  );
}

function Stages({ kind }: { kind: FlowerKind }) {
  return (
    <View style={styles.stages} accessible accessibilityLabel="Grows from sprout to bud to bloom">
      <Flower kind={kind} stage="seed" size={34} />
      <View style={styles.stageArrow}>
        <Icon name="chevronRight" size={12} color={colors.text3} strokeWidth={2.6} />
      </View>
      <Flower kind={kind} stage="bud" size={38} />
      <View style={styles.stageArrow}>
        <Icon name="chevronRight" size={12} color={colors.text3} strokeWidth={2.6} />
      </View>
      <Flower kind={kind} stage="bloom" size={42} />
    </View>
  );
}

export function FlowerPickerSheet({
  visible,
  value,
  usedBy,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: FlowerKind;
  /** Flowers other habits already use, with the habit name. A hint only, never blocked. */
  usedBy: Partial<Record<FlowerKind, string>>;
  onPick: (k: FlowerKind) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);
  const color = flowerColors[draft];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Pick a flower"
      scroll={false}
      headerRight={
        <Pressable accessibilityRole="button" onPress={() => setGuide(true)} style={styles.guideBtn}>
          <Icon name="help" size={15} color={colors.accentTintText} />
          <Text size={13} weight={700} color={colors.accentTintText}>
            How to grow?
          </Text>
        </Pressable>
      }
      footer={<Button title={`Pick ${FLOWER_NAMES[draft]}`} height={52} color={picker.pickButton} textColor={picker.onPickButton} onPress={() => onPick(draft)} style={{ flex: 1 }} />}
    >
      <View style={[styles.preview, { backgroundColor: tint(color, 0.12) }]}>
        <SwayingFlower kind={draft} size={112} />
        <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
          <Text size={24} display lineHeight={27} accessibilityRole="header">
            {FLOWER_NAMES[draft]}
          </Text>
          <Stages kind={draft} />
        </View>
      </View>
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        // No bounce: iOS would otherwise take the downward drag and the sheet could not be pulled down.
        bounces={false}
        alwaysBounceVertical={false}
        accessibilityRole="radiogroup"
      >
        {FLOWER_KINDS.map((k) => {
          const on = draft === k;
          const used = usedBy[k];
          return (
            <View key={k} style={styles.col}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${FLOWER_NAMES[k]}${used ? `, used by ${used}` : ''}`}
                onPress={() => setDraft(k)}
                // The selected flower gets a ring in its own colour (design exception to "no outlines").
                style={[styles.cell, on ? { backgroundColor: tint(flowerColors[k], 0.22), borderColor: flowerColors[k] } : null]}
              >
                <Flower kind={k} size={44} />
                <Text size={12} weight={700} lineHeight={14} color={on ? colors.text : colors.chipText} numberOfLines={1}>
                  {FLOWER_NAMES[k]}
                </Text>
                {used ? (
                  <View style={styles.used}>
                    <Text size={10} weight={800} lineHeight={18} color={picker.usedText}>
                      Used
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <GrowGuideSheet visible={guide} onClose={() => setGuide(false)} kind={draft} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flowerButton: { width: 104, paddingBottom: 12, alignItems: 'center', alignSelf: 'center' },
  flowerTile: { width: 104, height: 104, borderRadius: 30, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  changePill: {
    position: 'absolute',
    bottom: 0,
    height: 26,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 13,
    backgroundColor: picker.changePill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // 3px ring in the page colour so the pill reads as sitting on the tile edge.
    borderWidth: 3,
    borderColor: colors.bg,
    boxSizing: 'content-box',
  },
  guideBtn: { height: 32, paddingLeft: 8, paddingRight: 12, borderRadius: 16, backgroundColor: tint(colors.accent, 0.16), flexDirection: 'row', alignItems: 'center', gap: 6 },
  preview: { borderRadius: 22, borderCurve: 'continuous', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  stages: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  stageArrow: { marginBottom: 12 },
  gridScroll: { flexShrink: 1, marginHorizontal: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // 4 columns with an 8pt gutter, for any number of flowers.
  col: { width: '25%', padding: 4 },
  cell: {
    height: 92,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  used: { position: 'absolute', top: 6, right: 6, height: 18, paddingHorizontal: 6, borderRadius: 9, backgroundColor: picker.usedTag },
});
