/**
 * Growth moments (GrowBud, GrowBloom, GrowMilestone, GrowRecovered,
 * GrowRevived, GrowRevivedSprout): full-screen celebration when a check-in
 * changes the flower's state.
 *
 * Order: flower, headline, body, growth track, button in a footer.
 * Motion: the flower reveal (old state -> new state), the rays and glow
 * appearing, and the headline, body, track and button fading in all play
 * once and stay. The rays keep turning slowly and the confetti keeps falling.
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { momentFrom, type GrowthMoment as Moment } from '@/domain/moments';
import type { FlowerHealth, FlowerStage, FlowerState } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { FLOWER_NAMES } from '@/flower/kinds';
import { SwayingFlower } from '@/flower/SwayingFlower';
import { colors, flowerColors, growth, onFlowerColor, tint, type FlowerKind } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type GrowthMomentInfo = { moment: Moment; kind: FlowerKind; before: FlowerState; after: FlowerState };

const CYCLE = 3200;
const STAGES: { stage: FlowerStage; label: string }[] = [
  { stage: 'seed', label: 'Sprout' },
  { stage: 'bud', label: 'Bud' },
  { stage: 'bloom', label: 'Bloom' },
];

export function momentCopy({ moment, kind, after }: GrowthMomentInfo): { title: string; body: string; button: string } {
  const name = FLOWER_NAMES[kind];
  switch (moment) {
    case 'budded':
      return { title: 'It budded', body: `Your ${name} grew a bud. Check in again tomorrow and it blooms.`, button: 'Nice' };
    case 'bloomed':
      return { title: 'It bloomed!', body: `Your ${name} is in full bloom.`, button: 'Amazing!' };
    case 'milestone30':
      return { title: '30 days in bloom', body: `Your ${name} has been blooming for a month.`, button: 'Keep it going' };
    case 'recovered':
      return { title: 'Perked back up', body: after.stage === 'bloom' ? `Your ${name} is blooming again.` : `Your ${name} perked back up.`, button: 'Nice' };
    case 'revivedBud':
      return { title: 'A bud again', body: `Your ${name} is a bud again. Check in again tomorrow and it blooms.`, button: 'Nice' };
    case 'revivedSprout':
      return { title: 'Growing again', body: `Your ${name} is growing again. Check in again tomorrow and it buds.`, button: 'Nice' };
  }
}

/** A value that runs 0 -> 1 every cycle, forever (unless motion is reduced). */
/** A value that runs 0 -> 1 once and stays at 1. */
function useOnce(running: boolean, duration = CYCLE) {
  const v = useRef(new Animated.Value(running ? 0 : 1)).current;
  useEffect(() => {
    if (!running) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const anim = Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [running, v, duration]);
  return v;
}

function useCycle(running: boolean, duration = CYCLE, easing = Easing.linear) {
  const v = useRef(new Animated.Value(running ? 0 : 1)).current;
  useEffect(() => {
    if (!running) {
      v.setValue(1);
      return;
    }
    // Always start from the beginning, never from where a previous run stopped.
    v.setValue(0);
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }), { resetBeforeIteration: true });
    loop.start();
    return () => loop.stop();
  }, [running, v, duration, easing]);
  return v;
}

/** 15 soft rays (8 degrees on, 16 off), fading out from the centre. */
function Rays({ color, size }: { color: string; size: number }) {
  const r = size / 2;
  const wedges = Array.from({ length: 15 }, (_, i) => {
    const a0 = ((i * 24 - 90) * Math.PI) / 180;
    const a1 = ((i * 24 + 8 - 90) * Math.PI) / 180;
    return `M${r} ${r}L${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)}Z`;
  });
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
          <Stop offset="0.18" stopColor={color} stopOpacity={growth.rayAlpha} />
          <Stop offset="0.68" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <G fill="url(#rayFade)">
        {wedges.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
    </Svg>
  );
}

function Glow({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={growth.glowAlpha} />
          <Stop offset="0.62" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill="url(#glow)" />
    </Svg>
  );
}

/** Fixed confetti layout so the moment looks the same every time. */
const CONFETTI = [
  [0.15, 8, 12, 7, 576, 80], [0.26, 12, 12, 43, 359, 280], [0.19, 12, 12, 16, 679, 320], [0.44, 12, 16, 45, 618, 10],
  [0.95, 8, 14, -23, 517, 330], [0.15, 10, 12, -39, 400, 450], [0.14, 8, 14, 59, 305, 90], [0.85, 8, 14, -40, 253, 230],
  [0.85, 10, 12, -38, 536, 130], [0.54, 12, 12, 9, 626, 50], [0.68, 9, 13, -20, 470, 380], [0.36, 10, 14, 30, 520, 200],
  [0.77, 12, 12, 12, 410, 260], [0.05, 9, 12, 25, 600, 170],
] as const;

