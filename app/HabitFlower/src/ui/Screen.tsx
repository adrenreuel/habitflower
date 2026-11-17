import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';
import { IconButton } from './Button';
import { Text } from './Text';
import { Grain } from './Grain';

export function Screen({
  children,
  scroll = true,
  footer,
  header,
  contentStyle,
  bottomInset = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** False inside tabs (the tab bar handles the bottom inset). */
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: space.page, paddingBottom: footer ? 24 : bottomInset ? insets.bottom + 24 : 24 };
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      {header}
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[pad, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </View>
  );
}

/** Top bar for pushed screens: back button, optional centred title, optional right action. */
export function NavBar({
  title,
  right,
  onBack,
  backIcon = 'back',
}: {
  title?: string;
  right?: ReactNode;
  onBack?: () => void;
  backIcon?: 'back' | 'close';
}) {
  return (
    <View style={styles.nav}>
      <IconButton
        name={backIcon}
        accessibilityLabel={backIcon === 'close' ? 'Close' : 'Back'}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <View style={{ flex: 1, alignItems: 'center' }}>
        {title ? (
          <Text size={17} weight={800} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function PageTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View style={{ gap: 4, marginBottom: 16 }}>
      <Text size={31} display lineHeight={38}>
        {children}
      </Text>
      {subtitle ? (
        <Text size={15} weight={500} color={colors.text2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: space.page, paddingTop: 12 },
});
