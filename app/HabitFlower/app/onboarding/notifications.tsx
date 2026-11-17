import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Flower } from '@/flower/Flower';
import { requestNotifications } from '@/state/effects';
import { useStore } from '@/state/store';
import { colors, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { Grain } from '@/ui/Grain';

/** Pre-permission screen shown before the iOS notification prompt. */
export default function NotifPrompt() {
  const insets = useSafeAreaInsets();
  const habit = useStore((s) => s.habits[0]);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <View style={styles.center}>
        <View style={styles.art} importantForAccessibility="no-hide-descendants">
          <View style={styles.banner}>
            <View style={styles.icon}>
              <Flower kind={habit?.flowerKind ?? 'sunflower'} stage="bloom" size={34} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={13} weight={800}>
                {habit?.name ?? 'Hit the gym'}
              </Text>
              <Text size={13} weight={500} color={colors.sheetBody}>
                Time to check in.
              </Text>
            </View>
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Text size={30} display lineHeight={38} align="center" accessibilityRole="header">
            Never miss a check-in
          </Text>
          <Text size={16} weight={500} color={colors.text2} align="center">
            We’ll remind you before a flower wilts.
          </Text>
        </View>
      </View>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
        <Button
          title="Turn on notifications"
          height={56}
          onPress={async () => {
            await requestNotifications().catch(() => false);
            completeOnboarding();
          }}
        />
        <Button title="Not now" variant="ghost" height={44} onPress={completeOnboarding} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26, paddingHorizontal: 28 },
  art: { width: 300, height: 210, borderRadius: 40, borderCurve: 'continuous', backgroundColor: tint(colors.taskBlue, 0.1), alignItems: 'center', justifyContent: 'center' },
  banner: { width: 248, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 22, borderCurve: 'continuous', backgroundColor: tint(colors.text, 0.12), flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  actions: { gap: 12, paddingHorizontal: 24 },
});
