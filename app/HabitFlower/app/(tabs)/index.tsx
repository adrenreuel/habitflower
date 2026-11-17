import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HabitCard } from '@/features/home/HabitCard';
import { HabitsEmpty } from '@/features/home/HabitsEmpty';
import { useHabitViews, type HabitView } from '@/state/selectors';
import { useStore } from '@/state/store';
import { away as awayColors, colors, space } from '@/theme/tokens';
import { Button, IconButton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TabScreen } from '@/ui/TabScreen';
import { Text } from '@/ui/Text';

const CARD_GAP = 12;

/** Width of one card: half the screen inside the page padding. Shared by the grid and the rows so every card matches. */
function useCardWidth(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - space.page * 2 - CARD_GAP) / 2);
}

function rankDue(v: HabitView) {
  return v.flower.health === 'wilt' ? 0 : v.flower.health === 'dormant' ? 1 : 2;
}

function SectionTitle({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <View style={styles.sectionTitle} accessibilityRole="header">
      <Text label color={color}>
        {title}
      </Text>
      <Text size={13} weight={600} color={colors.text3}>
        ({count})
      </Text>
    </View>
  );
}

function CardRow({ items }: { items: HabitView[] }) {
  const cardWidth = useCardWidth();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.page }} contentContainerStyle={styles.rowContent}>
      {items.map((v) => (
        <HabitCard key={v.habit.id} view={v} width={cardWidth} />
      ))}
    </ScrollView>
  );
}

function Grid({ items }: { items: HabitView[] }) {
  const cardWidth = useCardWidth();
  const rows: HabitView[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: CARD_GAP }}>
      {rows.map((r) => (
        <View key={r[0].habit.id} style={{ flexDirection: 'row', gap: CARD_GAP }}>
          <HabitCard view={r[0]} width={cardWidth} />
          {r[1] ? <HabitCard view={r[1]} width={cardWidth} /> : null}
        </View>
      ))}
    </View>
  );
}

/** Away mode: centred message over the dimmed, blurred habit list. */
function AwayOverlay() {
  const setAway = useStore((s) => s.setAway);
  return (
    <View style={styles.awayWrap}>
      <View accessibilityRole="summary" style={styles.awayContent}>
        <View style={styles.awayIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Icon name="umbrella" size={34} color={colors.infoText} strokeWidth={2} />
        </View>
        <Text size={28} display color={awayColors.title} align="center" accessibilityRole="header">
          You’re away
        </Text>
        <Text size={14.5} weight={500} color={awayColors.body} align="center" lineHeight={21}>
          Your HabitFlowers won’t wilt, and reminders are off until you’re back.
        </Text>
        <Button title="I’m back" height={52} color={awayColors.button} textColor={awayColors.onButton} onPress={() => setAway(false)} style={{ alignSelf: 'stretch', marginTop: 14 }} />
      </View>
    </View>
  );
}

/** Link to Paused habits with a count. Hidden when nothing is paused. */
function PausedLink({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Paused habits, ${count}`}
      onPress={() => router.push('/habits/paused')}
      style={styles.pausedLink}
    >
      <Icon name="pause" size={16} color={colors.text3Small} />
      <Text size={14} weight={600} color={colors.text3Small}>
        Paused habits
      </Text>
      <Text size={14} weight={600} color={colors.text3}>
        ({count})
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { views, paused } = useHabitViews();
  const user = useStore((s) => s.user);
  const away = user.settings.away;

  const due = views.filter((v) => v.status === 'todo').sort((a, b) => rankDue(a) - rankDue(b));
  const later = views.filter((v) => v.status === 'later');
  const done = views.filter((v) => v.status === 'done');
  const rest = views.filter((v) => v.status === 'rest');

  return (
    <TabScreen
      title="My HabitFlowers"
      right={<IconButton name="settings" accessibilityLabel="Settings" onPress={() => router.push('/settings')} iconSize={22} />}
      overlay={away ? <AwayOverlay /> : undefined}
    >

        {views.length === 0 ? (
          // No active habits (none yet, or all paused): show the empty state,
          // keeping a way back to paused ones.
          <View style={{ flex: 1, gap: 18 }}>
            <HabitsEmpty />
            <PausedLink count={paused.length} />
          </View>
        ) : (
          <View style={{ flex: 1, gap: 18, paddingTop: 16 }}>
            {due.length > 0 ? <Grid items={due} /> : null}
            {later.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Later today" count={later.length} color={colors.chipMutedText} />
                <CardRow items={later} />
              </View>
            ) : null}
            {done.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Complete" count={done.length} color={colors.completeHeading} />
                <CardRow items={done} />
              </View>
            ) : null}
            {rest.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Another day" count={rest.length} color={colors.text3} />
                <CardRow items={rest} />
              </View>
            ) : null}
            <PausedLink count={paused.length} />
          </View>
        )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  rowContent: { gap: CARD_GAP, paddingHorizontal: space.page, paddingBottom: 2 },
  // Sits at the bottom of the screen; with a long list it follows the last card.
  pausedLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 'auto' },
  // Centred in the space between the header and the tab bar.
  awayWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  awayContent: { alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  awayIcon: { width: 72, height: 72, borderRadius: 24, borderCurve: 'continuous', backgroundColor: awayColors.iconTile, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
