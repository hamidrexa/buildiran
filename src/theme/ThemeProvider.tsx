/**
 * BuildIran — Theme Provider «Gentleman Neon» (v2)
 * Resolves mode (dark / light / system), persists the choice,
 * and cross-fades the app root when the palette swaps.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PALETTES, type Palette, type ThemeMode } from './palettes';
import { Motion } from './tokens';
const STORAGE_KEY = 'buildiran.theme.mode';

interface ThemeContextValue {
  colors: Palette;
  /** Resolved mode — never 'system' */
  isDark: boolean;
  /** Raw user preference */
  preference: ThemeMode;
  setPreference: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: PALETTES.dark,
  isDark: true,
  preference: 'dark',
  setPreference: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPreference = (mode: ThemeMode) => {
    setPreferenceState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  };

  const isDark = preference === 'system' ? systemScheme !== 'light' : preference === 'dark';
  const colors = isDark ? PALETTES.dark : PALETTES.light;

  // Gentle cross-fade when the palette swaps
  const fade = useSharedValue(1);
  const firstRun = React.useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    fade.value = 0.55;
    fade.value = withTiming(1, {
      duration: Motion.durations.normal + 60,
      easing: Easing.out(Easing.quad),
    });
  }, [isDark, loaded, fade]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, preference, setPreference }),
    [colors, isDark, preference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>{children}</Animated.View>
    </ThemeContext.Provider>
  );
};

export type { Palette, ThemeMode };
