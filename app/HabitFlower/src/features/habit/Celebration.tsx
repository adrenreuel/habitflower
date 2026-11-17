/**
 * Check-in celebration for a completed day with no state change ("Done for
 * today"): flower pops in with sparkles, a short line and one button.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { FlowerState } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { FLOWER_NAMES } from '@/flower/kinds';
import { celebrationScrim, colors, flowerColors, onFlowerColor, tint, type FlowerKind } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

export type CelebrationInfo = { kind: FlowerKind; before: FlowerState; after: FlowerState };

/**
 * Title and line for a completed day that did not change the flower's state.
 * State changes (bud, bloom, recovery, revive, 30 days) are growth moments.
 */
export function celebrationCopy({ kind, after }: CelebrationInfo): { title: string; line: string } {
  const name = FLOWER_NAMES[kind];
  if (after.stage !== 'bloom') return { title: 'Done for today', line: `Your ${name} is doing well.` };
  const n = after.bloomDays;
  return { title: 'Done for today', line: `Your ${name} stays in bloom. ${n} ${n === 1 ? 'day' : 'days'} and counting.` };
}

const SPARKS = [
  { left: 30, top: 40, size: 10, delay: 0 },
  { left: 176, top: 30, size: 8, delay: 300 },
  { left: 196, top: 140, size: 12, delay: 600 },
  { left: 14, top: 150, size: 8, delay: 900 },
  { left: 104, top: 4, size: 9, delay: 450 },
];

function Spark({ left, top, size, delay, color }: { left: number; top: number; size: number; delay: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.3] }) }],
      }}
    />
  );
}

export function Celebration({ info, onClose }: { info: CelebrationInfo | null; onClose: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const up = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!info) return;
    pop.setValue(0);
    up.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(up, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [info, pop, up]);

  if (!info) return null;
  const color = flowerColors[info.kind];
  const { title, line } = celebrationCopy(info);
  const rise = { opacity: up, transform: [{ translateY: up.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} accessibilityViewIsModal accessibilityLiveRegion="assertive">
        <View style={styles.art} importantForAccessibility="no-hide-descendants">
          {SPARKS.map((s, i) => (
            <Spark key={i} {...s} color={color} />
          ))}
          <Animated.View style={[styles.tile, { backgroundColor: tint(color, 0.16), opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }] }]}>
            <Flower kind={info.kind} stage={info.after.stage} health={info.after.health} size={146} />
          </Animated.View>
        </View>
        <Animated.View style={[{ alignItems: 'center', gap: 8 }, rise]}>
          <Text size={28} display align="center" accessibilityRole="header">
            {title}
          </Text>
          <Text size={16} weight={500} color={colors.text2} align="center">
            {line}
          </Text>
        </Animated.View>
        <Animated.View style={[{ alignSelf: 'stretch', marginTop: 8 }, rise]}>
          <Button title="Nice" height={54} color={color} textColor={onFlowerColor(info.kind)} onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: celebrationScrim, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  art: { width: 220, height: 200, alignItems: 'center', justifyContent: 'center' },
  tile: { width: 180, height: 180, borderRadius: 56, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
});
