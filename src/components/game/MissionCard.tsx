/**
 * BuildIran — MissionCard (Gentleman Neon, v2)
 * Mission card: 2px state rail (claimable=brass / active=steel / done=jade),
 * category IconPlate, objective ProgressBars with tabular x/y, reward Chips
 * and the single live action — the neon claim CTA (§1), pulsing softly.
 * Claimed stays muted with a jade checkmark. Staggered FadeInDown entrance.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { IconPlate } from '@/components/ui/IconPlate';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Motion, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { useGlowPulse } from '@/lib/effects';
import type { MissionSlot } from '@/types/missions.types';
import fa from '@/i18n/fa';

type IconName = keyof typeof Ionicons.glyphMap;
type PlateTone = React.ComponentProps<typeof IconPlate>['tone'];
type BarTone = React.ComponentProps<typeof ProgressBar>['tone'];

// ─── Category → Ionicon (replaces the legacy def.icon emoji) ──────────────────

const CATEGORY_ICON: Record<string, IconName> = {
  daily: 'today',
  weekly: 'calendar',
  achievement: 'trophy',
  story: 'book',
  event: 'star',
  location: 'location',
};

// ─── Status → rail color / plate / bar tones ──────────────────────────────────
// Tones are mode-independent; the rail color resolves through the palette.
// Brass = the hero (claimable reward). Neon stays reserved for the CTA.

const STATUS_TONE: Record<string, { plate: PlateTone; bar: BarTone }> = {
  completed: { plate: 'brass', bar: 'brass' }, // claimable — reward ready
  active: { plate: 'steel', bar: 'steel' },
  claimed: { plate: 'jade', bar: 'jade' },
  locked: { plate: 'neutral', bar: 'steel' },
  expired: { plate: 'neutral', bar: 'steel' },
};

const statusRail = (c: Palette, status: string): string => {
  switch (status) {
    case 'completed':
      return c.brass[400]; // claimable
    case 'active':
      return c.steel;
    case 'claimed':
      return c.jade;
    default:
      return c.text.muted; // locked / expired
  }
};

// ─── MissionCard ──────────────────────────────────────────────────────────────

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
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  // §4 — the panel's single looping animation: soft glow pulse on the
  // claimable CTA (0.75↔1, 1200ms). Only applied when claimable.
  const glowPulse = useGlowPulse(0.75, 1);

  const isClaimable = slot.status === 'completed';
  const isClaimed = slot.status === 'claimed';
  const isExpired = slot.status === 'expired';
  const isLocked = slot.status === 'locked';
  const isDimmed = isClaimed || isExpired;
  const isQuiet = isLocked || isExpired;

  const handleClaim = useCallback(() => {
    if (!isClaiming && isClaimable) onClaim(slot.id);
  }, [isClaiming, isClaimable, slot.id, onClaim]);

  const def = slot.definition;
  if (!def) return null;

  const tone = STATUS_TONE[slot.status] ?? STATUS_TONE.active;
  const catIcon = CATEGORY_ICON[def.category] ?? 'flag';
  const catLabel =
    (fa.missions.category as Record<string, string>)[def.category] ??
    def.category;
  const meta =
    def.chainCode && def.chainStep != null
      ? `${catLabel} · ${fa.missions.step} ${def.chainStep.toLocaleString('fa-IR')}`
      : catLabel;

  const isDone = isClaimable || isClaimed;

  return (
    <Animated.View
      entering={FadeInDown.delay(Motion.stagger(index)).springify()}
      style={styles.wrap}
    >
      <Card
        padded={false}
        style={[
          styles.card,
          isClaimable && styles.cardClaimable,
          isDimmed && styles.cardDim,
          isLocked && styles.cardLocked,
        ]}
      >
        {/* State rail */}
        <View style={[styles.rail, { backgroundColor: statusRail(c, slot.status) }]} />

        <View style={styles.body}>
          {/* Header: category plate + title + meta */}
          <View style={styles.header}>
            <IconPlate name={catIcon} size="sm" tone={tone.plate} />
            <View style={styles.titleBlock}>
              <Text
                variant="body"
                weight="semibold"
                color={isQuiet ? 'muted' : 'primary'}
              >
                {def.titleFa}
              </Text>
              <Text variant="caption" color="secondary">
                {meta}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text variant="caption" color="secondary">
            {def.descriptionFa}
          </Text>

          {/* Objectives progress */}
          {!isLocked &&
            def.objectives.map((obj, i) => {
              const current = slot.progress[String(i)] ?? 0;
              const target = obj.target_value;
              return (
                <View key={i} style={styles.objRow}>
                  <ProgressBar
                    percent={target > 0 ? (current / target) * 100 : 0}
                    height={5}
                    tone={isDone ? 'jade' : tone.bar}
                    delay={Motion.stagger(index)}
                    sheen={false}
                    style={styles.objBar}
                  />
                  <Text variant="caption" color="secondary" style={styles.objCount}>
                    {current.toLocaleString('fa-IR')} / {target.toLocaleString('fa-IR')}
                  </Text>
                </View>
              );
            })}

          {/* Rewards + action */}
          <View style={styles.footer}>
            <View style={styles.rewardRow}>
              {(def.rewards.cash ?? 0) > 0 && (
                <Chip icon="cash" tone="brass" value={def.rewards.cash} label="تومان" />
              )}
              {(def.rewards.power ?? 0) > 0 && (
                <Chip icon="flash" tone="brass" value={def.rewards.power} label="قدرت" />
              )}
              {(def.rewards.popularity ?? 0) > 0 && (
                <Chip icon="sparkles" tone="jade" value={def.rewards.popularity} label="محبوبیت" />
              )}
              {(def.rewards.activity ?? 0) > 0 && (
                <Chip icon="flame" tone="ember" value={def.rewards.activity} label="فعالیت" />
              )}
            </View>

            {isClaimable && (
              <Animated.View style={glowPulse.style}>
                <Button
                  label="دریافت"
                  onPress={handleClaim}
                  variant="neon"
                  size="sm"
                  loading={isClaiming}
                />
              </Animated.View>
            )}

            {isClaimed && (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={15} color={c.jade} />
                <Text variant="caption" color="muted">
                  {fa.missions.status.claimed}
                </Text>
              </View>
            )}

            {isExpired && (
              <View style={styles.statusRow}>
                <Ionicons name="time" size={14} color={c.text.muted} />
                <Text variant="caption" color="muted">
                  {fa.missions.expired}
                </Text>
              </View>
            )}

            {isLocked && (
              <View style={styles.statusRow}>
                <Ionicons name="lock-closed" size={14} color={c.text.muted} />
                <Text variant="caption" color="muted">
                  {fa.missions.locked}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: {
      marginBottom: Spacing.sm,
    },
    card: {},
    cardClaimable: {
      borderColor: c.border.brand,
    },
    cardDim: {
      opacity: 0.55,
    },
    cardLocked: {
      opacity: 0.45,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
    },
    body: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
    },
    objRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    objBar: {
      flex: 1,
    },
    objCount: {
      minWidth: 64,
      textAlign: 'left',
      fontVariant: ['tabular-nums'],
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    rewardRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      flex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
  });

export default MissionCard;
