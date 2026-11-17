/**
 * Page shell for the main tabs. Every tab uses the same safe-area padding,
 * scroll container and header, so titles stay in exactly the same place
 * when switching tabs.
 *
 * `overlay` (Away mode on Home) covers the page with a dimmed, blurred layer
 * that blocks the content. The header stays above it and stays usable; the
 * tab bar lives outside the scene, so it is never covered.
 */
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { away, colors, space } from '@/theme/tokens';
import { Grain } from './Grain';
import { TabHeader } from './TabHeader';

/** Height of TabHeader: top padding, date line and title. */
const HEADER_HEIGHT = 80;

export function TabScreen({
  title,
  right,
  belowHeader,
  children,
  contentStyle,
  overlay,
}: {
  title: string;
  right?: ReactNode;
  /** Shown under the title, inside the header block. */
  belowHeader?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Full-screen layer over the content; the header stays on top. */
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const covered = !!overlay;
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <ScrollView
        // iOS must never add its own insets here, or titles drift between tabs.
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!covered}
        importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={covered}
      >
        {/* Hidden (not removed) under the overlay so the layout does not jump. */}
        <View style={{ gap: 14, opacity: covered ? 0 : 1 }}>
          <TabHeader title={title} right={right} />
          {belowHeader}
        </View>
        {children}
      </ScrollView>
      {covered ? (
        <>
          <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: away.scrim }]} />
            {/* Content area starts under the header (about 80pt tall). */}
            <View style={{ flex: 1, paddingTop: insets.top + HEADER_HEIGHT }}>{overlay}</View>
          </View>
          <View style={[styles.floatingHeader, { top: insets.top }]}>
            <TabHeader title={title} right={right} />
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.page, paddingBottom: 32 },
  floatingHeader: { position: 'absolute', left: space.page, right: space.page },
});
