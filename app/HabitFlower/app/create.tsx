import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Flower } from '@/flower/Flower';
import { addButtonBottom, colors, radius, sizes, tabBar, tint } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

const BLUE = colors.taskBlue;
const PINK = colors.friendPink;

function Tile({ onPress, bg, style, children, label }: { onPress: () => void; bg: string; style?: object; children: React.ReactNode; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg }, style, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {children}
    </Pressable>
  );
}

const OFFSCREEN = Dimensions.get('window').height;
/** The sheet extends this far below the screen so its edge never shows. */
const BLEED = 80;

/**
 * The + "Add new" bento sheet: a bottom sheet (rounded top corners only)
 * over a plain dim, no blur. Opening: the dim fades in, the sheet slides up,
 * and the + turns 45 degrees into the close X, which stays where the + was.
 * Closing runs it in reverse.
 */
export default function CreateChooser() {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) progress.setValue(1);
      // No overshoot: a bounce would lift the sheet off the bottom edge.
      else Animated.spring(progress, { toValue: 1, damping: 26, stiffness: 260, mass: 0.9, overshootClamping: true, useNativeDriver: true }).start();
    });
  }, [progress]);

  /** Animate out, then leave (and optionally open the next screen). */
  const close = (next?: '/habit/new' | '/task/new' | '/friends') => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      router.back();
      if (next) setTimeout(() => router.push(next), 10);
    });
  };
  const go = (path: '/habit/new' | '/task/new' | '/friends') => close(path);

  // Drag down to close, like the other sheets.
  const dragY = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(close);
  closeRef.current = close;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && g.dy > Math.abs(g.dx) * 1.2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 1) closeRef.current();
        else Animated.spring(dragY, { toValue: 0, damping: 26, stiffness: 260, overshootClamping: true, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const sheetStyle = {
    transform: [{ translateY: Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [OFFSCREEN * 0.6, 0] }), dragY) }],
  };
  // Leave room under the tiles for the close button, which sits where the + was.
  const closeBottom = addButtonBottom(insets.bottom);
  const turn = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sheetScrim, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View {...pan.panHandlers} style={[styles.sheet, { paddingBottom: closeBottom + tabBar.addHeight + 16 + BLEED, marginBottom: -BLEED }, sheetStyle]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <Text size={20} weight={800} style={{ marginHorizontal: 4 }} accessibilityRole="header">
          Add new
        </Text>
        <View style={styles.grid}>
          <Tile label="Habit, grow a HabitFlower" onPress={() => go('/habit/new')} bg={tint(colors.accent, 0.12)} style={{ flex: 1.1, justifyContent: 'space-between' }}>
            <View style={styles.flowers} importantForAccessibility="no-hide-descendants">
              <Flower kind="sunflower" stage="seed" size={46} />
              <Flower kind="sunflower" stage="bud" size={62} />
              <Flower kind="sunflower" stage="bloom" size={84} />
            </View>
            <View style={{ gap: 2 }}>
              <Text size={20} weight={800}>
                Habit
              </Text>
              <Text size={13} weight={600} color={colors.accentTintText}>
                Grow a HabitFlower
              </Text>
            </View>
          </Tile>
          <View style={{ flex: 1, gap: 10 }}>
            <Tile label="Task, once or on repeat" onPress={() => go('/task/new')} bg={tint(BLUE, 0.12)} style={styles.small}>
              <View style={{ gap: 6 }} importantForAccessibility="no-hide-descendants">
                <View style={styles.line}>
                  <View style={[styles.box, { backgroundColor: BLUE }]}>
                    <Icon name="check" size={10} color={colors.onTaskBlue} strokeWidth={4} />
                  </View>
                  <View style={[styles.bar, { width: 54 }]} />
                </View>
                <View style={styles.line}>
                  <View style={[styles.box, { backgroundColor: tint(BLUE, 0.25) }]} />
                  <View style={[styles.bar, { width: 70 }]} />
                </View>
              </View>
              <View style={{ gap: 1 }}>
                <Text size={17} weight={800}>
                  Task
                </Text>
                <Text size={12.5} weight={600} color={colors.infoText}>
                  Once or on repeat
                </Text>
              </View>
            </Tile>
            <Tile label="Friend, grow together" onPress={() => go('/friends')} bg={tint(PINK, 0.12)} style={styles.small}>
              <View style={{ flexDirection: 'row', paddingLeft: 6 }} importantForAccessibility="no-hide-descendants">
                {['@mayac', '@sampatel'].map((seed) => (
                  <View key={seed} style={[styles.face, { overflow: 'hidden' }]}>
                    <Avatar seed={seed} size={26} />
                  </View>
                ))}
                <View style={[styles.face, { backgroundColor: PINK }]}>
                  <Icon name="plus" size={14} color={colors.onFriendPink} strokeWidth={3} />
                </View>
              </View>
              <View style={{ gap: 1 }}>
                <Text size={17} weight={800}>
                  Friend
                </Text>
                <Text size={12.5} weight={600} color={colors.friendPinkText}>
                  Grow together
                </Text>
              </View>
            </Tile>
          </View>
        </View>
      </Animated.View>
      {/* Moves with the sheet while it is dragged. */}
      <Animated.View style={[styles.closeWrap, { bottom: addButtonBottom(insets.bottom), transform: [{ translateY: dragY }] }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => close()} style={styles.close}>
          {/* Same + glyph as the tab bar, turned into an X. */}
          <Animated.View style={{ transform: [{ rotate: turn }] }}>
            <Icon name="plus" size={26} color={colors.onAccentDeep} strokeWidth={2.8} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    backgroundColor: colors.sheet,
    gap: 14,
  },
  handle: { alignSelf: 'center', width: sizes.grabHandle.width, height: sizes.grabHandle.height, borderRadius: 3, backgroundColor: colors.grabHandle, marginBottom: 2 },
  grid: { flexDirection: 'row', gap: 10, height: 274 },
  tile: { borderRadius: 22, borderCurve: 'continuous', padding: 14, overflow: 'hidden' },
  small: { flex: 1, justifyContent: 'space-between' },
  flowers: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  box: { width: 16, height: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, backgroundColor: tint(BLUE, 0.35) },
  face: { width: 30, height: 30, marginLeft: -6, borderRadius: 15, borderWidth: 2, borderColor: colors.friendTileRing, alignItems: 'center', justifyContent: 'center' },
  closeWrap: { position: 'absolute', alignSelf: 'center' },
  close: {
    width: tabBar.addWidth,
    height: tabBar.addHeight,
    borderRadius: tabBar.addHeight / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
