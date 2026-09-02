/**
 * BuildIran — Main Map Screen
 * The core game screen: full-screen map with HUD overlay.
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameMap } from '@/components/map/GameMap';
import { HUD } from '@/components/game/HUD';
import { useGameStore } from '@/store/useGameStore';
import { useMapStore } from '@/store/useMapStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { LatLng } from '@/types/game.types';
import { tileIdFromCoordinate } from '@/utils/geo';

export default function MapScreen() {
  const selectTile = useGameStore((s) => s.selectTile);
  const setViewport = useMapStore((s) => s.setViewport);
  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  // Initialize a mock player profile if none exists
  useEffect(() => {
    if (!player) {
      setPlayer({
        id: 'player_guest',
        username: 'فرمانده',
        avatarUrl: null,
        level: 1,
        experience: 250,
        resources: {
          gold: 1500,
          food: 800,
          wood: 600,
          stone: 350,
          population: 25,
        },
        ownedTileIds: [],
        buildingIds: [],
        score: 100,
        rank: 99,
        status: 'online',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      });
    }
  }, [player, setPlayer]);

  const handleMapPress = useCallback(
    (coordinate: LatLng) => {
      const tileId = tileIdFromCoordinate(coordinate);
      selectTile(tileId);
    },
    [selectTile],
  );

  const handleRegionChange = useCallback(
    (viewport: Parameters<typeof setViewport>[0]) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <GameMap
        onMapPress={handleMapPress}
        onRegionChange={handleRegionChange}
        style={styles.map}
      />

      {/* Game HUD overlay */}
      <HUD />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
