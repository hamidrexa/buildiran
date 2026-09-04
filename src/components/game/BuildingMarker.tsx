/**
 * BuildIran — Building Marker
 * Map overlay marker showing a building/asset on a coordinate tile.
 */

import { Radii } from "@/theme";
import type { Asset, Building } from "@/types/game.types";
import React from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BUILDING_EMOJIS: Record<string, string> = {
  house: "🏠",
  villa: "🏡",
  shop: "🏪",
  mall: "🏬",
  market: "🏦",
  office: "🏢",
  farm: "🌾",
  warehouse: "🏭",
  tower: "🗼",
  barracks: "⚔️",
};

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
  const type = asset?.type || building?.type || "house";
  const level = asset?.level ?? building?.level ?? 1;
  const isForSale = asset?.isForSale ?? false;
  const emoji = BUILDING_EMOJIS[type] || "🏛️";

  const content = (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      <View
        style={[
          styles.marker,
          isOwned ? styles.owned : styles.otherPlayer,
          isSelected && styles.selectedMarker,
          isForSale && styles.saleMarker,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>

        {/* Level badge */}
        {level > 1 && (
          <View
            style={[
              styles.levelBadge,
              isOwned ? styles.levelOwned : styles.levelOther,
            ]}
          >
            <Text style={styles.level}>{level}</Text>
          </View>
        )}

        {/* For sale badge */}
        {isForSale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>💰</Text>
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

const styles = StyleSheet.create({
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
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    position: "relative",
    backgroundColor: "#0F172A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  owned: {
    borderColor: "#10B981",
    backgroundColor: "#064E3B",
    shadowColor: "#10B981",
    shadowOpacity: 0.6,
  },
  otherPlayer: {
    borderColor: "#6366F1",
    backgroundColor: "#1E1B4B",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
  },
  selectedMarker: {
    borderColor: "#F59E0B",
    borderWidth: 3,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  saleMarker: {
    borderColor: "#F59E0B",
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
    borderTopColor: "#6366F1",
    marginTop: -1,
  },
  arrowOwned: {
    borderTopColor: "#10B981",
  },
  arrowOther: {
    borderTopColor: "#6366F1",
  },
  arrowSelected: {
    borderTopColor: "#F59E0B",
  },
  arrowSale: {
    borderTopColor: "#F59E0B",
  },
  emoji: {
    fontSize: 22,
  },
  levelBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  levelOwned: {
    backgroundColor: "#10B981",
  },
  levelOther: {
    backgroundColor: "#6366F1",
  },
  level: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  saleBadge: {
    position: "absolute",
    bottom: -6,
    left: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  saleText: {
    fontSize: 9,
  },
});

export default BuildingMarker;
