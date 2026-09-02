/**
 * BuildIran — Player Profile Screen
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { usePlayerStore } from '@/store/usePlayerStore';
import t from '@/i18n';

const lang = t();

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);

  if (!player) {
    return (
      <View style={styles.empty}>
        <Text variant="body" color="secondary" center>
          در حال بارگذاری اطلاعات بازیکن...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.xl },
      ]}
    >
      {/* Avatar & Name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="heading" weight="bold" color="brand" center>
            {player.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="title" weight="bold">
          {player.username}
        </Text>
        <Text variant="caption" color="secondary">
          {lang.player.level} {player.level} · {lang.player.rank} #{player.rank}
        </Text>
      </View>

      {/* XP Bar */}
      <Card style={styles.card}>
        <Text variant="label" color="secondary">
          {lang.player.experience}
        </Text>
        <View style={styles.xpBarBg}>
          <View
            style={[
              styles.xpBarFill,
              { width: `${Math.min((player.experience % 1000) / 10, 100)}%` },
            ]}
          />
        </View>
        <Text variant="caption" color="muted">
          {player.experience.toLocaleString('fa-IR')} XP
        </Text>
      </Card>

      {/* Resources */}
      <Card style={styles.card}>
        <Text variant="label" color="secondary" style={styles.cardTitle}>
          {lang.hud.resources}
        </Text>
        <View style={styles.resourceGrid}>
          <ResourceRow icon="🪙" label={lang.resources.gold} value={player.resources.gold} />
          <ResourceRow icon="🌾" label={lang.resources.food} value={player.resources.food} />
          <ResourceRow icon="🪵" label={lang.resources.wood} value={player.resources.wood} />
          <ResourceRow icon="🪨" label={lang.resources.stone} value={player.resources.stone} />
          <ResourceRow icon="👥" label={lang.resources.population} value={player.resources.population} />
        </View>
      </Card>

      {/* Stats */}
      <Card style={styles.card}>
        <Text variant="label" color="secondary" style={styles.cardTitle}>
          آمار بازی
        </Text>
        <StatRow label={lang.player.territory} value={`${player.ownedTileIds.length} قطعه`} />
        <StatRow label={lang.player.buildings} value={`${player.buildingIds.length} سازه`} />
        <StatRow label="امتیاز کل" value={player.score.toLocaleString('fa-IR')} />
      </Card>
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ResourceRow: React.FC<{ icon: string; label: string; value: number }> = ({
  icon, label, value,
}) => (
  <View style={rowStyles.row}>
    <Text variant="body">{value.toLocaleString('fa-IR')}</Text>
    <View style={rowStyles.labelGroup}>
      <Text variant="body" color="secondary">{label}</Text>
      <Text style={rowStyles.icon}>{icon}</Text>
    </View>
  </View>
);

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={rowStyles.row}>
    <Text variant="body" weight="semibold">{value}</Text>
    <Text variant="body" color="secondary">{label}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['3xl'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  header: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  card: { gap: Spacing.sm },
  cardTitle: { marginBottom: Spacing.xs },
  resourceGrid: { gap: Spacing.sm },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.full,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  icon: { fontSize: 16 },
});
