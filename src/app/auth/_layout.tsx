/**
 * BuildIran — Auth Layout («Gentleman Neon» v2)
 * Stack navigator for login, register, forgot-password screens.
 * Mode-aware canvas via useTheme — no static palette.
 */

import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export default function AuthLayout() {
  const { colors: c } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "default" : "fade",
        contentStyle: { backgroundColor: c.bg.primary },
      }}
    />
  );
}
