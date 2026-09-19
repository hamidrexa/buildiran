/**
 * BuildIran — HUD (Heads-Up Display)
 * Floating overlay: resource bar + 4-factor stats (Power, Wealth, Activity, Popularity)
 * + Neighborhood indicator & Neighborhood Editor Panel trigger for high-power players.
 */

import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { getPlayerTier } from "@/lib/constants";
import { useStatBarFill } from "@/lib/effects";
import { useEconomyStore } from "@/store/useEconomyStore";
import { useGameStore } from "@/store/useGameStore";
import { useNeighborhoodStore } from "@/store/useNeighborhoodStore";
import { useNpcStore } from "@/store/useNpcStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useMissionStore } from "@/store/useMissionStore";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/utils/geo";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NeighborhoodEditorModal } from "./NeighborhoodEditorModal";
import { NeighborhoodDetailModal } from "./NeighborhoodDetailModal";
import { NeighborhoodAmenityCard } from "./NeighborhoodAmenityCard";
import { MissionsPanel } from "./MissionsPanel";
import { CareerSelectionModal } from "./CareerSelectionModal";
import { CAREER_PATHS } from "@/lib/careers";
import { NEIGHBORHOOD_DRIP_COOLDOWN_SECONDS } from "@/lib/constants";
import { Ionicons } from "@expo/vector-icons";


// ─── 4-Factor Stat Bar ────────────────────────────────────────────────────────

const StatBar: React.FC<{
  icon: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay?: number;
}> = ({ icon, label, value, maxValue, color, delay = 0 }) => {
  const pct = Math.min((value / maxValue) * 100, 100);
  const { style: barStyle } = useStatBarFill(pct, delay);

  return (
    <View style={statStyles.statRow}>
      <Text variant="body" color="primary">
        {icon}
      </Text>
      <View style={statStyles.statBarBg}>
        <Animated.View
          style={[statStyles.statBarFill, { backgroundColor: color }, barStyle]}
        />
      </View>
      <Text variant="caption" color="primary">
        {value.toLocaleString("fa-IR")}
      </Text>
    </View>
  );
};

// ─── Resource Chip ────────────────────────────────────────────────────────────

const ResourceChip: React.FC<{
  icon: string;
  value: number;
  color?: string;
}> = ({ icon, value, color = "#FFFFFF" }) => (
  <View style={chipStyles.chip}>
    <Text variant="body" color="primary">
      {icon}
    </Text>
    <Text variant="caption" color="primary">
      {value.toLocaleString("fa-IR")}
    </Text>
  </View>
);

// ─── HUD ──────────────────────────────────────────────────────────────────────

