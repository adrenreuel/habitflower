import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { signOut } from '@/api/auth';
import type { DayResetHour, WeekStart } from '@/domain/types';
import { notificationsAllowed } from '@/state/effects';
import { useStore } from '@/state/store';
import { colors, iconTiles, settingsGood } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Switch } from '@/ui/Card';
import { Icon, type IconName } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';

type Tile = keyof typeof iconTiles;

function SettingsRow({
  icon,
  tile,
  label,
  sub,
  value,
  onPress,
  right,
  last,
}: {
  icon: IconName;
  tile: Tile;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const [bg, fg] = iconTiles[tile];
  const body = (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={[styles.tile, { backgroundColor: bg }]}>
        <Icon name={icon} size={17} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text size={15.5} weight={600}>
          {label}
        </Text>
        {sub ? (
          <Text size={12.5} weight={500} color={settingsGood}>
            {sub}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text size={14.5} weight={600} color={colors.text3Small}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress ? <Icon name="chevronRight" size={18} color={colors.text3} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={[label, value].filter(Boolean).join(', ')} onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: colors.cardPressed }}>
      {body}
    </Pressable>
  );
}

function PickerSheet<T extends string | number>({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                onPick(o.value);
                onClose();
              }}
              style={[styles.option, { backgroundColor: on ? colors.accentTint : colors.card }]}
            >
              <Text size={16} weight={700} color={on ? colors.accentTintText : colors.text} style={{ flex: 1 }}>
                {o.label}
              </Text>
              {on ? <Icon name="check" size={20} color={colors.accentTintText} strokeWidth={2.8} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const RESET_LABEL: Record<DayResetHour, string> = { 0: '12:00 AM', 2: '2:00 AM', 4: '4:00 AM' };

export default function SettingsScreen() {
  const user = useStore((s) => s.user);
  const pausedCount = useStore((s) => s.habits.filter((h) => h.pausedAt).length);
  const { updateSettings, setAway } = useStore.getState();
  const [sheet, setSheet] = useState<'week' | 'reset' | 'signout' | null>(null);
  const [notifOn, setNotifOn] = useState<boolean | null>(null);
  const linked = user.linkedProviders.length > 0;

  useEffect(() => {
    notificationsAllowed().then(setNotifOn).catch(() => setNotifOn(false));
  }, []);

  return (
    <Screen>
      <BackLink label="Habits" />
      <Text
        size={32}
        display
        style={{ marginTop: 6 }}
        accessibilityRole="header"
        onLongPress={__DEV__ ? () => router.push('/flowers') : undefined}
      >
        Settings
      </Text>

      <View style={{ gap: 12, marginTop: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => router.push('/settings/account')} style={({ pressed }) => [styles.account, pressed && { backgroundColor: colors.cardPressed }]}>
          <Avatar seed={user.avatarSeed} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={18} weight={800}>
              {user.username ? `@${user.username}` : linked ? 'Backed up' : 'Not backed up'}
            </Text>
            <Text size={13} weight={600} color={colors.text3}>
              Account
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.text3} />
        </Pressable>

        <View style={styles.group}>
          <SettingsRow icon="bellTab" tile="pink" label="Notifications" value={notifOn === null ? undefined : notifOn ? 'On' : 'Off'} onPress={() => router.push('/settings/notifications')} />
          <SettingsRow icon="widget" tile="blue" label="Widgets" onPress={() => router.push('/settings/widgets')} last />
        </View>

        <View style={styles.group}>
          <SettingsRow
            icon="umbrella"
            tile="blue"
            label="Away mode"
            sub={user.settings.away ? 'Nothing wilts while you’re away' : undefined}
            right={<Switch accessibilityLabel="Away mode" value={user.settings.away} onValueChange={setAway} />}
          />
          <SettingsRow icon="dome" tile="purple" label="Paused habits" value={String(pausedCount)} onPress={() => router.push('/habits/paused')} />
          <SettingsRow icon="calendar" tile="amber" label="Week starts on" value={user.settings.weekStart === 0 ? 'Sunday' : 'Monday'} onPress={() => setSheet('week')} />
          <SettingsRow icon="moonSmall" tile="amber" label="New day starts at" value={RESET_LABEL[user.settings.dayResetHour]} onPress={() => setSheet('reset')} last />
        </View>

        <View style={styles.group}>
          <SettingsRow icon="help" tile="grey" label="Help and feedback" onPress={() => router.push('/settings/help')} last />
        </View>

        <Pressable accessibilityRole="button" onPress={() => setSheet('signout')} style={({ pressed }) => [styles.signOut, pressed && { backgroundColor: colors.cardPressed }]}>
          <Text size={15.5} weight={700} color={colors.driedUp}>
            Sign out
          </Text>
        </Pressable>
      </View>

      <PickerSheet<WeekStart>
        visible={sheet === 'week'}
        title="Week starts on"
        value={user.settings.weekStart}
        options={[
          { value: 0, label: 'Sunday' },
          { value: 1, label: 'Monday' },
        ]}
        onPick={(weekStart) => updateSettings({ weekStart })}
        onClose={() => setSheet(null)}
      />
      <PickerSheet<DayResetHour>
        visible={sheet === 'reset'}
        title="New day starts at"
        value={user.settings.dayResetHour}
        options={([0, 2, 4] as DayResetHour[]).map((h) => ({ value: h, label: RESET_LABEL[h] }))}
        onPick={(dayResetHour) => updateSettings({ dayResetHour })}
        onClose={() => setSheet(null)}
      />
      <Sheet visible={sheet === 'signout'} onClose={() => setSheet(null)} title="Sign out?">
        <Text size={14.5} weight={500} color={colors.text2} lineHeight={21}>
          {linked
            ? 'Your HabitFlowers stay backed up. Sign in again any time.'
            : 'You haven’t backed up. Your HabitFlowers and tasks on this phone will be lost.'}
        </Text>
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Button
            title="Sign out"
            variant="destructive"
            height={52}
            onPress={async () => {
              setSheet(null);
              await signOut();
            }}
          />
          {!linked ? <Button title="Back up first" variant="secondary" height={52} onPress={() => { setSheet(null); router.push('/settings/account'); }} /> : <Button title="Cancel" variant="secondary" height={52} onPress={() => setSheet(null)} />}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, paddingVertical: 12, paddingLeft: 12, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  group: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingLeft: 14, paddingRight: 14, paddingVertical: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tile: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous' },
  signOut: { height: 48, borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
});
