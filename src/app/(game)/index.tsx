/**
 * BuildIran — Main Map Screen
 * Core game screen: full-screen map + HUD overlay + BuildModal.
 * Now integrated with Supabase auth and asset system.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GameMap } from '@/components/map/GameMap';
import { HUD } from '@/components/game/HUD';
import { BuildModal } from '@/components/game/BuildModal';
import { useGameStore } from '@/store/useGameStore';
import { useMapStore } from '@/store/useMapStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useAssetStore } from '@/store/useAssetStore';
import type { LatLng } from '@/types/game.types';
import { tileIdFromCoordinate } from '@/utils/geo';
import { supabase } from '@/lib/supabase';
import { GameAudio } from '@/lib/audio';

export default function MapScreen() {
  const selectTile = useGameStore((s) => s.selectTile);
  const setViewport = useMapStore((s) => s.setViewport);
  const syncFromSupabase = usePlayerStore((s) => s.syncFromSupabase);
  const fetchAllAssets = useAssetStore((s) => s.fetchAllAssets);

  const [buildModalVisible, setBuildModalVisible] = useState(false);
  const [tappedCoordinate, setTappedCoordinate] = useState<LatLng | null>(null);

  // ─── Auth check + player/asset load ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (!session) {
        // Not authenticated — redirect to login
        router.replace('/auth/login' as any);
        return;
      }

      // Load real player data from Supabase
      await syncFromSupabase(session.user.id);
      // Load all map assets
      await fetchAllAssets();
    });

    return () => { mounted = false; };
  }, [syncFromSupabase, fetchAllAssets]);

  // ─── Map Interactions ─────────────────────────────────────────────────────

  const handleMapPress = useCallback(
    (coordinate: LatLng) => {
      const tileId = tileIdFromCoordinate(coordinate);
      selectTile(tileId);
      setTappedCoordinate(coordinate);
      setBuildModalVisible(true);
      GameAudio.playTap();
    },
    [selectTile],
  );

  const handleRegionChange = useCallback(
    (viewport: Parameters<typeof setViewport>[0]) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  const handleBuildModalClose = useCallback(() => {
    setBuildModalVisible(false);
  }, []);

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

      {/* Build modal — opens on map tap */}
      <BuildModal
        visible={buildModalVisible}
        coordinate={tappedCoordinate}
        onClose={handleBuildModalClose}
      />
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
