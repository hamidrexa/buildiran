/**
 * BuildIran — Neighborhood Evaluation Modal — «Gentleman Neon» (v2)
 * Detailed district assessment shown when the player taps «ارزیابی محله».
 * Sheet with evaluation metric cards (IconPlate + tabular numerals),
 * governance status, approved custom building rows, and two big option rows
 * (LocationActionModal pattern) as the CTAs. The «احداث ملک» row keeps the
 * brass primary treatment; nothing glows here (passive/admin surface).
 * Tier colors from constants carry forbidden hexes — tier resolves to
 * IconPlate tones and c.tier[n] tokens at render.
 * Public props (visible, coordinate, onProceedToBuild, onOpenEditorPanel,
 * onClose) and all data-flow logic are unchanged.
 */

import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { Card } from '@/components/ui/Card';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Radii, Spacing, Typography, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { GameAudio } from '@/lib/audio';
import { useAssetStore } from '@/store/useAssetStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { LatLng, Neighborhood } from '@/types/game.types';
import { haversineDistance } from '@/utils/geo';
import { getNeighborhoodTier } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type PlateTone = React.ComponentProps<typeof IconPlate>['tone'];
type PlateIcon = React.ComponentProps<typeof IconPlate>['name'];

/** Tier index → allowed tone / Ionicon (constants' tier palette has forbidden hexes). */
const TIER_TONES: readonly PlateTone[] = ['neutral', 'jade', 'steel', 'steel', 'ember', 'brass'];
const TIER_ICONS: readonly PlateIcon[] = ['home', 'leaf', 'business', 'school', 'medal', 'diamond'];

const fa = (n: number) => n.toLocaleString('fa-IR');

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

interface NeighborhoodEvaluationModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  onProceedToBuild: () => void;
  onOpenEditorPanel?: () => void;
  onClose: () => void;
}

