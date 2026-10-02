/**
 * BuildIran — AdvancedBuildMaterialsSheet (v2 «Gentleman Neon», dual theme)
 * Step 3b of the BuildModal flow: tap-to-gather materials from nearby shops or subsidy.
 * Material rows with icon status plates, tabular fa-IR numerals, no emoji in UI chrome.
 * Gather confirmations stay brass — neon is reserved for live signals.
 */

import React, { useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconPlate } from '@/components/ui/IconPlate';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GameAudio } from '@/lib/audio';
import { BUILD_MATERIALS, SUBSIDIZED_POWER_RATIO, SUBSIDY_QUOTA_DEFAULT } from '@/lib/constants';
import { useAssetStore } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import type { BuildMaterialSlot, NearbyShopItem } from '@/types/game.types';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Dimensions, ActivityIndicator, ScrollView, StyleSheet, TextStyle, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

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

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

interface Props {
  buildingType: string;
  slots: BuildMaterialSlot[];
  nearbyShopItems: NearbyShopItem[];
  isLoadingNearby: boolean;
  onGather: (params: {
    slotId: string;
    itemId: string;
    itemNameFa: string;
    qty: number;
    source: 'market' | 'subsidized';
    unitCost: number;
    quotaCostPerUnit: number;
    shopAssetId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  totalCashCost: number;
  totalQuotaUsed: number;
  effectivePowerRatio: number;
  allGathered: boolean;
}

export function AdvancedBuildMaterialsSheet({
  buildingType,
  slots,
  nearbyShopItems,
  isLoadingNearby,
  onGather,
  onConfirm,
  onCancel,
  isConfirming,
  totalCashCost,
  totalQuotaUsed,
  effectivePowerRatio,
  allGathered,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const player = usePlayerStore((s) => s.player);
  const subsidyQuota = player?.subsidyQuota ?? SUBSIDY_QUOTA_DEFAULT;

  const gatheredCount = slots.filter((s) => s.gathered !== null).length;
  const progressPct = slots.length > 0 ? gatheredCount / slots.length : 0;

  return (
    <View style={styles.container}>
      {/* Header + progress */}
      <SectionTitle
        kicker="گام پایانی"
        title="تهیه مصالح"
        trailing={
          <Text variant="caption" color="secondary" style={tabular}>
            {gatheredCount.toLocaleString('fa-IR')} از {slots.length.toLocaleString('fa-IR')}
          </Text>
        }
      />
      <ProgressBar percent={progressPct * 100} tone="brass" height={5} sheen={false} />

      {/* Slots list */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {slots.map((slot) => {
          const matDef = BUILD_MATERIALS.find((m) => m.itemId === slot.itemId);
          const careerCostMultiplier = player?.careerPath === 'real_estate' ? 0.9 : 1.0;
          const discountedSubsidizedCost = Math.round((matDef?.subsidizedUnitCost ?? 0) * careerCostMultiplier);
          const quotaCostPerUnit = matDef?.subsidyQuotaCostPerUnit ?? 0;

          // Find market option from nearby shops
          const shopOption = nearbyShopItems.find(
            (item) => item.itemId === slot.itemId && item.stock >= slot.qtyRequired,
          );
          const discountedShopPrice = shopOption ? Math.round(shopOption.price * careerCostMultiplier) : 0;

          const isGathered = slot.gathered !== null;

          return (
            <View key={slot.slotId} style={[styles.slotCard, isGathered && styles.slotGathered]}>
              {/* Slot info */}
              <View style={styles.slotTop}>
                <View style={styles.slotTitleRow}>
                  <IconPlate
                    name={isGathered ? 'checkmark-circle' : 'cube'}
                    tone={isGathered ? 'jade' : 'steel'}
                    size="xxs"
                    bordered={false}
                  />
                  <Text variant="body" weight="semibold" color={isGathered ? 'brand' : 'primary'}>
                    {slot.nameFa}
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={tabular}>
                  × {slot.qtyRequired.toLocaleString('fa-IR')} واحد
                </Text>
              </View>

              {isGathered ? (
                <View style={styles.gatheredRow}>
                  <Ionicons
                    name={slot.gathered!.source === 'market' ? 'cash' : 'business'}
                    size={12}
                    color={slot.gathered!.source === 'market' ? c.brass[400] : c.jade}
                  />
                  <Text variant="caption" color="secondary" style={tabular}>
                    {slot.gathered!.source === 'market'
                      ? `بازار آزاد — ${(slot.gathered!.unitCost * slot.gathered!.qty).toLocaleString('fa-IR')}`
                      : `یارانه دولتی — سهمیه: ${(slot.gathered!.quotaCost * slot.gathered!.qty).toLocaleString('fa-IR')}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.sourceRow}>
                  {/* Market option */}
                  {isLoadingNearby ? (
                    <ActivityIndicator size="small" color={c.steel} style={styles.loading} />
                  ) : shopOption ? (
                    <TouchableScale
                      style={[styles.sourceBtn, styles.sourceBtnMarket]}
                      onPress={async () => {
                        GameAudio.playTap();
                        await onGather({
                          slotId: slot.slotId,
                          itemId: slot.itemId,
                          itemNameFa: slot.nameFa,
                          qty: slot.qtyRequired,
                          source: 'market',
                          unitCost: discountedShopPrice,
                          quotaCostPerUnit: 0,
                          shopAssetId: shopOption.shopAssetId,
                        });
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="خرید از بازار آزاد"
                    >
                      <View style={styles.sourceTitleRow}>
                        <Ionicons name="storefront" size={13} color={c.brass[400]} />
                        <Text variant="caption" weight="bold" color="primary">بازار آزاد</Text>
                      </View>
                      <Text variant="caption" weight="semibold" color="brand" style={tabular}>
                        {(discountedShopPrice * slot.qtyRequired).toLocaleString('fa-IR')}
                      </Text>
                      <Text style={styles.shopOwner} numberOfLines={1}>{shopOption.shopOwnerUsername}</Text>
                    </TouchableScale>
                  ) : (
                    <View style={[styles.sourceBtn, styles.sourceBtnUnavailable]}>
                      <Text variant="caption" color="muted">مغازه‌ای نزدیک ندارد</Text>
                    </View>
                  )}

                  {/* Subsidy option */}
                  <TouchableScale
                    style={[styles.sourceBtn, styles.sourceBtnSubsidy]}
                    onPress={async () => {
                      const totalQuotaCost = quotaCostPerUnit * slot.qtyRequired;
                      if (subsidyQuota < totalQuotaCost) {
                        GameAudio.playError();
                        return;
                      }
                      GameAudio.playTap();
                      await onGather({
                        slotId: slot.slotId,
                        itemId: slot.itemId,
                        itemNameFa: slot.nameFa,
                        qty: slot.qtyRequired,
                        source: 'subsidized',
                        unitCost: discountedSubsidizedCost,
                        quotaCostPerUnit,
                      });
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="تهیه از یارانه دولتی"
                  >
                    <View style={styles.sourceTitleRow}>
                      <Ionicons name="business" size={13} color={c.jade} />
                      <Text variant="caption" weight="bold" color="primary">یارانه دولتی</Text>
                    </View>
                    <Text variant="caption" weight="semibold" color="success" style={tabular}>
                      سهمیه: {(quotaCostPerUnit * slot.qtyRequired).toLocaleString('fa-IR')}
                    </Text>
                    <Text style={styles.powerNote}>قدرت ۷۰٪</Text>
                  </TouchableScale>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Running totals */}
      <View style={styles.totals}>
        <TotalRow label="هزینه نقدی مصالح" value={totalCashCost.toLocaleString('fa-IR')} icon="cash" />
        <TotalRow
          label="سهمیه مصرف‌شده"
          value={`${totalQuotaUsed.toLocaleString('fa-IR')} / ${subsidyQuota.toLocaleString('fa-IR')}`}
          icon="business"
        />
        <TotalRow
          label="نسبت پاداش قدرت"
          value={`${Math.round(effectivePowerRatio * 100)}٪`}
          icon="flash"
          highlight={effectivePowerRatio < 1}
        />
      </View>

      {/* Confirm row */}
      <View style={styles.confirmRow}>
        <Button label="انصراف" variant="ghost" size="sm" onPress={onCancel} />
        <Button
          label={
            allGathered
              ? 'تأیید و ساخت'
              : `همه مصالح را تهیه کنید (${gatheredCount.toLocaleString('fa-IR')}/${slots.length.toLocaleString('fa-IR')})`
          }
          onPress={allGathered ? onConfirm : () => {}}
          disabled={!allGathered || isConfirming}
          loading={isConfirming}
          style={styles.confirmBtn}
        />
      </View>
    </View>
  );
}

function TotalRow({ label, value, icon, highlight }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; highlight?: boolean }) {
  const { colors: c } = useTheme();
  return (
    <View style={totalRowStyles.totalRow}>
      <View style={totalRowStyles.totalLabel}>
        <Ionicons name={icon} size={12} color={c.text.muted} />
        <Text variant="caption" color="secondary">{label}</Text>
      </View>
      <Text
        variant="caption"
        weight="bold"
        color={highlight ? 'brand' : 'primary'}
        style={tabular}
      >
        {value}
      </Text>
    </View>
  );
}

// Geometry-only (§2 — may stay module-level)
const totalRowStyles = StyleSheet.create({
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { gap: Spacing.md },
    scroll: { maxHeight: SCREEN_H * 0.4, marginHorizontal: -Spacing.sm },
    slotCard: {
      backgroundColor: c.ink[700],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    slotGathered: {
      borderColor: `${c.jade}59`,
      backgroundColor: c.ink[600],
    },
    slotTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    slotTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    gatheredRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    sourceRow: { flexDirection: 'row', gap: Spacing.sm },
    loading: { flex: 1, paddingVertical: Spacing.md },
    sourceBtn: {
      flex: 1,
      borderRadius: Radii.sm,
      borderWidth: 1,
      backgroundColor: c.ink[600],
      padding: Spacing.sm + 2,
      gap: 2,
      minHeight: 44,
    },
    sourceBtnMarket: {
      borderColor: c.border.brand,
    },
    sourceBtnSubsidy: {
      borderColor: `${c.jade}59`,
    },
    sourceBtnUnavailable: {
      backgroundColor: c.ink[700],
      borderColor: c.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    shopOwner: {
      fontSize: 9,
      color: c.text.muted,
      writingDirection: 'ltr' as const,
      textAlign: 'left',
    },
    powerNote: {
      fontSize: 9,
      color: c.brass[400],
    },
    totals: {
      backgroundColor: c.ink[800],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: Spacing.md,
      gap: Spacing.xs + 2,
    },
    confirmRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    confirmBtn: {
      flex: 1,
      minHeight: 44,
    },
  });
