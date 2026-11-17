import { View } from 'react-native';

import { Flower } from '@/flower/Flower';
import type { FlowerHealth, FlowerStage } from '@/domain/types';
import { colors, tint, type FlowerKind } from '@/theme/tokens';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';

function Step({ kind, stage, health, bg, title, body }: { kind: FlowerKind; stage: FlowerStage; health: FlowerHealth; bg: string; title: string; body: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 68, height: 68, borderRadius: 18, borderCurve: 'continuous', backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Flower kind={kind} stage={stage} health={health} size={50} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text size={16} weight={800}>
          {title}
        </Text>
        <Text size={14} weight={500} color={colors.text2} lineHeight={20}>
          {body}
        </Text>
      </View>
    </View>
  );
}

/** "How to grow" guide, opened from "How to grow?" on the habit form. */
export function GrowGuideSheet({ visible, onClose, kind }: { visible: boolean; onClose: () => void; kind: FlowerKind }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="How to grow">
      <View style={{ height: 128, borderRadius: 20, borderCurve: 'continuous', backgroundColor: tint(colors.accent, 0.1), flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 10, paddingBottom: 14 }}>
        {(
          [
            ['seed', 64, 'Sprout'],
            ['bud', 72, 'Bud'],
            ['bloom', 80, 'Bloom'],
          ] as const
        ).map(([stage, size, label]) => (
          <View key={stage} style={{ alignItems: 'center', gap: 2 }}>
            <Flower kind={kind} stage={stage} size={size} />
            <Text size={12} weight={700} color={colors.text2}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 16, paddingTop: 6 }}>
        <Step kind={kind} stage="bloom" health="ok" bg={tint(colors.accent, 0.1)} title="Check in" body="Each check-in grows it one stage. Keep checking in to keep it in bloom." />
        <Step kind={kind} stage="bloom" health="wilt" bg={tint(colors.badge, 0.12)} title="Wilting" body="Miss a day and it droops. Check in next time to perk it back up." />
        <Step kind={kind} stage="seed" health="dormant" bg={tint(colors.driedUp, 0.1)} title="Dried up" body="Miss twice in a row and it dries up. Check in to bring it back as a bud." />
        <Step
          kind={kind}
          stage="bloom"
          health="ok"
          bg={colors.info}
          title="Resting"
          body={
            <>
              Rest days, paused days and{' '}
              <Text size={14} weight={700} color={colors.infoText}>
                Away mode
              </Text>{' '}
              never hurt it.
            </>
          }
        />
      </View>
    </Sheet>
  );
}
