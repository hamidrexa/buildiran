/**
 * BuildIran — GameMap (Platform-Adaptive Wrapper)
 *
 * This file is the shared TypeScript interface for the map component.
 * Metro bundler resolves:
 *   - GameMap.native.tsx  → iOS + Android
 *   - GameMap.web.tsx     → Web
 *
 * Consumer usage (no platform code needed):
 *   import { GameMap } from '@/components/map/GameMap';
 */

import Constants from 'expo-constants';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { GameMapProps } from '@/types/map.types';

export type { GameMapProps } from '@/types/map.types';

// MapLibre links `MLRNCameraModule`, which only exists in a custom
// development build or production binary. When the app is running inside
// Expo Go we render a friendly fallback instead of requiring the native
// module, so the rest of the UI keeps working.
function isExpoGo(): boolean {
  const c = Constants as unknown as {
    appOwnership?: string;
    executionEnvironment?: string;
  };
  if (c.appOwnership) return c.appOwnership === 'expo';
  return c.executionEnvironment === 'expo';
}

const MapUnavailable: React.FC = () => (
  <View style={fallbackStyles.container}>
    <Text style={fallbackStyles.text}>
      نقشه در نسخه آزمایشی موبایل در دسترس نیست. برای استفاده از نقشه، یک
      Development Build بسازید.
    </Text>
  </View>
);

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0B0B0B',
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
});

export const GameMap: React.FC<GameMapProps> = (props) => {
  if (Platform.OS === 'web') {
    const GameMapWeb = require('./GameMap.web').default;
    return <GameMapWeb {...props} />;
  }
  if (isExpoGo()) {
    return <MapUnavailable />;
  }
  const GameMapNative = require('./GameMap.native').default;
  return <GameMapNative {...props} />;
};

export default GameMap;
