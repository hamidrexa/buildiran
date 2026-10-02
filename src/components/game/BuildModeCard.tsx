/**
 * BuildIran — BuildModeCard (v2 «Gentleman Neon», dual theme)
 * Option card for Fast / Advanced build mode selection (Step 2 of BuildModal).
 * Selected = brass hairline + brandSoft tint; numerals tabular fa-IR; no emoji.
 */

import React, { useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import { IconPlate } from '@/components/ui/IconPlate';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SUBSIDY_QUOTA_DEFAULT } from '@/lib/constants';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, TextStyle, TouchableOpacity, View } from 'react-native';

// ─── Press-spring touchable (§4 — every touchable springs) ───────────────────

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TouchableScale: React.FC<
  React.ComponentProps<typeof TouchableOpacity>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchable
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, Motion.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Motion.press);
        onPressOut?.(e);
      }}
    />
  );
};

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'brass' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta';

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

interface BuildModeCardProps {
  mode: 'fast' | 'advanced';
  selected: boolean;
  fastCost: number;          // bundled land + build + license
  advancedEstCost: number;   // estimated materials cost (60% of fast)
  licenseFee: number;
  subsidyQuotaRemaining: number;
  onPress: () => void;
}

export function BuildModeCard({
  mode,
  selected,
  fastCost,
  advancedEstCost,
  licenseFee,
  subsidyQuotaRemaining,
  onPress,
}: BuildModeCardProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const isFast = mode === 'fast';
  const quotaPct = Math.min(1, subsidyQuotaRemaining / SUBSIDY_QUOTA_DEFAULT);

  return (
    <TouchableScale
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected && (
        <LinearGradient
          colors={c.gradient.brandSoft}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Top row: icon plate + title + badge */}
      <View style={styles.row}>
        <IconPlate name={isFast ? 'flash' : 'layers'} tone={isFast ? 'ember' : 'steel'} size="md" />
        <View style={styles.titles}>
          <Text variant="subtitle" weight="bold" color="primary">
            {isFast ? 'سریع' : 'پیشرفته'}
          </Text>
          <Text variant="caption" color="secondary">
            {isFast
              ? 'پرداخت فوری — بدون انتظار'
              : 'جمع‌آوری مصالح از بازار یا یارانه'}
          </Text>
        </View>
        <View style={[styles.badge, isFast ? styles.badgeBrass : styles.badgeJade]}>
          <Text variant="label" weight="semibold" color={isFast ? 'brand' : 'success'}>
            {isFast ? 'فوری' : '~۴۰٪ ارزان‌تر'}
          </Text>
        </View>
      </View>

      {/* Cost breakdown */}
      <View style={styles.costBlock}>
        {isFast ? (
          <>
            <CostRow
              label={licenseFee > 0 ? 'زمین + ساخت + مجوز' : 'زمین + ساخت'}
              value={fastCost.toLocaleString('fa-IR')}
              icon="cash"
              tone="brass"
            />
            {licenseFee > 0 && <CostRow label="شامل مجوز کسب‌وکار" value="لحاظ شده" icon="checkmark-circle" tone="jade" />}
            <CostRow label="زمان" value="فوری" icon="flash" tone="ember" />
            <CostRow label="پاداش قدرت" value="کامل ۱۰۰٪" icon="shield" tone="terracotta" />
          </>
        ) : (
          <>
            <CostRow label="تخمین هزینه مصالح" value={`~${advancedEstCost.toLocaleString('fa-IR')}`} icon="cash" tone="brass" />
            {licenseFee > 0 && <CostRow label="مجوز کسب‌وکار" value={licenseFee.toLocaleString('fa-IR')} icon="pricetag" tone="brass" />}
            <CostRow label="زمان" value="گام‌به‌گام" icon="layers" tone="steel" />
            <CostRow label="قدرت (بازار آزاد)" value="۱۰۰٪" icon="checkmark-circle" tone="jade" />
            <CostRow label="قدرت (یارانه)" value="۷۰٪" icon="warning" tone="brass" />
          </>
        )}
      </View>

      {/* Advanced: subsidy quota bar */}
      {!isFast && (
        <View style={styles.quotaBlock}>
          <View style={styles.quotaLabelRow}>
            <Text variant="caption" color="secondary">سهمیه یارانه باقی‌مانده</Text>
            <Text variant="caption" weight="bold" color="primary" style={tabular}>
              {subsidyQuotaRemaining.toLocaleString('fa-IR')} / {SUBSIDY_QUOTA_DEFAULT.toLocaleString('fa-IR')}
            </Text>
          </View>
          <ProgressBar percent={quotaPct * 100} tone="jade" height={5} sheen={false} />
        </View>
      )}

      {selected && <View style={styles.selectedDot} />}
    </TouchableScale>
  );
}

function CostRow({ label, value, icon, tone }: { label: string; value: string; icon: IconName; tone: Tone }) {
  const { colors: c } = useTheme();
  const TONE_COLORS: Record<Tone, string> = {
    brass: c.brass[400],
    jade: c.jade,
    crimson: c.crimson,
    steel: c.steel,
    ember: c.ember,
    terracotta: c.terracotta,
  };
  return (
    <View style={costRowStyles.costRow}>
      <Text variant="caption" color="secondary">{label}</Text>
      <View style={costRowStyles.costValue}>
        <Ionicons name={icon} size={12} color={TONE_COLORS[tone]} />
        <Text variant="caption" weight="semibold" color="primary" style={tabular}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Geometry-only (§2 — may stay module-level)
const costRowStyles = StyleSheet.create({
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.ink[700],
      padding: Spacing.lg - 2,
      gap: Spacing.md - 2,
      overflow: 'hidden',
      position: 'relative',
    },
    cardSelected: {
      borderColor: c.brass[400],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md - 2,
    },
    titles: {
      flex: 1,
      gap: 1,
    },
    badge: {
      borderRadius: Radii.sm,
      borderWidth: 1,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      overflow: 'hidden',
    },
    badgeBrass: {
      backgroundColor: `${c.brass[400]}24`,
      borderColor: c.border.brand,
    },
    badgeJade: {
      backgroundColor: `${c.jade}1F`,
      borderColor: `${c.jade}59`,
    },
    costBlock: { gap: Spacing.xs + 2 },
    quotaBlock: { gap: Spacing.xs + 2, marginTop: 2 },
    quotaLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectedDot: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.brass[400],
    },
  });
