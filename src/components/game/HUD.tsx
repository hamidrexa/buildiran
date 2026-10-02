/**
 * BuildIran — HUD (Heads-Up Display) — «Gentleman Neon» (v2.1)
 * Non-overlapping map chrome, arranged for thumb reach:
 *
 *   Row 1 (top)   [محله pill · amenity]        [career plate][missions plate]
 *   Row 2         [amenity card]               [4-factor stats panel]
 *   Bottom stack  [پاداش محله (neon) · editor]  ← live actions, thumb zone
 *                 [selected-tile bar]
 *                 [floating dock]
 *
 * Design: dual-theme glass recipe (§2), neon mint reserved for the one live
 * signal (§1). Press springs on every touchable (§4). All game logic, store
 * wiring and modal contracts unchanged.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconPlate } from "@/components/ui/IconPlate";
import { StatBar } from "@/components/ui/StatBar";
import { Text } from "@/components/ui/Text";
import { Motion, Radii, Shadows, Spacing, Typography } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { useGlowPulse } from "@/lib/effects";
import { GameAudio } from "@/lib/audio";
import {
  NEIGHBORHOOD_DRIP_COOLDOWN_SECONDS,
  getPlayerTier,
} from "@/lib/constants";
import { useEconomyStore } from "@/store/useEconomyStore";
import { useGameStore } from "@/store/useGameStore";
import { useNeighborhoodStore } from "@/store/useNeighborhoodStore";
import { useNpcStore } from "@/store/useNpcStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useMissionStore } from "@/store/useMissionStore";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/utils/geo";
import { CAREER_PATHS } from "@/lib/careers";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NeighborhoodEditorModal } from "./NeighborhoodEditorModal";
import { NeighborhoodDetailModal } from "./NeighborhoodDetailModal";
import { NeighborhoodAmenityCard } from "./NeighborhoodAmenityCard";
import { MissionsPanel } from "./MissionsPanel";
import { CareerSelectionModal } from "./CareerSelectionModal";

// ─── Press-spring touchable (§4 — every touchable springs) ───────────────────

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TouchableScale: React.FC<
  React.ComponentProps<typeof TouchableOpacity>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchable
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, Motion.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Motion.press);
        onPressOut?.(e);
      }}
    />
  );
};

// ─── Career plate (tinted with the career's own color from careers.ts) ───────

const CareerPlate: React.FC<{ color: string }> = ({ color }) => (
  <View
    style={{
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${color}22`,
      borderWidth: 1,
      borderColor: `${color}3D`,
    }}
  >
    <Ionicons name="ribbon" size={17} color={color} />
  </View>
);

// ─── HUD ──────────────────────────────────────────────────────────────────────

export const HUD: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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

  // §4 — the ONLY looping animation on this screen: claimable CTA glow pulse
  const claimPulse = useGlowPulse(0.75, 1);

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

  // Record neighborhood visit for location-based missions.
  // This hook must run before the player guard so the hook order is stable
  // while the player store is hydrating on web production builds.
  React.useEffect(() => {
    if (viewedNeighborhood?.id) {
      useMissionStore.getState().recordNeighborhoodVisit(viewedNeighborhood.id);
    }
  }, [viewedNeighborhood?.id]);

  if (!player) return null;

  const tier = getPlayerTier(player.power ?? 0);
  const hasAnyBoost = Object.values(activeBoosts).some(
    (b) => b.ownerId === player.id && new Date(b.expiresAt) > new Date(),
  );

  const careerTheme = CAREER_PATHS[player.careerPath] || CAREER_PATHS.citizen;

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

  // Selected-tile status visual (available jade / owned brass / rival crimson)
  const tileStatus: {
    icon: "ellipse" | "shield" | "close-circle";
    color: string;
    text: string;
  } =
    selectedTile?.status === "available"
      ? {
          icon: "ellipse",
          color: c.jade,
          text: "زمین آزاد — ضربه بزنید تا بسازید",
        }
      : selectedTile?.status === "owned"
        ? { icon: "shield", color: c.brass[400], text: "قلمرو شما" }
        : { icon: "close-circle", color: c.crimson, text: "قلمرو بازیکن دیگر" };

  const hasBottomPills = canClaimDrip || isEditor;

  return (
    <>
      {/* Row 1 — neighborhood pill (start) · career + missions plates (end) */}
      <View style={[styles.rowOne, { top: insets.top + 8 }]}>
        <TouchableScale
          style={styles.hoodPill}
          onPress={() => {
            GameAudio.playTap();
            if (viewedNeighborhood) {
              // Sync the detail modal with the viewed neighborhood
              useNeighborhoodStore.getState().setCurrentNeighborhood(viewedNeighborhood);
            }
            setShowDetailModal(true);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="جزئیات محله در حال نمایش"
        >
          <IconPlate name="map" tone="jade" size="xs" />
          <View style={styles.hoodTexts}>
            <Text variant="caption" color="muted" style={styles.hoodKicker}>
              محله در حال نمایش
            </Text>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {viewedNeighborhood?.nameFa ?? "نقشه آزاد"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={c.text.muted} />
        </TouchableScale>

        <View style={styles.plates}>
          {/* Career path plate — tinted with the career color from careers.ts */}
          <TouchableScale
            style={styles.iconBtn}
            onPress={() => {
              GameAudio.playTap();
              setShowCareerModal(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`مسیر شغلی: ${careerTheme.nameFa}`}
          >
            <CareerPlate color={careerTheme.color} />
          </TouchableScale>

          {/* Missions plate with claimable badge (neon = live signal) */}
          <TouchableScale
            style={styles.iconBtn}
            onPress={() => {
              GameAudio.playTap();
              setShowMissionsPanel(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="ماموریت‌ها"
          >
            <IconPlate name="flag" tone="brass" size="sm" />
            <Badge count={claimableCount} style={styles.plateBadge} />
          </TouchableScale>
        </View>
      </View>

      {/* Row 2 — amenity card (start) · 4-factor stats panel (end) */}
      <View pointerEvents="box-none" style={[styles.rowTwo, { top: insets.top + 62 }]}>
        {viewedNeighborhood && viewedNeighborhood.amenityTier !== undefined && viewedNeighborhood.amenityTier > 0 && (
          <NeighborhoodAmenityCard neighborhood={viewedNeighborhood} compact />
        )}
        <View style={styles.statsPanel}>
          <StatBar
            icon="flash"
            label="قدرت"
            value={player.power ?? 0}
            maxValue={500}
            tone="power"
            delay={0}
            compact
          />
          <StatBar
            icon="cash"
            label="ثروت"
            value={Math.min(player.wealth ?? 0, 999999)}
            maxValue={100000}
            tone="wealth"
            delay={100}
            compact
          />
          <StatBar
            icon="flame"
            label="فعالیت"
            value={player.activity ?? 0}
            maxValue={100}
            tone="activity"
            delay={200}
            compact
          />
          <StatBar
            icon="star"
            label="محبوبیت"
            value={player.popularity ?? 0}
            maxValue={200}
            tone="popularity"
            delay={300}
            compact
          />
        </View>
      </View>

      {/* Bottom stack — live action pills above the selected-tile bar,
          both clear of the floating dock */}
      {(selectedTile || hasBottomPills) && (
        <View
          pointerEvents="box-none"
          style={[styles.bottomStack, { bottom: insets.bottom + 78 }]}
        >
          {hasBottomPills && (
            <View style={styles.pillRow}>
              {/* §1 — THE one neon moment: claimable daily neighborhood drip */}
              {canClaimDrip && (
                <Animated.View style={claimPulse.style}>
                  <Button
                    label="پاداش محله"
                    variant="neon"
                    size="sm"
                    icon={<Ionicons name="flash" size={13} color={c.text.inverse} />}
                    onPress={handleClaimDrip}
                    disabled={isClaimingDrip}
                    loading={isClaimingDrip}
                  />
                </Animated.View>
              )}

              {/* Conditional editor access — brass-bordered secondary pill */}
              {isEditor && (
                <TouchableScale
                  style={[styles.pill, styles.pillBrass]}
                  onPress={() => {
                    GameAudio.playTap();
                    setShowEditorModal(true);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="پنل ویرایشگر محله"
                >
                  <Ionicons name="shield" size={14} color={c.brass[400]} />
                  <Text variant="caption" weight="semibold" style={styles.pillTextBrass}>
                    ویرایشگر
                  </Text>
                </TouchableScale>
              )}
            </View>
          )}

          {selectedTile && (
            <Animated.View
              entering={FadeInDown.springify().damping(18)}
              style={styles.tilePanelInner}
            >
              <View style={styles.tileStatusRow}>
                <Ionicons name={tileStatus.icon} size={15} color={tileStatus.color} />
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  {tileStatus.text}
                </Text>
              </View>
              <Text variant="caption" color="muted" numberOfLines={1} style={styles.tileId}>
                {selectedTile.id}
              </Text>
            </Animated.View>
          )}
        </View>
      )}

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

// ─── Styles (colors via palette; glass is mode-aware per §2) ─────────────────

const makeStyles = (c: ReturnType<typeof useTheme>["colors"]) => {
  const glass = {
    backgroundColor:
      c.mode === "dark" ? "rgba(10, 12, 16, 0.88)" : "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: c.border.subtle,
    borderRadius: Radii.lg,
  };

  return StyleSheet.create({
    // Row 1 — pill start · plates end
    rowOne: {
      position: "absolute",
      start: Spacing.md,
      end: Spacing.md,
      zIndex: 9,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    hoodPill: {
      ...glass,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexShrink: 1,
      maxWidth: 230,
      ...Shadows.md,
    },
    hoodTexts: {
      flexShrink: 1,
      gap: 1,
    },
    hoodKicker: {
      fontSize: Typography.sizes.xs,
    },
    plates: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    iconBtn: {
      ...glass,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.md,
    },
    plateBadge: {
      position: "absolute",
      top: -4,
      end: -4,
    },

    // Row 2 — amenity (start) · stats panel (end)
    rowTwo: {
      position: "absolute",
      start: Spacing.md,
      end: Spacing.md,
      zIndex: 9,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: Spacing.sm,
      pointerEvents: "box-none",
    },
    statsPanel: {
      width: 152,
      ...glass,
      padding: Spacing.md,
      gap: Spacing.sm + 2,
      ...Shadows.md,
    },

    // Bottom stack — pills row + tile bar, above the dock
    bottomStack: {
      position: "absolute",
      start: Spacing.md,
      end: Spacing.md,
      zIndex: 10,
      gap: Spacing.sm,
      pointerEvents: "box-none",
    },
    pillRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: Spacing.sm,
    },
    pill: {
      ...glass,
      borderRadius: Radii.full,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
    },
    pillBrass: {
      borderColor: c.border.brand,
    },
    pillTextBrass: {
      color: c.brass[400],
    },

    // Selected tile bar
    tilePanelInner: {
      ...glass,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.xxs,
      ...Shadows.md,
    },
    tileStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    tileId: {
      writingDirection: "ltr",
    },
  });
};