export const NeighborhoodEvaluationModal: React.FC<NeighborhoodEvaluationModalProps> = ({
  visible,
  coordinate,
  onProceedToBuild,
  onOpenEditorPanel,
  onClose,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const player = usePlayerStore((s) => s.player);
  const neighborhoods = useNeighborhoodStore((s) => s.neighborhoods);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const approvedCustomTypes = useNeighborhoodStore((s) => s.approvedCustomTypes);
  const assetsMap = useAssetStore((s) => s.assets);

  // Find nearest neighborhood if current one is distant
  const activeNeighborhood: Neighborhood | null = useMemo(() => {
    if (!coordinate) return currentNeighborhood;
    if (neighborhoods.length === 0) return currentNeighborhood;

    let closest = neighborhoods[0];
    let minDist = Infinity;
    for (const n of neighborhoods) {
      const dist = haversineDistance(coordinate, {
        latitude: n.centerLat,
        longitude: n.centerLng,
      });
      if (dist < minDist) {
        minDist = dist;
        closest = n;
      }
    }
    return closest;
  }, [coordinate, neighborhoods, currentNeighborhood]);

  const distanceKm = useMemo(() => {
    if (!coordinate || !activeNeighborhood) return 0;
    const d = haversineDistance(coordinate, {
      latitude: activeNeighborhood.centerLat,
      longitude: activeNeighborhood.centerLng,
    });
    return Math.round(d * 10) / 10;
  }, [coordinate, activeNeighborhood]);

  // Compute building density in this neighborhood
  const districtBuildingsCount = useMemo(() => {
    if (!activeNeighborhood) return 0;
    const list = Object.values(assetsMap);
    return list.filter((a) => {
      const d = haversineDistance(
        { latitude: a.latitude, longitude: a.longitude },
        { latitude: activeNeighborhood.centerLat, longitude: activeNeighborhood.centerLng }
      );
      return d <= (activeNeighborhood.radiusKm || 5);
    }).length;
  }, [assetsMap, activeNeighborhood]);

  if (!coordinate || !activeNeighborhood) return null;

  const isEditor = player ? player.power >= activeNeighborhood.minEditorPower : false;

  const amenityScore = activeNeighborhood.amenityScore ?? 0;
  const tierInfo = getNeighborhoodTier(amenityScore);
  const tierIndex = Math.min(Math.max(tierInfo.tier, 0), TIER_TONES.length - 1);
  const tierTone: PlateTone = TIER_TONES[tierIndex];
  const tierIcon: PlateIcon = TIER_ICONS[tierIndex];
  const tierColor = c.tier[tierIndex];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`گزارش ارزیابی محله «${activeNeighborhood.nameFa}»`}
      subtitle={`شهر ${activeNeighborhood.city} • فاصله تا هسته مرکزی: ${fa(distanceKm)} کیلومتر`}
      maxHeight={0.85}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Description */}
        {activeNeighborhood.descriptionFa ? (
          <Card>
            <Text variant="body" color="secondary">
              {activeNeighborhood.descriptionFa}
            </Text>
          </Card>
        ) : null}

        {/* Development metrics */}
        <SectionTitle kicker="شاخص‌ها" title="توسعه و پتانسیل سرمایه‌گذاری" />
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <IconPlate name="stats-chart" size="sm" tone="brass" />
            <Text variant="caption" color="secondary">
              امتیاز امکانات
            </Text>
            <Text variant="subtitle" weight="bold" style={styles.metricValue}>
              {fa(amenityScore)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <IconPlate name={tierIcon} size="sm" tone={tierTone} />
            <Text variant="caption" color="secondary">
              سطح امکانات محله
            </Text>
            <Text
              variant="subtitle"
              weight="bold"
              style={[styles.metricValue, { color: tierColor }]}
            >
              {tierInfo.nameFa}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <IconPlate name="business" size="sm" tone="steel" />
            <Text variant="caption" color="secondary">
              تراکم سازه‌ها
            </Text>
            <Text variant="subtitle" weight="bold" style={styles.metricValue}>
              {fa(districtBuildingsCount)} سازه
            </Text>
          </View>

          <View style={styles.metricCard}>
            <IconPlate name="flash" size="sm" tone="terracotta" />
            <Text variant="caption" color="secondary">
              حداقل قدرت ویرایشگر
            </Text>
            <Text variant="subtitle" weight="bold" style={styles.metricValue}>
              +{fa(activeNeighborhood.minEditorPower)}
            </Text>
          </View>
        </View>

        {/* Governance / Editor status */}
        <SectionTitle kicker="نظارت" title="وضعیت ویرایشگری محله" />
        <Card>
          <View style={styles.editorRow}>
            <IconPlate
              name={isEditor ? 'shield-checkmark' : 'lock-closed'}
              size="sm"
              tone={isEditor ? 'jade' : 'neutral'}
            />
            <View style={styles.editorTexts}>
              <Text variant="body" weight="semibold">
                ویرایشگری و نظارت محله
              </Text>
              <Text variant="caption" color="secondary">
                {isEditor
                  ? 'شما به عنوان ویرایشگر واجد شرایط این محله دارای حق رأی هستید.'
                  : `نیاز به حداقل ${fa(activeNeighborhood.minEditorPower)} امتیاز قدرت نفوذ (قدرت فعلی شما: ${fa(player?.power ?? 0)})`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Approved custom buildings */}
        {approvedCustomTypes.length > 0 && (
          <View style={styles.customSection}>
            <SectionTitle
              kicker="سازه‌های اختصاصی"
              title="تأییدشده در این منطقه"
              trailing={<Text variant="caption" color="muted" style={styles.tabular}>{fa(approvedCustomTypes.length)}</Text>}
            />
            <View style={styles.customList}>
              {approvedCustomTypes.map((cb) => (
                <View key={cb.id} style={styles.customRow}>
                  <IconPlate name="business" size="sm" tone="jade" />
                  <View style={styles.customTexts}>
                    <Text variant="body" weight="medium" numberOfLines={1}>
                      {cb.nameFa}
                    </Text>
                    <Text variant="caption" color="muted">
                      دسته‌بندی: {cb.category}
                    </Text>
                  </View>
                  <Text variant="caption" weight="bold" color="brand" style={styles.tabular}>
                    {fa(cb.baseCost)}
                  </Text>
                  <Ionicons name="cash" size={13} color={c.brass[400]} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Option rows — LocationActionModal pattern */}
        <View style={styles.options}>
          {/* Choice 1: احداث ملک — the one primary action, brass */}
          <Animated.View entering={FadeInDown.delay(Motion.stagger(0)).duration(Motion.durations.normal)}>
            <TouchableScale
              style={[styles.optionRow, styles.optionRowPrimary]}
              onPress={() => {
                GameAudio.playTap();
                onProceedToBuild();
              }}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="احداث ملک در این موقعیت"
            >
              <IconPlate name="construct" tone="brass" size="lg" />
              <View style={styles.optionTexts}>
                <View style={styles.optionTitleRow}>
                  <Text variant="subtitle" weight="semibold">
                    احداث ملک در این موقعیت
                  </Text>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>بررسی حریم ۵ متری</Text>
                  </View>
                </View>
                <Text variant="caption" color="secondary" numberOfLines={2}>
                  ادامه به حالت ساخت با استعلام خودکار حریم ۵ متری از خیابان‌ها
                </Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={c.text.secondary} />
            </TouchableScale>
          </Animated.View>

          {/* Choice 2: پنل بازبینی ویرایشگر (editors only) */}
          {isEditor && onOpenEditorPanel && (
            <Animated.View entering={FadeInDown.delay(Motion.stagger(1)).duration(Motion.durations.normal)}>
              <TouchableScale
                style={styles.optionRow}
                onPress={() => {
                  onClose();
                  onOpenEditorPanel();
                }}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="پنل بازبینی ویرایشگر"
              >
                <IconPlate name="shield-checkmark" tone="steel" size="lg" />
                <View style={styles.optionTexts}>
                  <View style={styles.optionTitleRow}>
                    <Text variant="subtitle" weight="semibold">
                      پنل بازبینی ویرایشگر
                    </Text>
                  </View>
                  <Text variant="caption" color="secondary" numberOfLines={2}>
                    بررسی و تأیید طرح‌های پیشنهادی بازیکنان در این محله
                  </Text>
                </View>
                  <Ionicons name="chevron-back" size={18} color={c.text.secondary} />
              </TouchableScale>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    scrollContent: {
      gap: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    tabular: {
      fontVariant: ['tabular-nums'],
    },

    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    metricCard: {
      width: '47%',
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      gap: Spacing.xs + 2,
      alignItems: 'flex-start',
    },
    metricValue: {
      fontVariant: ['tabular-nums'],
    },

    editorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    editorTexts: {
      flex: 1,
      gap: 2,
    },

    customSection: {
      gap: Spacing.md,
    },
    customList: {
      gap: Spacing.sm,
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.ink[700],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      minHeight: 44,
    },
    customTexts: {
      flex: 1,
      gap: 1,
    },

    options: {
      gap: Spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      minHeight: 44,
    },
    /** «احداث ملک» — the primary CTA keeps the brass treatment (no neon). */
    optionRowPrimary: {
      backgroundColor: `${c.brass[400]}0F`,
      borderColor: c.border.brand,
    },
    optionTexts: {
      flex: 1,
      gap: 2,
    },
    optionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    metaChip: {
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    metaChipText: {
      fontSize: Typography.sizes.xs,
      color: c.text.secondary,
    },
  });
