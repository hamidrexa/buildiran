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

import React from 'react';
import { Platform } from 'react-native';
import type { GameMapProps } from '@/types/map.types';

export type { GameMapProps } from '@/types/map.types';

export const GameMap: React.FC<GameMapProps> = (props) => {
  if (Platform.OS === 'web') {
    const GameMapWeb = require('./GameMap.web').default;
    return <GameMapWeb {...props} />;
  }
  const GameMapNative = require('./GameMap.native').default;
  return <GameMapNative {...props} />;
};

export default GameMap;
