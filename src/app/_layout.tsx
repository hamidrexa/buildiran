/**
 * BuildIran — Root Layout
 * Theme provider (dark/light), RTL (Persian), safe area, splash, fonts.
 */

import { ThemeProvider, useTheme } from "@/theme";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from 'expo-font';

// Keep splash screen visible while loading initial state
SplashScreen.preventAutoHideAsync().catch(() => {});

// Offline map ambient cache setup moved to offlineTileManager.ts

// Web needs the document direction set before first render — I18nManager
// flags alone don't flip CSS layout there. Native handles RTL via
// I18nManager.forceRTL in the effect below.
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "fa");
}

function Shell() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: Platform.OS === "ios" ? "default" : "fade",
        }}
      />
      {Platform.OS === "web" && <Analytics />}
      {Platform.OS === "web" && <SpeedInsights />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Vazirmatn: require("../../assets/fonts/Vazirmatn-Regular.ttf"),
    VazirmatnMedium: require("../../assets/fonts/Vazirmatn-Medium.ttf"),
    "Vazirmatn-SemiBold": require("../../assets/fonts/Vazirmatn-SemiBold.ttf"),
    VazirmatnBold: require("../../assets/fonts/Vazirmatn-Bold.ttf"),
    "Vazirmatn-ExtraBold": require("../../assets/fonts/Vazirmatn-ExtraBold.ttf"),
    "Vazirmatn-Light": require("../../assets/fonts/Vazirmatn-Light.ttf"),
    "Vazirmatn-Black": require("../../assets/fonts/Vazirmatn-Black.ttf"),
  });

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

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Shell />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