function Confetti({ color, running }: { color: string; running: boolean }) {
  const { width, height } = Dimensions.get('window');
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONFETTI.map(([x, w, h, dx, rot, delay], i) => (
        <Piece key={i} color={color} running={running} left={x * width} w={w} h={h} dx={dx} rot={rot} delay={delay} fall={height + 60} />
      ))}
    </View>
  );
}

function Piece({ color, running, left, w, h, dx, rot, delay, fall }: { color: string; running: boolean; left: number; w: number; h: number; dx: number; rot: number; delay: number; fall: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: CYCLE - delay, easing: Easing.bezier(0.3, 0.6, 0.5, 1), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [running, v, delay]);
  if (!running) return null;
  // hfFall: hidden until 40%, visible at 48%, fades out by the end.
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left,
        width: w,
        height: h,
        borderRadius: Math.max(w, h),
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.4, 0.48, 1], outputRange: [0, 0, 1, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, dx] }) },
          { translateY: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [-40, -40, fall] }) },
          { rotate: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: ['0deg', '0deg', `${rot}deg`] }) },
        ],
      }}
    />
  );
}

/** Old state shrinks away, new state pops in and stays (hfOut / hfIn, played once). */
function FlowerLoop({ kind, from, to, showFrom, cycle }: { kind: FlowerKind; from: { stage: FlowerStage; health: FlowerHealth }; to: { stage: FlowerStage; health: FlowerHealth }; showFrom: boolean; cycle: Animated.Value }) {
  const outOpacity = cycle.interpolate({ inputRange: [0, 0.3, 0.48, 1], outputRange: [1, 1, 0, 0] });
  const outScale = cycle.interpolate({ inputRange: [0, 0.3, 0.48, 1], outputRange: [1, 1, 0.7, 0.7] });
  const inOpacity = cycle.interpolate({ inputRange: [0, 0.32, 0.5, 1], outputRange: [0, 0, 1, 1] });
  const inScale = cycle.interpolate({ inputRange: [0, 0.32, 0.5, 0.6, 1], outputRange: [0.4, 0.4, 1.12, 1, 1] });
  return (
    <View style={styles.flowerBox}>
      {showFrom ? (
        <Animated.View style={[styles.layer, { opacity: outOpacity, transform: [{ scale: outScale }] }]}>
          {/* Sways like the new stage; a dried-up flower stays still, as on its habit page. */}
          <SwayingFlower kind={kind} stage={from.stage} health={from.health} size={200} sway={from.health !== 'dormant'} />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.layer, { opacity: inOpacity, transform: [{ scale: inScale }] }]}>
        <SwayingFlower kind={kind} stage={to.stage} health={to.health} size={200} sway={to.health !== 'dormant'} />
      </Animated.View>
    </View>
  );
}

