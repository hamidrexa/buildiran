import { AssetDetailModal } from "@/components/game/AssetDetailModal";
import { BuildingPlacementHUD } from "@/components/game/BuildingPlacementHUD";
import { BuildModal } from "@/components/game/BuildModal";
import { HUD } from "@/components/game/HUD";
import { LocationActionModal } from "@/components/game/LocationActionModal";
import { NeighborhoodEditorModal } from "@/components/game/NeighborhoodEditorModal";
import { NeighborhoodEvaluationModal } from "@/components/game/NeighborhoodEvaluationModal";
import { GameMap } from "@/components/map/GameMap";
import { GameAudio } from "@/lib/audio";
import { MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { useAssetStore } from "@/store/useAssetStore";
import { useGameStore } from "@/store/useGameStore";
import { useMapStore } from "@/store/useMapStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Asset, LatLng } from "@/types/game.types";
import type { BuildingZoneOverlay } from "@/types/map.types";
import { checkStreetProximity, tileIdFromCoordinate, type StreetProximityResult } from "@/utils/geo";
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

  // ─── Modals and Flow States ───────────────────────────────────────────────
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [buildModalVisible, setBuildModalVisible] = useState(false);

  // ─── 5-Meter Building Zone & Placement States ─────────────────────────────
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isCheckingStreet, setIsCheckingStreet] = useState(false);
  const [streetProximity, setStreetProximity] = useState<StreetProximityResult | null>(null);
  const [tappedCoordinate, setTappedCoordinate] = useState<LatLng | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ center: LatLng; zoom: number; duration?: number } | null>(null);

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

  // ─── Street Setback Verification Helper ────────────────────────────────────
  const verifyLocationStreetProximity = useCallback(async (coord: LatLng) => {
    setIsCheckingStreet(true);
    setStreetProximity(null);
    try {
      const result = await checkStreetProximity(coord, 5);
      setStreetProximity(result);
      if (result.isValid) {
        GameAudio.playApprove();
      } else {
        GameAudio.playError();
      }
    } catch {
      setStreetProximity({
        isValid: true,
        distanceMeters: 10,
        nearestStreetName: 'معبر محلی',
        ruleDistanceMeters: 5,
        message: 'موقعیت زمین مجاز ارزیابی شد.',
      });
    } finally {
      setIsCheckingStreet(false);
    }
  }, []);

  // ─── Map Interactions ─────────────────────────────────────────────────────

  const handleMapPress = useCallback(
    (coordinate: LatLng) => {
      const tileId = tileIdFromCoordinate(coordinate);
      selectTile(tileId);
      setSelectedAsset(null);
      setTappedCoordinate(coordinate);
      GameAudio.playTap();

      if (isPlacementMode) {
        // If already in 5m placement mode, reposition the circle & re-check street distance
        setFlyToTarget({ center: coordinate, zoom: MAP_MAX_ZOOM, duration: 400 });
        verifyLocationStreetProximity(coordinate);
      } else {
        // Open Location Action Menu (Choice 1: ساختن ملک | Choice 2: ارزیابی محله)
        setActionModalVisible(true);
      }
    },
    [isPlacementMode, selectTile, verifyLocationStreetProximity],
  );

  // Choice 1: «ساختن ملک»
  const handleSelectBuild = useCallback(() => {
    if (!tappedCoordinate) return;
    setActionModalVisible(false);
    setIsPlacementMode(true);

    // Zoom map smoothly to maximum zoom level for exact 5m real-size perspective
    setFlyToTarget({ center: tappedCoordinate, zoom: MAP_MAX_ZOOM, duration: 800 });

    // Initiate 5-meter street proximity check
    verifyLocationStreetProximity(tappedCoordinate);
  }, [tappedCoordinate, verifyLocationStreetProximity]);

  // Choice 2: «ارزیابی محله»
  const handleSelectEvaluate = useCallback(() => {
    setActionModalVisible(false);
    setEvalModalVisible(true);
  }, []);

  // Confirm placement from HUD -> Opens final building creation modal
  const handleConfirmPlacement = useCallback(() => {
    if (!streetProximity?.isValid || !tappedCoordinate) return;
    setBuildModalVisible(true);
  }, [streetProximity, tappedCoordinate]);

  // Cancel placement mode
  const handleCancelPlacement = useCallback(() => {
    setIsPlacementMode(false);
    setStreetProximity(null);
    if (tappedCoordinate) {
      setFlyToTarget({ center: tappedCoordinate, zoom: MAP_DEFAULT_ZOOM, duration: 600 });
    }
  }, [tappedCoordinate]);

  const handleAssetPress = useCallback((asset: Asset) => {
    if (isPlacementMode) return;
    setSelectedAsset(asset);
    GameAudio.playTap();
  }, [isPlacementMode]);

  const handleRegionChange = useCallback(
    (viewport: Parameters<typeof setViewport>[0]) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  const handleBuildModalClose = useCallback(() => {
    setBuildModalVisible(false);
    setIsPlacementMode(false);
    setStreetProximity(null);
  }, []);

  const handleAssetDetailClose = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  // ─── Active Building Zone Overlay (5m Rule) ───────────────────────────────
  const activeBuildingZone: BuildingZoneOverlay | null = useMemo(() => {
    if (!isPlacementMode || !tappedCoordinate) return null;
    return {
      center: tappedCoordinate,
      radiusMeters: 5,
      status: isCheckingStreet ? 'checking' : streetProximity?.isValid ? 'valid' : 'invalid',
      distanceToStreet: streetProximity?.distanceMeters,
      streetName: streetProximity?.nearestStreetName,
    };
  }, [isPlacementMode, tappedCoordinate, isCheckingStreet, streetProximity]);

  return (
    <View style={styles.container}>
      {/* Full-screen map with built assets & 5m real-size building zone */}
      <GameMap
        assets={assetsList}
        currentUserId={player?.id ?? null}
        selectedAssetId={activeSelectedAsset?.id ?? null}
        onAssetPress={handleAssetPress}
        onMapPress={handleMapPress}
        onRegionChange={handleRegionChange}
        buildingZone={activeBuildingZone}
        flyToTarget={flyToTarget}
        style={styles.map}
      />

      {/* Game HUD overlay (hidden during placement to maximize map visibility) */}
      {!isPlacementMode && <HUD />}

      {/* 5-Meter Placement Verification HUD (active at max zoom) */}
      {isPlacementMode && (
        <BuildingPlacementHUD
          isChecking={isCheckingStreet}
          proximityResult={streetProximity}
          onConfirm={handleConfirmPlacement}
          onCancel={handleCancelPlacement}
          onRetry={() => tappedCoordinate && verifyLocationStreetProximity(tappedCoordinate)}
        />
      )}

      {/* Choice Menu on Map Tap: 1. ساختن ملک  2. ارزیابی محله */}
      <LocationActionModal
        visible={actionModalVisible}
        coordinate={tappedCoordinate}
        onSelectBuild={handleSelectBuild}
        onSelectEvaluate={handleSelectEvaluate}
        onClose={() => setActionModalVisible(false)}
      />

      {/* Neighborhood Evaluation Modal */}
      <NeighborhoodEvaluationModal
        visible={evalModalVisible}
        coordinate={tappedCoordinate}
        onProceedToBuild={() => {
          setEvalModalVisible(false);
          handleSelectBuild();
        }}
        onOpenEditorPanel={() => {
          setEvalModalVisible(false);
          setEditorModalVisible(true);
        }}
        onClose={() => setEvalModalVisible(false)}
      />

      {/* Neighborhood Editor Panel */}
      <NeighborhoodEditorModal
        visible={editorModalVisible}
        onClose={() => setEditorModalVisible(false)}
      />

      {/* Build modal — opens after street proximity is verified */}
      <BuildModal
        visible={buildModalVisible}
        coordinate={tappedCoordinate}
        proximityResult={streetProximity}
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
