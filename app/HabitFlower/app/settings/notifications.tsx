import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { NotificationPrefs } from '@/domain/types';
import { notificationsAllowed, requestNotifications } from '@/state/effects';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Switch } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

// Friends rows (nudges, reactions, requests, friend posts) arrive with v1.1.
const ROWS: [keyof NotificationPrefs, string, string][] = [
  ['reminders', 'Reminders', 'At the times you set'],
  ['windowClosing', 'Window closing', '30 min before it ends'],
  ['wilting', 'Wilting', 'When a flower starts to droop'],
  ['milestones', 'Milestones', 'Blooms and bloom streaks'],
];

export default function NotificationSettings() {
  const prefs = useStore((s) => s.user.settings.notifications);
  const updateSettings = useStore((s) => s.updateSettings);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    notificationsAllowed().then(setAllowed).catch(() => setAllowed(false));
  }, []);

  return (
    <Screen>
      <BackLink label="Settings" fallback="/settings" />
      <Text size={30} display style={{ marginTop: 6, marginBottom: 14 }} accessibilityRole="header">
        Notifications
      </Text>

      {allowed === false ? (
        <View style={[styles.card, { padding: 16, gap: 12, marginBottom: 14 }]}>
          <Text size={15} weight={600} color={colors.text2}>
            Notifications are off for Habitflower.
          </Text>
          <Button
            title="Turn on notifications"
            height={48}
            onPress={async () => {
              const ok = await requestNotifications();
              setAllowed(ok);
              if (!ok) Linking.openSettings();
            }}
          />
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text label accessibilityRole="header">
          Your habits
        </Text>
        <View style={styles.card}>
          {ROWS.map(([key, label, sub], i) => (
            <View key={key} style={[styles.row, i < ROWS.length - 1 && styles.divider]}>
              <View style={{ flex: 1, gap: 1 }}>
                <Text size={15.5} weight={600}>
                  {label}
                </Text>
                <Text size={12.5} weight={500} color={colors.text3Small}>
                  {sub}
                </Text>
              </View>
              <Switch accessibilityLabel={label} value={prefs[key]} onValueChange={(v) => updateSettings({ notifications: { ...prefs, [key]: v } })} />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
});