/** Stepper pill: past stages are filled checks, the current stage a tinted 44px circle, future stages faded previews. */
function GrowthTrack({ kind, current, justReached }: { kind: FlowerKind; current: FlowerStage; justReached: boolean }) {
  const color = flowerColors[kind];
  const c = STAGES.findIndex((s) => s.stage === current);
  const fill = useRef(new Animated.Value(justReached ? 0 : 1)).current;
  useEffect(() => {
    if (justReached) Animated.timing(fill, { toValue: 1, duration: 600, delay: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [justReached, fill]);

  return (
    <View style={styles.track} accessible accessibilityLabel={`Growth: ${STAGES[c].label}`}>
      {STAGES.map((s, i) => (
        <View key={s.stage} style={{ flexDirection: 'row', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
          <View style={styles.stage}>
            <View style={{ height: 44, justifyContent: 'center' }}>
              {i < c ? (
                <View style={[styles.past, { backgroundColor: color }]}>
                  <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3.6} />
                </View>
              ) : i === c ? (
                <View style={[styles.now, { backgroundColor: tint(color, 0.28) }]}>
                  <Flower kind={kind} stage={s.stage} size={40} />
                </View>
              ) : (
                <View style={styles.future}>
                  <View style={{ opacity: 0.45 }}>
                    <Flower kind={kind} stage={s.stage} size={30} />
                  </View>
                  {/* Greys the preview out (no image filters in RN). */}
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: tint(colors.raised, 0.55) }]} />
                </View>
              )}
            </View>
            <Text size={12} weight={i === c ? 800 : 600} color={i === c ? colors.text : i < c ? growth.body : growth.futureText}>
              {s.label}
            </Text>
          </View>
          {i < 2 ? (
            <View style={styles.line}>
              {i < c ? (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: color, transformOrigin: 'left', transform: [{ scaleX: i === c - 1 ? fill : 1 }] },
                  ]}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Each showing mounts a fresh screen (new key), so every animation, the
 * one-time fade-in and the track fill start from zero. Showing it again after
 * an undo and a new check-in never resumes a half-finished animation.
 */
export function GrowthMomentScreen({ info, onClose }: { info: GrowthMomentInfo | null; onClose: () => void }) {
  const showing = useRef(0);
  const last = useRef<GrowthMomentInfo | null>(null);
  if (info && info !== last.current) showing.current += 1;
  last.current = info;
  if (!info) return null;
  return <MomentScreen key={showing.current} info={info} onClose={onClose} />;
}

function MomentScreen({ info, onClose }: { info: GrowthMomentInfo; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const running = !reduced;
  // The reveal: plays once, then the new stage stays.
  const cycle = useOnce(running);
  const spin = useCycle(running, 18_000);
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    intro.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Fades in once and stays.
    Animated.timing(intro, { toValue: 1, duration: 900, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [info, intro]);

  const copy = useMemo(() => momentCopy(info), [info]);

  const color = flowerColors[info.kind];
  const from = momentFrom(info.moment, info.before, info.after);
  const to = { stage: info.after.stage, health: info.after.health };
  const fadeIn = (dy: number, start: number) => ({
    opacity: intro.interpolate({ inputRange: [0, start, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: intro.interpolate({ inputRange: [0, start, 1], outputRange: [dy, dy, 0], extrapolate: 'clamp' }) }],
  });
  const raysIn = cycle.interpolate({ inputRange: [0, 0.35, 0.55, 1], outputRange: [0, 0, 1, 1] });
  const raysScale = cycle.interpolate({ inputRange: [0, 0.35, 0.55, 1], outputRange: [0.6, 0.6, 1, 1] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top }]} accessibilityViewIsModal>
        <Animated.View style={[styles.glow, { opacity: raysIn }]} pointerEvents="none">
          <Glow color={color} size={520} />
        </Animated.View>
        <Confetti color={color} running={running} />

        <View style={styles.body} accessibilityLiveRegion="assertive">
          <View style={styles.art} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Animated.View style={[styles.rays, { opacity: raysIn, transform: [{ scale: raysScale }] }]} pointerEvents="none">
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Rays color={color} size={420} />
              </Animated.View>
            </Animated.View>
            <FlowerLoop kind={info.kind} from={from} to={to} showFrom={info.moment !== 'milestone30'} cycle={cycle} />
          </View>
          <Animated.View style={fadeIn(12, 0)}>
            <Text size={34} display align="center" lineHeight={41} accessibilityRole="header" style={{ marginTop: 4 }}>
              {copy.title}
            </Text>
          </Animated.View>
          <Animated.View style={[{ maxWidth: 290 }, fadeIn(12, 0.1)]}>
            <Text size={16} weight={500} color={growth.body} align="center" lineHeight={23}>
              {copy.body}
            </Text>
          </Animated.View>
          <Animated.View style={[{ marginTop: 14 }, fadeIn(12, 0.2)]}>
            <GrowthTrack kind={info.kind} current={to.stage} justReached={info.moment === 'budded' || info.moment === 'bloomed'} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 20 }, fadeIn(12, 0.3)]}>
          <Button title={copy.button} height={56} color={color} textColor={onFlowerColor(info.kind)} onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: growth.bg, overflow: 'hidden' },
  glow: { position: 'absolute', alignSelf: 'center', top: 300 - 260 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 60, paddingHorizontal: 32, paddingBottom: 8 },
  art: { width: 260, height: 240, alignItems: 'center', justifyContent: 'center' },
  rays: { position: 'absolute', width: 420, height: 420, alignItems: 'center', justifyContent: 'center' },
  flowerBox: { width: 210, height: 210 },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  track: { width: 260, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 24, borderCurve: 'continuous', backgroundColor: growth.track },
  stage: { width: 56, alignItems: 'center', gap: 6 },
  past: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  now: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  future: { width: 32, height: 32, borderRadius: 16, backgroundColor: growth.trackLine, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  line: { flex: 1, maxWidth: 48, height: 3, marginBottom: 22, borderRadius: 2, backgroundColor: growth.trackLine, overflow: 'hidden' },
});
