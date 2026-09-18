import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { getNeighborhoodTier } from '@/lib/constants';
import type { Neighborhood } from '@/types/game.types';

interface NeighborhoodAmenityCardProps {
  neighborhood: Neighborhood;
  /** If true, renders a compact version suitable for floating badges */
  compact?: boolean;
}

export const NeighborhoodAmenityCard: React.FC<NeighborhoodAmenityCardProps> = ({ neighborhood, compact = false }) => {
  const score = neighborhood.amenityScore ?? 0;
  const tierInfo = getNeighborhoodTier(score);

  if (compact) {
    return (
      <View style={[styles.compactBadge, { borderColor: tierInfo.color }]}>
        <LinearGradient
          colors={[`${tierInfo.color}33`, `${tierInfo.color}11`]}
          style={StyleSheet.absoluteFill}
        />
        <Text variant="caption" weight="bold" color="primary" style={{ color: tierInfo.color }}>
          {tierInfo.emoji} {tierInfo.nameFa}
        </Text>
        {tierInfo.dailyDrip > 0 && (
          <View style={[styles.dripPill, { backgroundColor: `${tierInfo.color}44` }]}>
            <Text variant="caption" weight="bold" color="inverse" style={{ fontSize: 10 }}>
              +{tierInfo.dailyDrip} قدرت/روز
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full card view
  const costPremium = tierInfo.costMultiplier > 1.0;

  return (
    <View style={[styles.fullCard, { borderColor: tierInfo.color }]}>
      <LinearGradient
        colors={[`${tierInfo.color}15`, 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="heading" style={{ fontSize: 24 }}>{tierInfo.emoji}</Text>
          <View>
            <Text variant="title" weight="bold" color="primary" style={{ color: tierInfo.color }}>
              {tierInfo.nameFa}
            </Text>
            <Text variant="caption" color="secondary">
              امتیاز امکانات: {score.toLocaleString('fa-IR')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text variant="caption" color="secondary">پاداش روزانه قدرت</Text>
          <Text variant="title" weight="bold" color="brand">
            +{tierInfo.dailyDrip.toLocaleString('fa-IR')} ⚡
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="caption" color="secondary">ضریب هزینه ساخت</Text>
          <Text variant="title" weight="bold" color={costPremium ? 'error' : 'primary'}>
            {tierInfo.costMultiplier.toLocaleString('fa-IR')}×
          </Text>
        </View>
      </View>

      {costPremium && (
        <Text variant="caption" color="error" style={styles.premiumNote}>
          هزینه ساخت در این محله به دلیل کیفیت بالاتر، گران‌تر از استاندارد است.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dripPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  premiumNote: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
});
