/**
 * BuildIran — Neighborhood Amenity Card — «Gentleman Neon» (v2)
 * Amenity tier presentation for a neighborhood.
 *  - compact: mode-aware glass mini-pill for the HUD row (IconPlate + tabular
 *    drip value) — jade/neutral, never neon (passive surface).
 *  - full: hero Card with corner ticks — tier, amenity score, daily drip, cost multiplier.
 * Tier colors from constants carry forbidden hexes, so tier → palette token at
 * render: index → IconPlate tone for plates, index → c.tier[n] for text accents.
 * Props contract unchanged.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { IconPlate } from '@/components/ui/IconPlate';
import { Card } from '@/components/ui/Card';
import { Spacing, Radii, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { getNeighborhoodTier } from '@/lib/constants';
import type { Neighborhood } from '@/types/game.types';

interface NeighborhoodAmenityCardProps {
  neighborhood: Neighborhood;
  /** If true, renders a compact version suitable for floating badges */
  compact?: boolean;
}

type PlateTone = React.ComponentProps<typeof IconPlate>['tone'];
type IconName = React.ComponentProps<typeof IconPlate>['name'];

/** Tier index → allowed tone / Ionicon (replaces the old per-tier emoji + hex). */
const TIER_TONES: readonly PlateTone[] = ['neutral', 'jade', 'steel', 'steel', 'ember', 'brass'];
const TIER_ICONS: readonly IconName[] = ['home', 'leaf', 'business', 'school', 'medal', 'diamond'];

const fa = (n: number) => n.toLocaleString('fa-IR');

export const NeighborhoodAmenityCard: React.FC<NeighborhoodAmenityCardProps> = ({
  neighborhood,
  compact = false,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const score = neighborhood.amenityScore ?? 0;
  const tierInfo = getNeighborhoodTier(score);
  const tierIndex = Math.min(Math.max(tierInfo.tier, 0), TIER_TONES.length - 1);
  const tone: PlateTone = TIER_TONES[tierIndex];
  const iconName: IconName = TIER_ICONS[tierIndex];

  if (compact) {
    // HUD glass mini-pill — tight height budget, jade/neutral only.
    return (
      <View style={styles.compactBadge}>
        <IconPlate name={iconName} size="xxs" tone={tone} bordered={false} />
        <Text variant="caption" weight="semibold" style={styles.compactName}>
          {tierInfo.nameFa}
        </Text>
        {tierInfo.dailyDrip > 0 && (
          <View style={styles.dripPill}>
            <Ionicons name="flash" size={10} color={c.jade} />
            <Text style={[styles.dripText, { color: c.jade }]}>
              +{fa(tierInfo.dailyDrip)} قدرت/روز
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full hero card
  const costPremium = tierInfo.costMultiplier > 1.0;
  const tierColor = c.tier[tierIndex];

  return (
    <Card cornerTicks padded={false} style={styles.fullCard}>
      <View style={styles.headerRow}>
        <IconPlate name={iconName} size="lg" tone={tone} />
        <View style={styles.headerTexts}>
          <Text variant="title" weight="bold">
            {tierInfo.nameFa}
          </Text>
          <Text variant="caption" color="secondary">
            امتیاز امکانات: {fa(score)}
          </Text>
        </View>
        <View style={styles.tierChip}>
          <Text style={[styles.tierChipText, { color: tierColor }]}>سطح {fa(tierInfo.tier)}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <Ionicons name="flash" size={12} color={c.jade} />
            <Text variant="label" color="secondary">
              پاداش روزانه قدرت
            </Text>
          </View>
          <Text variant="title" weight="bold" color="success" style={styles.statValue}>
            +{fa(tierInfo.dailyDrip)}
          </Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <Ionicons name="construct" size={12} color={costPremium ? c.crimson : c.steel} />
            <Text variant="label" color="secondary">
              ضریب هزینه ساخت
            </Text>
          </View>
          <Text
            variant="title"
            weight="bold"
            style={[styles.statValue, { color: costPremium ? c.crimson : c.text.primary }]}
          >
            {tierInfo.costMultiplier.toLocaleString('fa-IR')}×
          </Text>
        </View>
      </View>

      {costPremium && (
        <Text variant="caption" color="error" style={styles.premiumNote}>
          هزینه ساخت در این محله به دلیل کیفیت بالاتر، گران‌تر از استاندارد است.
        </Text>
      )}
    </Card>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    // ── compact (HUD glass — §2 recipe, mode-aware) ───────────────────────────
    compactBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.mode === 'dark' ? 'rgba(10, 12, 16, 0.88)' : 'rgba(255, 255, 255, 0.92)',
      alignSelf: 'flex-start',
    },
    compactName: {
      fontSize: Typography.sizes.xs + 1,
    },
    dripPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: Spacing.sm - 2,
      paddingVertical: 2,
      borderRadius: Radii.full,
      backgroundColor: `${c.jade}1A`,
      borderWidth: 1,
      borderColor: `${c.jade}3D`,
    },
    dripText: {
      fontSize: Typography.sizes.xs,
      fontFamily: 'Vazirmatn-SemiBold',
      fontVariant: ['tabular-nums'],
      writingDirection: 'rtl',
    } as TextStyle,

    // ── full card ──────────────────────────────────────────────────────────────
    fullCard: {
      backgroundColor: c.ink[700],
    } as ViewStyle,
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    headerTexts: {
      flex: 1,
      gap: 2,
    },
    tierChip: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: Radii.full,
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.default,
    },
    tierChipText: {
      fontSize: Typography.sizes.xs,
      fontVariant: ['tabular-nums'],
    },
    statsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    statBox: {
      flex: 1,
      backgroundColor: c.ink[600],
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      gap: Spacing.xs + 2,
    },
    statLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
    statValue: {
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    premiumNote: {
      marginTop: -Spacing.xs,
      marginLeft: Spacing.lg,
      marginRight: Spacing.lg,
      marginBottom: Spacing.md,
      textAlign: 'right',
    },
  });
