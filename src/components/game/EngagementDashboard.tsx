/**
 * BuildIran — EngagementDashboard
 * Asset owner's analytics panel: viewport views, popularity earned,
 * top viewers, and upgrade suggestions.
 * Mounted inside AssetDetailModal when the viewer is the asset owner.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { useEconomyStore } from '@/store/useEconomyStore';
import { useBounceIn } from '@/lib/effects';
import Animated from 'react-native-reanimated';
import t from '@/i18n';

const lang = t();

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  value: number;
  label: string;
  icon: string;
  color: string;
  delay?: number;
}> = ({ value, label, icon, color, delay = 0 }) => {
  const { style } = useBounceIn(delay);
  return (
    <Animated.View style={[cardStyles.card, style]}>
      <LinearGradient
        colors={[`${color}22`, `${color}08`]}
        style={cardStyles.cardInner}
      >
        <Text style={cardStyles.icon}>{icon}</Text>
        <Text variant="title" weight="bold" style={{ color }}>
          {value.toLocaleString('fa-IR')}
        </Text>
        <Text variant="caption" color="secondary" center>
          {label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Viewer Row ───────────────────────────────────────────────────────────────

const ViewerRow: React.FC<{
  username: string;
  viewCount: number;
  rank: number;
}> = ({ username, viewCount, rank }) => (
  <View style={viewerStyles.row}>
    <Text variant="caption" color="muted" style={viewerStyles.rank}>
      #{rank.toLocaleString('fa-IR')}
    </Text>
    <Text variant="body" color="primary" style={{ flex: 1 }}>
      {username}
    </Text>
    <Text variant="caption" color="secondary">
      {viewCount.toLocaleString('fa-IR')} 👁️
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  assetId: string;
}

export const EngagementDashboard: React.FC<Props> = ({ assetId }) => {
  const fetchEngagement    = useEconomyStore((s) => s.fetchEngagement);
  const engagementData     = useEconomyStore((s) => s.engagementData[assetId]);
  const isLoadingEngagement = useEconomyStore((s) => s.isLoadingEngagement);

  useEffect(() => {
    fetchEngagement(assetId);
  }, [assetId]);

  if (isLoadingEngagement && !engagementData) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#6C63FF" size="small" />
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
      <View style={styles.titleRow}>
        <Text variant="label" weight="bold" color="primary">
          📊 {lang.economy.engagement.title}
        </Text>
        <Text variant="caption" color="secondary">
          {lang.economy.engagement.viewsLead}
        </Text>
      </View>

      {/* Stat Cards */}
      <View style={styles.cardGrid}>
        <StatCard
          value={engagementData.viewsToday}
          label={lang.economy.engagement.viewsToday}
          icon="👁️"
          color="#60A5FA"
          delay={0}
        />
        <StatCard
          value={engagementData.viewsThisWeek}
          label={lang.economy.engagement.viewsWeek}
          icon="📅"
          color="#A78BFA"
          delay={80}
        />
        <StatCard
          value={engagementData.viewsAllTime}
          label={lang.economy.engagement.viewsAll}
          icon="📈"
          color="#34D399"
          delay={160}
        />
        <StatCard
          value={engagementData.popularityEarned}
          label={lang.economy.engagement.popularityEarned}
          icon="⭐"
          color="#FFD700"
          delay={240}
        />
      </View>

      {/* Top viewers */}
      <View style={styles.section}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          {lang.economy.engagement.topViewers}
        </Text>
        {engagementData.topViewers.length === 0 ? (
          <Text variant="caption" color="muted" center>
            {lang.economy.engagement.noViewers}
          </Text>
        ) : (
          engagementData.topViewers.map((v, i) => (
            <ViewerRow
              key={v.playerId}
              username={v.username}
              viewCount={v.viewCount}
              rank={i + 1}
            />
          ))
        )}
      </View>

      {/* Upgrade suggestion */}
      {engagementData.upgradeSuggestion && (
        <View style={styles.suggestion}>
          <LinearGradient
            colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']}
            style={styles.suggestionInner}
          >
            <Text variant="body" style={{ color: '#6C63FF' }}>💡</Text>
            <Text variant="caption" color="secondary" style={{ flex: 1 }}>
              {engagementData.upgradeSuggestion}
            </Text>
          </LinearGradient>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  titleRow: { gap: 2, marginBottom: 16 },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  section: { gap: 8, marginBottom: 16 },
  sectionTitle: { marginBottom: 6 },
  suggestion: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  suggestionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.25)',
  },
});

const cardStyles = StyleSheet.create({
  card: { width: '47%' },
  cardInner: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  icon: { fontSize: 20 },
});

const viewerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },
  rank: { minWidth: 26, textAlign: 'center' },
});
