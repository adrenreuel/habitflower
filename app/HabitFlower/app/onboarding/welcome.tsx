import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInExisting } from '@/api/auth';
import { backendEnabled } from '@/api/config';
import type { LinkedProvider } from '@/domain/types';
import { Flower } from '@/flower/Flower';
import { colors, onLight, tint } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { GoogleLogo } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';
import { Grain } from '@/ui/Grain';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [signIn, setSignIn] = useState(false);
  const [busy, setBusy] = useState<LinkedProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (p: LinkedProvider) => {
    setBusy(p);
    setError(null);
    const res = await signInExisting(p);
    setBusy(null);
    if (res.ok) setSignIn(false);
    else if (res.reason !== 'cancelled') setError(res.message ?? 'Couldn’t sign in. Try again.');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Grain />
      <View style={styles.center}>
        <View style={styles.art} importantForAccessibility="no-hide-descendants">
          <Flower kind="sunflower" stage="seed" size={72} />
          <Flower kind="sunflower" stage="bud" size={92} />
          <Flower kind="sunflower" stage="bloom" size={112} />
        </View>
        <View style={{ gap: 10 }}>
          <Text size={32} display lineHeight={40} align="center" accessibilityRole="header">
            {'Grow your habits\ninto flowers'}
          </Text>
          <Text size={16} weight={500} color={colors.text2} align="center">
            Check in regularly to help them bloom.
          </Text>
        </View>
      </View>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
        <Button title="Get started" height={56} onPress={() => router.push('/onboarding/notifications')} />
        {backendEnabled() ? <Button title="I already have an account" variant="ghost" height={44} onPress={() => setSignIn(true)} /> : null}
      </View>

      <Sheet visible={signIn} onClose={() => setSignIn(false)} title="Welcome back" subtitle="Sign in with the account you backed up with.">
        <View style={{ gap: 10 }}>
          <Button title="Continue with Apple" icon="apple" variant="light" textColor={onLight} height={52} loading={busy === 'apple'} disabled={!!busy} onPress={() => go('apple')} />
          <Button title="Continue with Google" variant="secondary" height={52} leading={<GoogleLogo size={18} />} loading={busy === 'google'} disabled={!!busy} onPress={() => go('google')} />
          {error ? (
            <Text size={13.5} weight={600} color={colors.wilting}>
              {error}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 28 },
  art: { width: 300, height: 220, borderRadius: 40, borderCurve: 'continuous', backgroundColor: tint(colors.accent, 0.1), flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, paddingBottom: 22 },
  actions: { gap: 12, paddingHorizontal: 24 },
});
