/**
 * BuildIran — Leaderboard Screen
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import t from '@/i18n';
import type { Player } from '@/types/game.types';

const lang = t();

// ─── Mock data (ready to connect with Supabase query) ────────────────────────

const MOCK_PLAYERS: Pick<Player, 'id' | 'username' | 'score' | 'ownedTileIds' | 'buildingIds' | 'level'>[] =
  [
    { id: '1', username: 'کاوه', score: 48200, ownedTileIds: Array(12), buildingIds: Array(34), level: 15 },
    { id: '2', username: 'آرش', score: 36500, ownedTileIds: Array(9), buildingIds: Array(28), level: 12 },
    { id: '3', username: 'دارا', score: 29100, ownedTileIds: Array(7), buildingIds: Array(22), level: 10 },
    { id: '4', username: 'سهراب', score: 21800, ownedTileIds: Array(6), buildingIds: Array(18), level: 9 },
    { id: '5', username: 'رستم', score: 17300, ownedTileIds: Array(5), buildingIds: Array(14), level: 8 },
    { id: '6', username: 'بهرام', score: 13200, ownedTileIds: Array(4), buildingIds: Array(11), level: 7 },
    { id: '7', username: 'فریدون', score: 9500, ownedTileIds: Array(3), buildingIds: Array(9), level: 6 },
    { id: '8', username: 'جمشید', score: 7100, ownedTileIds: Array(2), buildingIds: Array(7), level: 5 },
  ];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof MOCK_PLAYERS)[0];
    index: number;
  }) => {
    const rank = index + 1;
    const rankColor = RANK_COLORS[index] ?? Colors.text.secondary;
    const isTop3 = rank <= 3;

    return (
      <Card
        style={[styles.row, isTop3 && styles.topRow]}
        elevated={isTop3}
        padded={false}
      >
        <View style={styles.rowInner}>
          {/* Score */}
          <Text variant="caption" color="secondary">
            {item.score.toLocaleString('fa-IR')}
          </Text>

          {/* Name & Level */}
          <View style={styles.playerInfo}>
            <Text variant="body" weight="semibold">
              {item.username}
            </Text>
            <Text variant="label" color="muted">
              سطح {item.level} · {item.ownedTileIds.length} قطعه · {item.buildingIds.length} سازه
            </Text>
          </View>

          {/* Rank */}
          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text
              variant="label"
              weight="bold"
              style={{ color: rankColor, textAlign: 'center', writingDirection: 'ltr' }}
            >
              {isTop3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="title" weight="bold">
          {lang.leaderboard.title}
        </Text>
        <Text variant="caption" color="secondary">
          برترین بازیکنان این هفته
        </Text>
      </View>

      <FlatList
        data={MOCK_PLAYERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 80 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    padding: Spacing.lg,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: { borderRadius: Radii.lg, overflow: 'hidden' },
  topRow: { borderColor: Colors.border.brand },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerInfo: { flex: 1, alignItems: 'flex-end', gap: 2 },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
