/**
 * BuildIran — Building Marker
 * Map overlay marker showing a building on a tile.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, Radii } from '@/theme';
import type { Building } from '@/types/game.types';

const BUILDING_EMOJIS: Record<string, string> = {
  house: '🏠',
  villa: '🏡',
  shop: '🏪',
  mall: '🏬',
  market: '🏦',
  office: '🏢',
  farm: '🌾',
  warehouse: '🏭',
  tower: '🗼',
  barracks: '⚔️',
};

interface Props {
  building: Building;
  isOwned?: boolean;
}

export const BuildingMarker: React.FC<Props> = ({
  building,
  isOwned = false,
}) => {
  const emoji = BUILDING_EMOJIS[building.type] || '🏛️';

  return (
    <View style={[styles.marker, isOwned ? styles.owned : styles.enemy]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {building.level > 1 && (
        <View style={styles.levelBadge}>
          <Text style={styles.level}>{building.level}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  owned: {
    backgroundColor: Colors.bg.secondary,
    borderColor: Colors.brand.primary,
  },
  enemy: {
    backgroundColor: Colors.bg.secondary,
    borderColor: Colors.semantic.error,
  },
  emoji: {
    fontSize: 20,
  },
  levelBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: {
    fontSize: 9,
    color: Colors.text.inverse,
    fontWeight: '700',
  },
});

export default BuildingMarker;
