/**
 * BuildIran — Root Layout
 * Sets up: RTL (Persian), safe area, splash screen, dark theme.
 */

import { Colors } from "@/theme";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep splash screen visible while loading initial state
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Force RTL for Persian language
        if (!I18nManager.isRTL) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(true);
        }
      } catch (e) {
        console.warn("RTL initialization error:", e);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg.primary },
            animation: Platform.OS === "ios" ? "default" : "fade",
          }}
        />
        {Platform.OS === "web" && <Analytics />}
        {Platform.OS === "web" && <SpeedInsights />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
