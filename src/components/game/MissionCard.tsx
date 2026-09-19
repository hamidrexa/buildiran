/**
 * BuildIran — MissionCard
 * Renders a single mission slot card with progress bar, reward chips,
 * and a claim button. Follows the codebase's dark card style (not glassmorphism).
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Colors, Radii, Spacing } from '@/theme';
import type { MissionSlot } from '@/types/missions.types';
import fa from '@/i18n/fa';

// ─── Category accent colors ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  daily:       '#3B82F6',
  weekly:      '#8B5CF6',
  achievement: '#F59E0B',
  story:       '#D4A017',
  event:       '#EC4899',
  location:    '#10B981',
};

// ─── Objective Progress Bar ───────────────────────────────────────────────────

const ProgressBar: React.FC<{
  current: number;
  target: number;
  color: string;
}> = ({ current, target, color }) => {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(pct, { duration: 600 });
  }, [pct]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return (
    <View style={pbStyles.track}>
      <Animated.View style={[pbStyles.fill, { backgroundColor: color }, animStyle]} />
    </View>
  );
};

const pbStyles = StyleSheet.create({
  track: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Reward Chip ─────────────────────────────────────────────────────────────

const RewardChip: React.FC<{ icon: string; value: number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <View style={chipStyles.chip}>
    <Text variant="caption" color="primary" style={chipStyles.icon}>
      {icon}
    </Text>
    <Text variant="caption" weight="bold" color="brand">
      {value.toLocaleString('fa-IR')}
    </Text>
    <Text variant="label" color="secondary">
      {' '}{label}
    </Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderRadius: Radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    gap: 2,
  },
  icon: { fontSize: 12 },
});

// ─── MissionCard ─────────────────────────────────────────────────────────────

interface MissionCardProps {
  slot: MissionSlot;
  index?: number;
  onClaim: (slotId: string) => Promise<void>;
  isClaiming: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  slot,
  index = 0,
  onClaim,
  isClaiming,
}) => {
  const def = slot.definition;
  if (!def) return null;

  const cat = def.category;
  const accentColor = CATEGORY_COLORS[cat] ?? Colors.brand.primary;
  const isCompleted = slot.status === 'completed';
  const isClaimed = slot.status === 'claimed';
  const isExpired = slot.status === 'expired';
  const isLocked = slot.status === 'locked';

  const handleClaim = useCallback(() => {
    if (!isClaiming && isCompleted) onClaim(slot.id);
  }, [isClaiming, isCompleted, slot.id, onClaim]);

  const catLabel = (fa.missions.category as any)[cat] ?? cat;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[
        styles.card,
        isCompleted && styles.cardClaimable,
        isClaimed && styles.cardClaimed,
        isLocked && styles.cardLocked,
      ]}
    >
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Header row: icon + title + category badge */}
        <View style={styles.header}>
          <Text style={styles.icon}>{def.icon}</Text>
          <View style={styles.titleBlock}>
            <Text variant="body" weight="bold" color={isLocked ? 'muted' : 'primary'}>
              {isLocked ? `🔒 ${def.titleFa}` : def.titleFa}
            </Text>
            {/* Chain step indicator */}
            {def.chainCode && def.chainStep != null && (
              <Text variant="label" color="secondary" style={{ marginTop: 1 }}>
                {fa.missions.step} {def.chainStep}
              </Text>
            )}
          </View>
          <View style={[styles.catBadge, { borderColor: accentColor + '55' }]}>
            <Text variant="label" style={{ color: accentColor }}>
              {catLabel}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text variant="caption" color="secondary" style={styles.desc}>
          {def.descriptionFa}
        </Text>

        {/* Objectives progress */}
        {!isLocked && def.objectives.map((obj, i) => {
          const current = slot.progress[String(i)] ?? 0;
          const target = obj.target_value;
          return (
            <View key={i} style={styles.objRow}>
              <ProgressBar current={current} target={target} color={accentColor} />
              <Text variant="label" color="secondary" style={styles.objCount}>
                {current.toLocaleString('fa-IR')}/{target.toLocaleString('fa-IR')}
              </Text>
            </View>
          );
        })}

        {/* Rewards + Claim button */}
        <View style={styles.footer}>
          {/* Reward chips */}
          <View style={styles.rewardRow}>
            {(def.rewards.cash ?? 0) > 0 && (
              <RewardChip icon="💰" value={def.rewards.cash!} label="تومان" />
            )}
            {(def.rewards.power ?? 0) > 0 && (
              <RewardChip icon="⚔️" value={def.rewards.power!} label="قدرت" />
            )}
            {(def.rewards.popularity ?? 0) > 0 && (
              <RewardChip icon="⭐" value={def.rewards.popularity!} label="محبوبیت" />
            )}
            {(def.rewards.activity ?? 0) > 0 && (
              <RewardChip icon="🔥" value={def.rewards.activity!} label="فعالیت" />
            )}
          </View>

          {/* Claim / Status button */}
          {isCompleted && (
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={handleClaim}
              disabled={isClaiming}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.brand.primary, Colors.brand.secondary]}
                style={styles.claimGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text variant="caption" weight="bold" color="inverse">
                    {fa.missions.claimReward}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isClaimed && (
            <View style={styles.claimedBadge}>
              <Text variant="label" color="muted">
                {fa.missions.claimed}
              </Text>
            </View>
          )}

          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text variant="label" color="muted">
                {fa.missions.expired}
              </Text>
            </View>
          )}

          {isLocked && (
            <View style={styles.lockedBadge}>
              <Text variant="label" color="muted">
                {fa.missions.locked}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  cardClaimable: {
    borderColor: 'rgba(212,160,23,0.45)',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  cardClaimed: {
    opacity: 0.55,
  },
  cardLocked: {
    opacity: 0.45,
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: Radii.md,
    borderBottomLeftRadius: Radii.md,
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  titleBlock: { flex: 1 },
  catBadge: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  desc: {
    marginTop: 2,
    lineHeight: 18,
  },
  objRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  objCount: {
    minWidth: 44,
    textAlign: 'left',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  claimBtn: {
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  claimGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  claimedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  expiredBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  lockedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
});
