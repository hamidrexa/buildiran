/**
 * BuildIran — Root Layout
 * Sets up: RTL (Persian), fonts, safe area, splash screen, dark theme.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Colors } from '@/theme';

// Keep splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Force RTL for Persian language
        if (!I18nManager.isRTL) {
          I18nManager.forceRTL(true);
          // On native, the app will reload after setting RTL.
          // This is normal React Native behavior.
        }

        // Load custom fonts
        await Font.loadAsync({
          Vazirmatn: require('@/assets/fonts/Vazirmatn-Regular.ttf'),
          'Vazirmatn-Medium': require('@/assets/fonts/Vazirmatn-Medium.ttf'),
          'Vazirmatn-SemiBold': require('@/assets/fonts/Vazirmatn-SemiBold.ttf'),
          'Vazirmatn-Bold': require('@/assets/fonts/Vazirmatn-Bold.ttf'),
          'Vazirmatn-ExtraBold': require('@/assets/fonts/Vazirmatn-ExtraBold.ttf'),
        });
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg.primary} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg.primary },
            animation: Platform.OS === 'ios' ? 'default' : 'fade',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
