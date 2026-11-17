/**
 * Main tabs: Habits, Tasks, Friends, Activity, with the + in the middle of a
 * custom bottom bar. The screens sit in a native pager, so you can swipe
 * between them as well as tap the tabs.
 */
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { router, withLayoutContext } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { taskSection } from '@/domain/tasks';
import { useToday } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors, tabBar } from '@/theme/tokens';
import { Icon, type IconName } from '@/ui/Icon';
import { Text } from '@/ui/Text';

const { Navigator } = createMaterialTopTabNavigator();

/** expo-router wrapper around the swipeable tab navigator. */
const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Habits', icon: 'habitsTab' },
  tasks: { label: 'Tasks', icon: 'tasksTab' },
  friends: { label: 'Friends', icon: 'friendsTab' },
  activity: { label: 'Activity', icon: 'bellTab' },
};

function Badge({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <View accessible accessibilityLabel={label} style={styles.badge}>
      <Text size={11} weight={800} color={colors.badgeText} lineHeight={14}>
        {n > 99 ? '99+' : n}
      </Text>
    </View>
  );
}

function TabFace({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={styles.face}>
      <Icon name={icon} size={24} color={color} strokeWidth={2} />
      <Text size={11} weight={700} color={color}>
        {label}
      </Text>
    </View>
  );
}

function TabBar({ state, navigation, position }: Pick<MaterialTopTabBarProps, 'state' | 'navigation' | 'position'>) {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const tasks = useStore((s) => s.tasks);
  const unread = useStore((s) => s.notifications.filter((n) => !n.readAt).length);
  const open = tasks.filter((t) => !t.completedAt);
  const attention = open.filter((t) => ['overdue', 'today'].includes(taskSection(t, today))).length;
  const overdue = open.filter((t) => taskSection(t, today) === 'overdue').length;

  const routes = state.routes.filter((r) => TABS[r.name]);
  const slots = [routes[0], routes[1], null, routes[2], routes[3]];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, tabBar.minBottomPadding) }]}>
      {slots.map((route, i) => {
        if (!route) {
          return (
            <View key="add" style={[styles.slot, styles.addSlot]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a habit or task"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  router.push('/create');
                }}
                style={({ pressed }) => [styles.add, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <Icon name="plus" size={26} color={colors.onAccentDeep} strokeWidth={2.8} />
              </Pressable>
            </View>
          );
        }
        const focused = state.routes[state.index]?.key === route.key;
        const tab = TABS[route.name];
        // Follows the swipe: fully green on its own page, fading out toward the neighbours.
        const index = state.routes.indexOf(route);
        const activeOpacity = position.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.slot}
          >
            {/* Grey and green versions stacked; the green one's opacity tracks the swipe. */}
            <View style={styles.tabContent}>
              <TabFace icon={tab.icon} label={tab.label} color={colors.text3Small} />
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeOpacity }]}>
                <TabFace icon={tab.icon} label={tab.label} color={colors.accent} />
              </Animated.View>
              {/* Badges sit on the icon's corner. */}
              <View style={styles.iconBox} pointerEvents="none">
                {route.name === 'tasks' ? (
                  <Badge n={attention} label={`${attention} tasks need attention${overdue ? `, ${overdue} overdue` : ''}`} />
                ) : null}
                {route.name === 'activity' ? <Badge n={unread} label={`${unread} new`} /> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <SwipeTabs
      tabBarPosition="bottom"
      tabBar={(p) => <TabBar {...p} />}
      screenOptions={{
        swipeEnabled: true,
        // Render neighbours ahead of time so a swipe never shows a blank page.
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <SwipeTabs.Screen name="index" />
      <SwipeTabs.Screen name="tasks" />
      <SwipeTabs.Screen name="friends" />
      <SwipeTabs.Screen name="activity" />
    </SwipeTabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBg,
    paddingTop: tabBar.paddingTop,
    paddingHorizontal: 12,
  },
  slot: { flex: 1, alignItems: 'center', gap: 3, minHeight: tabBar.slotMinHeight },
  addSlot: { justifyContent: 'center' },
  tabContent: { alignItems: 'center' },
  face: { alignItems: 'center', gap: 3 },
  iconBox: { position: 'absolute', top: 0, width: 24, height: 24 },
  add: {
    // A pill inside the bar, lined up with the other tabs.
    width: tabBar.addWidth,
    height: tabBar.addHeight,
    marginTop: -tabBar.addNudge * 2,
    borderRadius: tabBar.addHeight / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.tabBg,
  },
});
