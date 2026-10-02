/**
 * BuildIran — Leaderboard Screen («Gentleman Neon» v2)
 * جدول افتخار — podium for the top-3, honor-roll rows below.
 * Dual-theme via useTheme, mode-aware medal tones, staggered entrances.
 * Mock data structure kept, ready to connect with a Supabase query.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, TextStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import type { Player } from '@/types/game.types';

type Entry = Pick<
  Player,
  'id' | 'username' | 'score' | 'ownedTileIds' | 'buildingIds' | 'level'
>;

// ─── Mock data (ready to connect with Supabase query) ────────────────────────

const MOCK_PLAYERS: Entry[] = [
  { id: '1', username: 'کاوه', score: 48200, ownedTileIds: Array(12), buildingIds: Array(34), level: 15 },
  { id: '2', username: 'آرش', score: 36500, ownedTileIds: Array(9), buildingIds: Array(28), level: 12 },
  { id: '3', username: 'دارا', score: 29100, ownedTileIds: Array(7), buildingIds: Array(22), level: 10 },
  { id: '4', username: 'سهراب', score: 21800, ownedTileIds: Array(6), buildingIds: Array(18), level: 9 },
  { id: '5', username: 'رستم', score: 17300, ownedTileIds: Array(5), buildingIds: Array(14), level: 8 },
  { id: '6', username: 'بهرام', score: 13200, ownedTileIds: Array(4), buildingIds: Array(11), level: 7 },
  { id: '7', username: 'فریدون', score: 9500, ownedTileIds: Array(3), buildingIds: Array(9), level: 6 },
  { id: '8', username: 'جمشید', score: 7100, ownedTileIds: Array(2), buildingIds: Array(7), level: 5 },
];

/** fa-IR numerals + tabular alignment — numbers first. */
const fa = (n: number) => n.toLocaleString('fa-IR');
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const podium = MOCK_PLAYERS.slice(0, 3);
  const rest = MOCK_PLAYERS.slice(3);

  // RTL row flows right→left: 2nd on the right, 1st elevated in the center, 3rd on the left.
  const podiumOrder: Array<{ entry: Entry; rank: number }> = [
    { entry: podium[1], rank: 2 },
    { entry: podium[0], rank: 1 },
    { entry: podium[2], rank: 3 },
  ];

  const renderItem = ({
    item,
    index,
  }: {
    item: Entry;
    index: number;
  }) => {
    const rank = index + 4;

    return (
      <Animated.View entering={FadeInDown.delay(Motion.stagger(index + 3))}>
        <View style={styles.listRow}>
          {/* Rank in a quiet ink plate */}
          <View style={styles.rankPlate}>
            <Text variant="caption" weight="semibold" color="muted" style={[styles.plateText, TABULAR]}>
              {fa(rank)}
            </Text>
          </View>

          {/* Name + meta */}
          <View style={styles.playerInfo}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {item.username}
            </Text>
            <Text variant="label" color="muted" numberOfLines={1}>
              سطح {fa(item.level)} · {fa(item.ownedTileIds.length)} قطعه · {fa(item.buildingIds.length)} سازه
            </Text>
          </View>

          {/* Score — end-aligned, tabular, bold */}
          <Text variant="body" weight="bold" style={[styles.score, TABULAR]}>
            {fa(item.score)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Hairline}
        ListHeaderComponent={
          <View>
            {/* Header — one entrance, no per-element jitter */}
            <Animated.View
              entering={FadeInDown.duration(Motion.durations.slow)}
              style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
            >
              <SectionTitle kicker="رتبه‌بندی" title="جدول افتخار" />
              <Text variant="caption" color="secondary">
                برترین بازیکنان این هفته
              </Text>
            </Animated.View>

            {/* Podium — top 3 */}
            <View style={styles.podium}>
              {podiumOrder.map(({ entry, rank }, i) => {
                const medalColor = c.medal[rank];
                return (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInDown.delay(Motion.stagger(i))}
                    style={styles.podiumCell}
                  >
                    <Card
                      elevated={rank === 1}
                      cornerTicks={rank === 1}
                      padded={false}
                      style={styles.podiumCard}
                    >
                      {/* Medal plate with rank numeral */}
                      <View
                        style={[
                          styles.medalPlate,
                          rank === 1 && styles.medalPlateFirst,
                          { backgroundColor: `${medalColor}22`, borderColor: `${medalColor}4D` },
                        ]}
                      >
                        <Text
                          variant="subtitle"
                          weight="extrabold"
                          style={[{ color: medalColor, writingDirection: 'ltr' }, TABULAR]}
                        >
                          #{fa(rank)}
                        </Text>
                      </View>

                      <Text variant="body" weight="semibold" center numberOfLines={1}>
                        {entry.username}
                      </Text>
                      <Text variant="subtitle" weight="bold" style={TABULAR}>
                        {fa(entry.score)}
                      </Text>
                      <Text variant="label" color="muted">
                        سطح {fa(entry.level)}
                      </Text>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>

            {/* Honor roll caption */}
            <View style={styles.rollTitle}>
              <Text variant="label" color="brand">
                سایر بازیکنان
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
      />
    </View>
  );
}

/** Blueprint hairline between rows — theme-reactive. */
const Hairline = () => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return <View style={styles.hairline} />;
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg.primary,
    },
    list: {
      paddingHorizontal: Spacing.lg,
    },

    // Header
    header: {
      gap: Spacing.sm - 2,
      marginBottom: Spacing.lg,
    },

    // Podium
    podium: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: Spacing.sm,
    },
    podiumCell: {
      flex: 1,
    },
    podiumCard: {
      alignItems: 'center',
      gap: Spacing.xs + 2,
      paddingVertical: Spacing.md + 2,
      paddingHorizontal: Spacing.sm,
    },
    medalPlate: {
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    medalPlateFirst: {
      width: 50,
      height: 50,
    },

    // Honor roll
    rollTitle: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.xs,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: 44,
    },
    rankPlate: {
      width: 34,
      height: 34,
      borderRadius: Radii.sm,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plateText: {
      textAlign: 'center',
    },
    playerInfo: {
      flex: 1,
      gap: 1,
    },
    score: {
      textAlign: 'left',
    },
    hairline: {
      height: 1,
      backgroundColor: c.border.subtle,
    },
  });
