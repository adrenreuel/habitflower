import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { deleteAccount, linkProvider, type AuthOutcome } from '@/api/auth';
import { backendEnabled } from '@/api/config';
import type { LinkedProvider } from '@/domain/types';
import { useStore, uuid } from '@/state/store';
import { colors, onLight, tint } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { GoogleLogo, Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';

const NAMES: Record<LinkedProvider, string> = { apple: 'Apple', google: 'Google' };

function messageFor(o: AuthOutcome): string | null {
  if (o.ok || o.reason === 'cancelled') return null;
  if (o.reason === 'in_use') return 'That sign-in already backs up another account.';
  if (o.reason === 'unavailable') return 'Backup isn’t available right now. Try again later.';
  return o.message ?? 'Something went wrong. Try again.';
}

export default function AccountScreen() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const [busy, setBusy] = useState<LinkedProvider | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const linked = user.linkedProviders;

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const link = async (p: LinkedProvider) => {
    setBusy(p);
    setError(null);
    const res = await linkProvider(p);
    setBusy(null);
    setError(messageFor(res));
  };

  return (
    <Screen>
      <BackLink label="Settings" fallback="/settings" />
      <View style={styles.head}>
        <Avatar seed={user.avatarSeed} size={88} accessibilityLabel="Your avatar" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Shuffle avatar"
          onPress={() => updateUser({ avatarSeed: uuid().slice(0, 8) })}
          style={({ pressed }) => [styles.shuffle, pressed && { opacity: 0.8 }]}
        >
          <Icon name="repeat" size={14} color={colors.text} />
          <Text size={13} weight={700}>
            Shuffle
          </Text>
        </Pressable>
        <Text size={24} display accessibilityRole="header">
          {user.username ? `@${user.username}` : 'Your account'}
        </Text>
      </View>

      <View style={{ gap: 18 }}>
        {linked.length === 0 ? (
          <View style={styles.card}>
            <View style={{ gap: 4 }}>
              <View style={styles.titleRow}>
                <Text size={17} weight={800} style={{ flex: 1 }}>
                  Back up your HabitFlowers
                </Text>
                <View style={styles.notBacked}>
                  <Text size={12} weight={700} color={colors.missedText}>
                    Not backed up
                  </Text>
                </View>
              </View>
              <Text size={14} weight={500} color={colors.text2} lineHeight={20}>
                Keep them if you switch or lose your phone.
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {appleAvailable ? (
                <Button
                  title="Continue with Apple"
                  variant="light"
                  textColor={onLight}
                  height={52}
                  loading={busy === 'apple'}
                  disabled={!backendEnabled() || !!busy}
                  icon="apple"
                  onPress={() => link('apple')}
                />
              ) : null}
              <Button
                title="Continue with Google"
                variant="secondary"
                height={52}
                loading={busy === 'google'}
                disabled={!backendEnabled() || !!busy}
                onPress={() => link('google')}
                leading={<GoogleLogo size={18} />}
              />
            </View>
            {!backendEnabled() ? (
              <Text size={13} weight={500} color={colors.text3Small}>
                Backup turns on once this build is connected to the Habitflower server.
              </Text>
            ) : null}
            {error ? (
              <Text size={13.5} weight={600} color={colors.wilting} accessibilityLiveRegion="assertive">
                {error}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.group}>
            <View style={styles.row}>
              <Text size={15.5} weight={600} style={{ flex: 1 }}>
                Signed in with
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {linked[0] === 'apple' ? <Icon name="apple" size={16} color={colors.text3Small} /> : <GoogleLogo size={16} />}
                <Text size={14.5} weight={600} color={colors.text3Small}>
                  {linked.map((p) => NAMES[p]).join(', ')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Button title="Delete account" variant="secondary" textColor={colors.driedUp} height={52} onPress={() => setConfirm(true)} style={{ borderRadius: 22, borderCurve: 'continuous', marginTop: 12 }} />
      </View>

      <Sheet visible={confirm} onClose={() => setConfirm(false)} title="Delete your account?">
        <Text size={14.5} weight={500} color={colors.text2} lineHeight={21}>
          Your HabitFlowers and tasks will be deleted for good.
        </Text>
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Button
            title="Delete account"
            variant="destructive"
            height={52}
            loading={busy === 'delete'}
            onPress={async () => {
              setBusy('delete');
              const res = await deleteAccount();
              setBusy(null);
              if (!res.ok) {
                setConfirm(false);
                setError(messageFor(res));
              }
            }}
          />
          <Button title="Cancel" variant="secondary" height={52} onPress={() => setConfirm(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 10, paddingTop: 4, paddingBottom: 24 },
  shuffle: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.raised, flexDirection: 'row', alignItems: 'center', gap: 6 },
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, padding: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notBacked: { height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: tint(colors.badge, 0.16), justifyContent: 'center' },
  group: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
});
