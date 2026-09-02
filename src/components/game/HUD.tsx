/**
 * BuildIran — HUD (Heads-Up Display)
 * Floating overlay showing player resources and selected tile info.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii } from '@/theme';
import { Text } from '@/components/ui/Text';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useGameStore } from '@/store/useGameStore';

export const HUD: React.FC = () => {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const selectedTileId = useGameStore((s) => s.selectedTileId);
  const tiles = useGameStore((s) => s.tiles);

  const selectedTile = selectedTileId ? tiles[selectedTileId] : null;

  if (!player) return null;

  return (
    <>
      {/* Top Resource Bar */}
      <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
        <View style={styles.resourceRow}>
          <ResourceChip icon="🪙" value={player.resources.gold} />
          <ResourceChip icon="🌾" value={player.resources.food} />
          <ResourceChip icon="🪵" value={player.resources.wood} />
          <ResourceChip icon="🪨" value={player.resources.stone} />
        </View>
      </View>

      {/* Bottom: Selected Tile Info */}
      {selectedTile && (
        <View style={[styles.tilePanel, { bottom: insets.bottom + 80 }]}>
          <Text variant="caption" color="secondary">
            {selectedTile.status === 'available'
              ? '🟢 زمین آزاد — برای تملک انتخاب شد'
              : selectedTile.status === 'owned'
              ? '🟡 قلمرو شما'
              : '🔴 قلمرو دشمن'}
          </Text>
          <Text variant="label" color="muted">
            {selectedTile.id}
          </Text>
        </View>
      )}
    </>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ResourceChip: React.FC<{ icon: string; value: number }> = ({
  icon,
  value,
}) => (
  <View style={chipStyles.chip}>
    <Text style={chipStyles.icon}>{icon}</Text>
    <Text variant="caption" weight="semibold" color="primary">
      {value.toLocaleString('fa-IR')}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  resourceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.overlay,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  tilePanel: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    alignItems: 'flex-end',
    zIndex: 10,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 14,
  },
});

export default HUD;
