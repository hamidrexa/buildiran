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

export type { GameMapProps } from '@/types/map.types';

/**
 * Re-export the platform implementation.
 * The actual component is in GameMap.native.tsx / GameMap.web.tsx
 */
export { default as GameMap } from './GameMap.native';
