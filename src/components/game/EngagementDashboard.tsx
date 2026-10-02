/**
 * BuildIran — EngagementDashboard — «Gentleman Neon» (v2)
 * Asset owner's analytics panel: viewport views, popularity earned,
 * top viewers, and upgrade suggestions.
 * Mounted inside AssetDetailModal when the viewer is the asset owner.
 * SectionTitle rhythm, IconPlate stat cards, tabular numerals; economy
 * store calls and public props ({assetId}) unchanged.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Radii, Typography, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { useEconomyStore } from '@/store/useEconomyStore';
import { useBounceIn } from '@/lib/effects';
import t from '@/i18n';

const lang = t();

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  value: number;
  label: string;
  icon: React.ComponentProps<typeof IconPlate>['name'];
  tone: React.ComponentProps<typeof IconPlate>['tone'];
  delay?: number;
}> = ({ value, label, icon, tone, delay = 0 }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => statCardStyles(c), [c]);
  const { style } = useBounceIn(delay);
  return (
    <Animated.View style={[styles.card, style]}>
      <IconPlate name={icon} size="sm" tone={tone} bordered={false} />
      <Text variant="title" weight="bold" style={styles.value}>
        {value.toLocaleString('fa-IR')}
      </Text>
      <Text variant="caption" color="secondary" style={styles.label}>
        {label}
      </Text>
    </Animated.View>
  );
};

const statCardStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      width: '47%',
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      padding: Spacing.md,
      alignItems: 'center',
      gap: Spacing.xs + 2,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    value: {
      fontVariant: ['tabular-nums'],
    },
    label: {
      textAlign: 'center',
    },
  });

// ─── Viewer Row ───────────────────────────────────────────────────────────────

const ViewerRow: React.FC<{
  username: string;
  viewCount: number;
  rank: number;
  index: number;
}> = ({ username, viewCount, rank, index }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => viewerStyles(c), [c]);
  return (
    <Animated.View
      entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.normal)}
      style={styles.row}
    >
      <Text variant="caption" color="muted" style={styles.rank}>
        #{rank.toLocaleString('fa-IR')}
      </Text>
      <Text variant="body" weight="medium" style={styles.name} numberOfLines={1}>
        {username}
      </Text>
      <Ionicons name="eye" size={13} color={c.text.muted} />
      <Text variant="caption" color="secondary" style={styles.count}>
        {viewCount.toLocaleString('fa-IR')}
      </Text>
    </Animated.View>
  );
};

const viewerStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      backgroundColor: c.ink[700],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      minHeight: 44,
    },
    rank: {
      minWidth: 26,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    name: {
      flex: 1,
    },
    count: {
      fontVariant: ['tabular-nums'],
      fontSize: Typography.sizes.sm,
    },
  });

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  assetId: string;
}

export const EngagementDashboard: React.FC<Props> = ({ assetId }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const fetchEngagement    = useEconomyStore((s) => s.fetchEngagement);
  const engagementData     = useEconomyStore((s) => s.engagementData[assetId]);
  const isLoadingEngagement = useEconomyStore((s) => s.isLoadingEngagement);

  useEffect(() => {
    fetchEngagement(assetId);
  }, [assetId]);

  if (isLoadingEngagement && !engagementData) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={c.brass[400]} size="small" />
        <Text variant="caption" color="secondary">
          {lang.common.loading}
        </Text>
      </View>
    );
  }

  if (!engagementData) return null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Header */}
      <SectionTitle
        kicker="تحلیل"
        title={lang.economy.engagement.title}
        trailing={
          <Text variant="caption" color="muted">
            {lang.economy.engagement.viewsLead}
          </Text>
        }
      />

      {/* Stat Cards */}
      <View style={styles.cardGrid}>
        <StatCard
          value={engagementData.viewsToday}
          label={lang.economy.engagement.viewsToday}
          icon="eye"
          tone="steel"
          delay={0}
        />
        <StatCard
          value={engagementData.viewsThisWeek}
          label={lang.economy.engagement.viewsWeek}
          icon="calendar"
          tone="brass"
          delay={80}
        />
        <StatCard
          value={engagementData.viewsAllTime}
          label={lang.economy.engagement.viewsAll}
          icon="trending-up"
          tone="jade"
          delay={160}
        />
        <StatCard
          value={engagementData.popularityEarned}
          label={lang.economy.engagement.popularityEarned}
          icon="star"
          tone="ember"
          delay={240}
        />
      </View>

      {/* Top viewers */}
      <SectionTitle kicker="بازدیدکنندگان" title={lang.economy.engagement.topViewers} />
      {engagementData.topViewers.length === 0 ? (
        <EmptyState
          icon="eye-off"
          tone="neutral"
          title={lang.economy.engagement.noViewers}
          style={styles.emptyCompact}
        />
      ) : (
        <View style={styles.viewerList}>
          {engagementData.topViewers.map((v, i) => (
            <ViewerRow
              key={v.playerId}
              username={v.username}
              viewCount={v.viewCount}
              rank={i + 1}
              index={i}
            />
          ))}
        </View>
      )}

      {/* Upgrade suggestion */}
      {engagementData.upgradeSuggestion && (
        <View style={styles.suggestion}>
          <IconPlate name="bulb" size="sm" tone="brass" bordered={false} />
          <Text variant="caption" color="secondary" style={styles.suggestionText}>
            {engagementData.upgradeSuggestion}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1 },
    loading: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    viewerList: {
      gap: Spacing.sm,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    emptyCompact: {
      paddingVertical: Spacing.lg,
    },
    suggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: `${c.brass[400]}3D`,
      backgroundColor: `${c.brass[400]}0F`,
      marginBottom: Spacing.lg,
    },
    suggestionText: {
      flex: 1,
    },
  });