export const HUD: React.FC = () => {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const selectedTileId = useGameStore((s) => s.selectedTileId);
  const tiles = useGameStore((s) => s.tiles);
  const claimableCount = useMissionStore((s) => s.claimableCount);
  
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const neighborhoods = useNeighborhoodStore((s) => s.neighborhoods);
  
  const mapCenter = useMapStore((s) => s.viewport.center);
  
  const activeBoosts = useEconomyStore((s) => s.activeBoosts);
  const activeNpcCount = useNpcStore(
    (s) => Object.values(s.npcs).filter((n) => n.isWorking).length,
  );

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMissionsPanel, setShowMissionsPanel] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [isClaimingDrip, setIsClaimingDrip] = useState(false);

  const selectedTile = selectedTileId ? tiles[selectedTileId] : null;

  // Calculate the neighborhood currently closest to the map center
  const viewedNeighborhood = React.useMemo(() => {
    if (!neighborhoods || neighborhoods.length === 0) return null;
    let minDistance = Infinity;
    let closest = null;
    for (const nb of neighborhoods) {
      if (!nb.centerLat || !nb.centerLng) continue;
      const d = haversineDistance(mapCenter, { latitude: nb.centerLat, longitude: nb.centerLng });
      if (d < minDistance) {
        minDistance = d;
        closest = nb;
      }
    }
    return closest;
  }, [mapCenter, neighborhoods]);

  if (!player) return null;

  const tier = getPlayerTier(player.power ?? 0);
  const hasAnyBoost = Object.values(activeBoosts).some(
    (b) => b.ownerId === player.id && new Date(b.expiresAt) > new Date(),
  );

  const careerTheme = CAREER_PATHS[player.careerPath] || CAREER_PATHS.citizen;

  // Record neighborhood visit for location-based missions
  React.useEffect(() => {
    if (viewedNeighborhood?.id) {
      useMissionStore.getState().recordNeighborhoodVisit(viewedNeighborhood.id);
    }
  }, [viewedNeighborhood?.id]);

  const isEditor = currentNeighborhood
    ? player.power >= currentNeighborhood.minEditorPower
    : player.power >= 150;

  // Evaluate daily drip claim eligibility
  const canClaimDrip = player.lastNeighborhoodDripAt
    ? (new Date().getTime() - new Date(player.lastNeighborhoodDripAt).getTime()) / 1000 > NEIGHBORHOOD_DRIP_COOLDOWN_SECONDS
    : true; // can claim if never claimed

  const handleClaimDrip = async () => {
    if (isClaimingDrip) return;
    setIsClaimingDrip(true);
    const result = await usePlayerStore.getState().claimNeighborhoodDrip();
    setIsClaimingDrip(false);

    if (result?.success) {
      if ((result.dripTotal ?? 0) > 0) {
        GameAudio.playApprove();
        // Optional: show a toast or alert here for feedback
      }
    }
  };

  return (
    <>
      {/* Sub-bar: Neighborhood & Editor Panel Access */}
      <View style={[styles.subBar, { top: insets.top + 68 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <TouchableOpacity
            style={styles.modernNbBox}
            onPress={() => {
              GameAudio.playTap();
              if (viewedNeighborhood) {
                // Sync the detail modal with the viewed neighborhood
                useNeighborhoodStore.getState().setCurrentNeighborhood(viewedNeighborhood);
              }
              setShowDetailModal(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(22, 28, 45, 0.95)", "rgba(10, 15, 30, 0.85)"]}
              style={styles.modernNbBoxInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modernNbBoxIcon}>
                <Ionicons name="map" size={16} color="#34D399" />
              </View>
              <View style={styles.modernNbBoxTextContainer}>
                <Text variant="caption" color="secondary" style={{ fontSize: 9, opacity: 0.7, marginBottom: -2 }}>
                  محله در حال نمایش
                </Text>
                <Text variant="body" weight="bold" color="primary" style={{ fontSize: 13 }}>
                  {viewedNeighborhood?.nameFa ?? "نقشه آزاد"}
                </Text>
              </View>
              <View style={styles.modernNbBoxAction}>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {viewedNeighborhood && viewedNeighborhood.amenityTier !== undefined && viewedNeighborhood.amenityTier > 0 && (
            <NeighborhoodAmenityCard neighborhood={viewedNeighborhood} compact />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Career Path Button */}
          <TouchableOpacity
            style={[styles.missionsBtn, { borderColor: careerTheme.color }]}
            onPress={() => {
              GameAudio.playTap();
              setShowCareerModal(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(22, 28, 45, 0.95)", "rgba(10, 15, 30, 0.85)"]}
              style={styles.missionsBtnInner}
            >
              <Text style={{ fontSize: 16 }}>{careerTheme.icon}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Missions Button */}
          <TouchableOpacity
            style={styles.missionsBtn}
            onPress={() => {
              GameAudio.playTap();
              setShowMissionsPanel(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(22, 28, 45, 0.95)", "rgba(10, 15, 30, 0.85)"]}
              style={styles.missionsBtnInner}
            >
              <Text style={{ fontSize: 16 }}>🎯</Text>
              {claimableCount > 0 && (
                <View style={styles.missionsBadge}>
                  <Text variant="caption" weight="bold" color="inverse" style={{ fontSize: 10 }}>
                    {claimableCount}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {canClaimDrip && (
            <TouchableOpacity
              style={styles.claimDripBtn}
              onPress={handleClaimDrip}
              activeOpacity={0.8}
              disabled={isClaimingDrip}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.editorPillGradient}
              >
                <Text variant="body" weight="bold" color="inverse">
                  {isClaimingDrip ? "..." : "⚡ پاداش محله"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {isEditor && (
            <TouchableOpacity
              style={styles.editorPill}
              onPress={() => {
                GameAudio.playTap();
                setShowEditorModal(true);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.editorPillGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text variant="body" weight="semibold" color="inverse">
                  🎖️ ویرایشگر
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Right side: 4-Factor Stats Panel */}
      <View style={[styles.statsPanel, { top: insets.top + 112 }]}>
        <LinearGradient
          colors={["rgba(8,12,26,0.9)", "rgba(13,21,51,0.85)"]}
          style={styles.statsPanelInner}
        >
          <StatBar
            icon="⚔️"
            label="قدرت"
            value={player.power ?? 0}
            maxValue={500}
            color="#A78BFA"
            delay={0}
          />
          <StatBar
            icon="💰"
            label="ثروت"
            value={Math.min(player.wealth ?? 0, 999999)}
            maxValue={100000}
            color="#FFD700"
            delay={100}
          />
          <StatBar
            icon="🔥"
            label="فعالیت"
            value={player.activity ?? 0}
            maxValue={100}
            color="#FB923C"
            delay={200}
          />
          <StatBar
            icon="⭐"
            label="محبوبیت"
            value={player.popularity ?? 0}
            maxValue={200}
            color="#34D399"
            delay={300}
          />
        </LinearGradient>
      </View>

      {/* Bottom: Selected Tile Info */}
      {selectedTile && (
        <View style={[styles.tilePanel, { bottom: insets.bottom + 76 }]}>
          <LinearGradient
            colors={["rgba(8,12,26,0.95)", "rgba(13,21,51,0.9)"]}
            style={styles.tilePanelInner}
          >
            <Text variant="body" color="primary">
              {selectedTile.status === "available"
                ? "🟢 زمین آزاد — ضربه بزنید تا بسازید"
                : selectedTile.status === "owned"
                  ? "🟡 قلمرو شما"
                  : "🔴 قلمرو بازیکن دیگر"}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {selectedTile.id}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Neighborhood Editor Review Modal */}
      {/* Neighborhood Detail Modal */}
      <NeighborhoodDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <NeighborhoodEditorModal
        visible={showEditorModal}
        onClose={() => setShowEditorModal(false)}
      />

      <CareerSelectionModal
        visible={showCareerModal}
        onClose={() => setShowCareerModal(false)}
      />

      <MissionsPanel
        visible={showMissionsPanel}
        onClose={() => setShowMissionsPanel(false)}
      />
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    shadowColor: "#6C63FF",
    shadowRadius: 12,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  playerBadge: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  playerInfo: { flex: 1 },
  playerName: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  playerLevel: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
  resourceChips: { flexDirection: "row", gap: 12, alignItems: "center" },

  subBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  neighborhoodPill: {
    backgroundColor: "rgba(8,12,26,0.85)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.25)",
  },
  neighborhoodText: { color: "#CBD5E1", fontSize: 11, fontWeight: "700" },

  editorPill: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  claimDripBtn: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  editorPillGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editorPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },

  missionsBtn: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  missionsBtnInner: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },


  // Tier badge under player name
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    alignSelf: "flex-start",
    marginTop: 2,
  },

  // 2× boost active indicator chip
  boostChip: {
    backgroundColor: "rgba(251,146,60,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.4)",
  },
  modernNbBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modernNbBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  modernNbBoxIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  modernNbBoxTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  modernNbBoxAction: {
    marginLeft: 'auto',
    opacity: 0.8,
    paddingLeft: 4,
  },

  statsPanel: {
    position: "absolute",
    right: 12,
    zIndex: 10,
    width: 135,
  },
  statsPanelInner: {
    borderRadius: 14,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },

  tilePanel: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
  },
  tilePanelInner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    gap: 4,
  },
  tileStatus: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  tileId: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
});

const statStyles = StyleSheet.create({
  statRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statIcon: { fontSize: 12 },
  statBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: { height: "100%", borderRadius: 3 },
  statValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    minWidth: 26,
    textAlign: "right",
  },
});

const chipStyles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 4 },
  icon: { fontSize: 15 },
  value: { fontSize: 13, fontWeight: "700" },
});
