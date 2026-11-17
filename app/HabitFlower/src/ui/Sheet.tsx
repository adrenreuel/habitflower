/**
 * Bottom sheet: 28px top corners, 40x5 grab handle, sheet background.
 * Built on Modal so it works above tabs and stacks. The Modal itself does
 * not animate: the dim layer fades in place while only the sheet slides,
 * so the dimming never travels with the sheet.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes } from '@/theme/tokens';
import { Text } from './Text';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  /** Next to the title, e.g. a "How to grow?" link. */
  headerRight?: ReactNode;
  /**
   * Drag down anywhere (when the content is scrolled to the top) to close.
   * Turn off for sheets holding pickers that use vertical drags, such as time
   * wheels or a calendar; they close by dragging the handle or title instead.
   */
  dragFromContent?: boolean;
};

const OFFSCREEN = Dimensions.get('window').height;

export function Sheet({ visible, onClose, title, subtitle, children, footer, scroll = true, headerRight, dragFromContent = true }: SheetProps) {
  const insets = useSafeAreaInsets();
  // 0 = fully open, OFFSCREEN = hidden. The dim layer's opacity follows it.
  const translate = useRef(new Animated.Value(OFFSCREEN)).current;
  const [mounted, setMounted] = useState(visible);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Content scroll position: a downward drag only closes the sheet at the top.
  const scrollY = useRef(0);
  // Only scroll when the content is taller than the sheet. A ScrollView that
  // can't scroll still starts a native pan on a vertical drag and cancels the
  // sheet's own drag, so short sheets (most of them) wouldn't swipe closed.
  const sizes = useRef({ view: 0, content: 0 });
  const [overflows, setOverflows] = useState(false);
  const measure = (k: 'view' | 'content', h: number) => {
    sizes.current[k] = h;
    setOverflows(sizes.current.content > sizes.current.view + 1);
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      scrollY.current = 0;
      translate.setValue(OFFSCREEN);
      Animated.spring(translate, { toValue: 0, damping: 26, stiffness: 260, mass: 1, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(translate, { toValue: OFFSCREEN, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const isDownDrag = (g: { dx: number; dy: number }) => g.dy > 6 && g.dy > Math.abs(g.dx) * 1.2;
  const pan = useRef(
    PanResponder.create({
      // Bubble: drags on parts nothing else claims (handle, title, padding).
      onMoveShouldSetPanResponder: (_, g) => isDownDrag(g),
      // Capture: take downward drags from the content too, but only at the top
      // of the scroll so upward drags and mid-list drags still scroll.
      onMoveShouldSetPanResponderCapture: (_, g) => isDownDrag(g) && scrollY.current <= 0,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => translate.setValue(Math.max(0, g.dy)),
      onPanResponderTerminate: () => Animated.spring(translate, { toValue: 0, damping: 26, stiffness: 260, useNativeDriver: true }).start(),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1) onCloseRef.current();
        else Animated.spring(translate, { toValue: 0, damping: 26, stiffness: 260, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const scrimOpacity = translate.interpolate({ inputRange: [0, OFFSCREEN * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });

  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sheetScrim, opacity: scrimOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.end} pointerEvents="box-none">
          <Animated.View
            {...(dragFromContent ? pan.panHandlers : {})}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: translate }] }]}
          >
            <View {...(dragFromContent ? {} : pan.panHandlers)}>
              <View style={styles.handleArea}>
                <View style={styles.handle} />
              </View>
              {title ? (
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text size={22} weight={800} style={{ flexShrink: 1 }}>
                      {title}
                    </Text>
                    {headerRight}
                  </View>
                  {subtitle ? (
                    <Text size={14} weight={500} color={colors.text2}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <Body
              style={styles.body}
              contentContainerStyle={scroll ? styles.content : undefined}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              {...(scroll
                ? {
                    // No bounce at the top, so a downward drag moves the sheet, not the list.
                    bounces: false,
                    alwaysBounceVertical: false,
                    scrollEnabled: overflows,
                    onLayout: (e: LayoutChangeEvent) => measure('view', e.nativeEvent.layout.height),
                    onContentSizeChange: (_w: number, h: number) => measure('content', h),
                    scrollEventThrottle: 16,
                    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                      scrollY.current = e.nativeEvent.contentOffset.y;
                    },
                  }
                : {})}
            >
              {scroll ? children : <View style={[styles.content, styles.body]}>{children}</View>}
            </Body>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  end: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    maxHeight: '92%',
  },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: sizes.grabHandle.width, height: sizes.grabHandle.height, borderRadius: 3, backgroundColor: colors.grabHandle },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  // Shrinks inside the 92% max height so an inner list can scroll on its own.
  body: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', gap: 10 },
});
