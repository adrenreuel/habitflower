import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import { backendEnabled } from '@/api/config';
import { colors, fonts, tint } from '@/theme/tokens';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const FAQ: [string, string][] = [
  ['Why is my flower drooping?', 'It wilts after one missed day. Check in next time and it perks back up.'],
  ['What does dried up mean?', 'Two missed days in a row. Check in to bring it back as a bud.'],
  ['Do rest days count?', 'No. Rest days, paused days and Away mode never hurt a flower.'],
  ['How do I back up?', 'Go to Settings, then Account, and continue with Apple or Google.'],
];

export default function HelpScreen() {
  const [open, setOpen] = useState(0);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const send = async () => {
    if (!text.trim()) return;
    setState('sending');
    try {
      await api.sendFeedback(text.trim());
      setState('sent');
      setText('');
    } catch {
      setState('failed');
    }
  };

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <BackLink label="Settings" fallback="/settings" />
      <Text size={30} display accessibilityRole="header">
        Help
      </Text>
      <View style={styles.card}>
        {FAQ.map(([q, a], i) => {
          const o = open === i;
          return (
            <View key={q} style={i < FAQ.length - 1 && styles.divider}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: o }} onPress={() => setOpen(o ? -1 : i)} style={styles.q}>
                <Text size={15} weight={700} style={{ flex: 1 }}>
                  {q}
                </Text>
                <View style={{ transform: [{ rotate: o ? '180deg' : '0deg' }] }}>
                  <Icon name="chevronDownSmall" size={20} color={colors.text2} />
                </View>
              </Pressable>
              {o ? (
                <Text size={14} weight={500} color={colors.text2} lineHeight={20} style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  {a}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {backendEnabled() ? (
        <View style={{ gap: 10 }}>
          <Text size={18} weight={700} accessibilityRole="header">
            Send feedback
          </Text>
          <TextInput
            accessibilityLabel="Your feedback"
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (state !== 'sending') setState('idle');
            }}
            placeholder="An idea, a bug, anything"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            style={styles.input}
            maxLength={2000}
          />
          {state === 'sent' ? (
            <Button title="Sent. Thank you!" height={52} color={tint(colors.accent, 0.18)} textColor={colors.accentTintText} haptic={false} />
          ) : (
            <Button title="Send" height={52} loading={state === 'sending'} disabled={!text.trim()} onPress={send} />
          )}
          {state === 'failed' ? (
            <Text size={13.5} weight={600} color={colors.wilting}>
              Couldn’t send. Check your connection and try again.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.card, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  q: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 14 },
  input: { height: 110, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.card, color: colors.text, fontFamily: fonts.medium, fontSize: 15, textAlignVertical: 'top' },
});
