/**
 * BuildIran — Building Marker (v2 «Gentleman Neon», dual theme)
 * Map overlay marker showing a building/asset on a coordinate tile.
 * Mode-aware ink plate (Midnight rgba(10,12,16,0.92) / Porcelain rgba(255,255,255,0.95))
 * + hairline border + Ionicon per building type.
 * Owned = brass, rival = crimson, selected = brass highlight, boosted = ember, for-sale = brass pricetag.
 * External contract (props + exports) is consumed by GameMap.web.tsx / GameMap.native.tsx — do not change.
 */

import { Radii, Shadows } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { Palette } from "@/theme/palettes";
import { Text } from '@/components/ui/Text';
import type { Asset, Building } from "@/types/game.types";
import { useEconomyStore } from "@/store/useEconomyStore";
import { INSTITUTION_DEFINITIONS } from "@/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    Platform,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
} from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

/** DESIGN.md §4 — building type → Ionicon (no emoji in UI chrome) */
const BUILDING_ICONS: Record<string, IconName> = {
  // Residential — steel family
  house: "home",
  villa: "home-outline",
  main_house: "home",
  resident_house: "home-outline",
  tower: "business",
  // Commercial
  shop: "storefront",
  market: "storefront",
  mall: "cart",
  cafe: "cafe",
  gym: "barbell",
  restaurant: "restaurant",
  exchange: "swap-horizontal",
  office: "briefcase",
  warehouse: "archive",
  // Industrial
  farm: "nutrition",
  factory: "construct",
  // Civic / public
  hospital: "medkit",
  park: "leaf",
  university: "school",
  bank: "cash",
  // Military
  barracks: "shield",
};

/** Institution service → Ionicon (replaces the old instDef.emoji badge) */
const INSTITUTION_ICONS: Record<string, IconName> = {
  home_rent: "home",
  shopping: "cart",
  cafe: "cafe",
  gym: "barbell",
  restaurant: "restaurant",
  exchange: "swap-horizontal",
  mall_service: "cart",
  library: "book",
  hospital: "medkit",
  university: "school",
  bank_service: "cash",
  farm_supply: "nutrition",
  factory_supply: "construct",
  industrial_supply: "cube",
  park_service: "leaf",
};

const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

interface Props {
  asset?: Asset;
  building?: Building;
  isOwned?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

export const BuildingMarker: React.FC<Props> = ({
  asset,
  building,
  isOwned = false,
  isSelected = false,
  onPress,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const type = asset?.type || building?.type || "house";
  const level = asset?.level ?? building?.level ?? 1;
  const isForSale = asset?.isForSale ?? false;
  const icon = BUILDING_ICONS[type] || "business";

  // Economy state
  const isAssetBoosted = useEconomyStore((s) => s.isAssetBoosted);
  const isBoosted = asset ? isAssetBoosted(asset.id) : false;
  const instType = asset?.institutionType;
  const instDef = instType && INSTITUTION_DEFINITIONS[instType as keyof typeof INSTITUTION_DEFINITIONS];
  const instIcon = instType ? (INSTITUTION_ICONS[instType] ?? "business") : null;

  const content = (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      <View
        style={[
          styles.marker,
          isOwned ? styles.owned : styles.otherPlayer,
          isSelected && styles.selectedMarker,
          isForSale && styles.saleMarker,
          isBoosted && styles.boostedMarker,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={isSelected || isOwned ? c.brass[400] : c.crimson}
        />

        {/* Level badge — tiny tabular numeral */}
        {level > 1 && (
          <View
            style={[
              styles.levelBadge,
              isOwned ? styles.levelOwned : styles.levelOther,
              isSelected && styles.levelSelected,
            ]}
          >
            <Text variant="label" weight="bold" color="inverse" style={styles.levelText}>
              {level.toLocaleString("fa-IR")}
            </Text>
          </View>
        )}

        {/* 2x Popularity Boost Badge */}
        {isBoosted && (
          <View style={styles.boostBadge}>
            <Ionicons name="flame" size={10} color={c.ember} />
          </View>
        )}

        {/* Institution Service Badge */}
        {instDef && !isBoosted && instIcon && (
          <View style={styles.instBadge}>
            <Ionicons name={instIcon} size={10} color={c.steel} />
          </View>
        )}

        {/* For sale badge */}
        {isForSale && (
          <View style={styles.saleBadge}>
            <Ionicons name="pricetag" size={10} color={c.text.inverse} />
          </View>
        )}
      </View>

      {/* Pin pointer triangle */}
      <View
        style={[
          styles.arrow,
          isOwned ? styles.arrowOwned : styles.arrowOther,
          isSelected && styles.arrowSelected,
          isForSale && styles.arrowSale,
          isBoosted && styles.arrowBoosted,
        ]}
      />
    </View>
  );

  if (onPress && Platform.OS !== "web") {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const makeStyles = (c: Palette) => {
  // §2 Glass recipe — mode-aware marker plate
  const plate = c.mode === "dark" ? "rgba(10, 12, 16, 0.92)" : "rgba(255, 255, 255, 0.95)";
  return StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer" as any,
    },
    selectedContainer: {
      transform: [{ scale: 1.15 }],
      zIndex: 999,
    },
    marker: {
      width: 40,
      height: 40,
      borderRadius: Radii.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      position: "relative",
      backgroundColor: plate,
      // Neutral elevation only — no colored glows
      ...Shadows.sm,
    },
    owned: {
      borderColor: c.brass[400],
    },
    otherPlayer: {
      borderColor: c.crimson,
    },
    selectedMarker: {
      borderColor: c.brass[300],
      borderWidth: 2.5,
    },
    saleMarker: {
      borderColor: c.brass[400],
    },
    boostedMarker: {
      borderColor: c.ember,
      borderWidth: 2,
    },
    arrow: {
      width: 0,
      height: 0,
      backgroundColor: "transparent",
      borderStyle: "solid",
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: c.crimson,
      marginTop: -1,
    },
    arrowOwned: {
      borderTopColor: c.brass[400],
    },
    arrowOther: {
      borderTopColor: c.crimson,
    },
    arrowSelected: {
      borderTopColor: c.brass[300],
    },
    arrowSale: {
      borderTopColor: c.brass[400],
    },
    arrowBoosted: {
      borderTopColor: c.ember,
    },
    levelBadge: {
      position: "absolute",
      top: -7,
      right: -7,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: plate,
    },
    levelOwned: {
      backgroundColor: c.brass[400],
    },
    levelOther: {
      backgroundColor: c.crimson,
    },
    levelSelected: {
      backgroundColor: c.brass[300],
    },
    levelText: {
      fontSize: 9,
      lineHeight: 12,
      ...tabular,
    },
    boostBadge: {
      position: "absolute",
      top: -7,
      left: -7,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: plate,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.ember,
      ...Shadows.sm,
    },
    instBadge: {
      position: "absolute",
      top: -7,
      left: -7,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: plate,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border.default,
      ...Shadows.sm,
    },
    saleBadge: {
      position: "absolute",
      bottom: -6,
      left: -6,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: c.brass[400],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: plate,
      ...Shadows.sm,
    },
  });
};

export default BuildingMarker;
