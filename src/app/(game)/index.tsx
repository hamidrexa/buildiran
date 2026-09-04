import { AssetDetailModal } from "@/components/game/AssetDetailModal";
import { BuildModal } from "@/components/game/BuildModal";
import { HUD } from "@/components/game/HUD";
import { GameMap } from "@/components/map/GameMap";
import { GameAudio } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { useAssetStore } from "@/store/useAssetStore";
import { useGameStore } from "@/store/useGameStore";
import { useMapStore } from "@/store/useMapStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Asset, LatLng } from "@/types/game.types";
import { tileIdFromCoordinate } from "@/utils/geo";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function MapScreen() {
  const selectTile = useGameStore((s) => s.selectTile);
  const setViewport = useMapStore((s) => s.setViewport);
  const syncFromSupabase = usePlayerStore((s) => s.syncFromSupabase);
  const player = usePlayerStore((s) => s.player);
  const assetsMap = useAssetStore((s) => s.assets);
  const fetchAllAssets = useAssetStore((s) => s.fetchAllAssets);
  const fetchListings = useAssetStore((s) => s.fetchListings);
  const subscribeToAssets = useAssetStore((s) => s.subscribeToAssets);

  const [buildModalVisible, setBuildModalVisible] = useState(false);
  const [tappedCoordinate, setTappedCoordinate] = useState<LatLng | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const assetsList = useMemo(() => Object.values(assetsMap), [assetsMap]);

  // Keep selectedAsset synced if its data changes in store
  const activeSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    return assetsMap[selectedAsset.id] ?? selectedAsset;
  }, [selectedAsset, assetsMap]);

  // ─── Auth check + player/asset load & realtime sync ───────────────────────
  useEffect(() => {
    let mounted = true;
    let unsubscribeAssets: (() => void) | null = null;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (!session) {
        // Not authenticated — redirect to login
        router.replace("/auth/login" as any);
        return;
      }

      // Load real player data from Supabase
      await syncFromSupabase(session.user.id);
      // Load all map assets & active marketplace listings
      await fetchAllAssets();
      await fetchListings();

      // Subscribe to live changes
      unsubscribeAssets = subscribeToAssets();
    });

    return () => {
      mounted = false;
      if (unsubscribeAssets) unsubscribeAssets();
    };
  }, [syncFromSupabase, fetchAllAssets, fetchListings, subscribeToAssets]);

  // ─── Map Interactions ─────────────────────────────────────────────────────

  const handleMapPress = useCallback(
    (coordinate: LatLng) => {
      const tileId = tileIdFromCoordinate(coordinate);
      selectTile(tileId);
      setTappedCoordinate(coordinate);
      setSelectedAsset(null);
      setBuildModalVisible(true);
      GameAudio.playTap();
    },
    [selectTile],
  );

  const handleAssetPress = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    GameAudio.playTap();
  }, []);

  const handleRegionChange = useCallback(
    (viewport: Parameters<typeof setViewport>[0]) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  const handleBuildModalClose = useCallback(() => {
    setBuildModalVisible(false);
  }, []);

  const handleAssetDetailClose = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen map with built assets */}
      <GameMap
        assets={assetsList}
        currentUserId={player?.id ?? null}
        selectedAssetId={activeSelectedAsset?.id ?? null}
        onAssetPress={handleAssetPress}
        onMapPress={handleMapPress}
        onRegionChange={handleRegionChange}
        style={styles.map}
      />

      {/* Game HUD overlay */}
      <HUD />

      {/* Build modal — opens on empty map tile tap */}
      <BuildModal
        visible={buildModalVisible}
        coordinate={tappedCoordinate}
        onClose={handleBuildModalClose}
      />

      {/* Asset Detail modal — opens when tapping an existing building marker */}
      <AssetDetailModal
        asset={activeSelectedAsset}
        visible={!!activeSelectedAsset}
        onClose={handleAssetDetailClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
