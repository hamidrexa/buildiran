/**
 * BuildIran — Main Map Screen
 * The core game screen: full-screen map with HUD overlay.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameMap } from '@/components/map/GameMap';
import { HUD } from '@/components/game/HUD';
import { useGameStore } from '@/store/useGameStore';
import { useMapStore } from '@/store/useMapStore';
import type { LatLng } from '@/types/game.types';
import { tileIdFromCoordinate } from '@/utils/geo';

export default function MapScreen() {
  const selectTile = useGameStore((s) => s.selectTile);
  const setViewport = useMapStore((s) => s.setViewport);

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
        style={StyleSheet.absoluteFillObject}
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
});
