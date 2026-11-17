import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppEffects } from '@/state/effects';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.divider, primary: colors.accent },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    YoungSerif_400Regular,
  });
  const ready = useStore((s) => s.ready);
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    if (!useStore.getState().ready) useStore.getState().init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  useAppEffects(ready);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Protected guard={onboarded}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="create" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: colors.transparent } }} />
              <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="habit/[id]/index" />
              <Stack.Screen name="habit/[id]/edit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="habits/paused" />
              <Stack.Screen name="celebrate" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="task/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="task/[id]/index" />
              <Stack.Screen name="task/[id]/edit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings/index" />
              <Stack.Screen name="settings/account" />
              <Stack.Screen name="settings/notifications" />
              <Stack.Screen name="settings/widgets" />
              <Stack.Screen name="settings/help" />
              <Stack.Screen name="flowers" />
            </Stack.Protected>
            <Stack.Protected guard={!onboarded}>
              <Stack.Screen name="onboarding/welcome" />
              <Stack.Screen name="onboarding/notifications" />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
