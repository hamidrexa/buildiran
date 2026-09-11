/**
 * BuildIran — AdvancedBuildMaterialsSheet
 * Step 3b of the BuildModal flow: tap-to-gather materials from nearby shops or subsidy.
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { BUILD_MATERIALS, SUBSIDIZED_POWER_RATIO, SUBSIDY_QUOTA_DEFAULT } from '@/lib/constants';
import { useAssetStore } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { BuildMaterialSlot, NearbyShopItem } from '@/types/game.types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const player = usePlayerStore((s) => s.player);
  const subsidyQuota = player?.subsidyQuota ?? SUBSIDY_QUOTA_DEFAULT;

  const gatheredCount = slots.filter((s) => s.gathered !== null).length;
  const progressPct = slots.length > 0 ? gatheredCount / slots.length : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="heading" weight="bold" color="primary">🔨 تهیه مصالح</Text>
          <Text variant="caption" color="secondary">
            {gatheredCount} از {slots.length} مصالح تهیه شده
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text variant="caption" color="secondary">انصراف ✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
      </View>

      {/* Slots list */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {slots.map((slot) => {
          const matDef = BUILD_MATERIALS.find((m) => m.itemId === slot.itemId);
          const subsidizedCost = matDef?.subsidizedUnitCost ?? 0;
          const quotaCostPerUnit = matDef?.subsidyQuotaCostPerUnit ?? 0;

          // Find market option from nearby shops
          const shopOption = nearbyShopItems.find(
            (item) => item.itemId === slot.itemId && item.stock >= slot.qtyRequired,
          );

          const isGathered = slot.gathered !== null;

          return (
            <View key={slot.slotId} style={[styles.slotCard, isGathered && styles.slotGathered]}>
              {/* Slot info */}
              <View style={styles.slotTop}>
                <Text variant="body" weight="semibold" color={isGathered ? 'brand' : 'primary'}>
                  {isGathered ? '✅ ' : '⏳ '}{slot.nameFa}
                </Text>
                <Text variant="caption" color="secondary">
                  × {slot.qtyRequired.toLocaleString('fa-IR')} واحد
                </Text>
              </View>

              {isGathered ? (
                <View style={styles.gatheredRow}>
                  <Text variant="caption" color="secondary">
                    {slot.gathered!.source === 'market' ? '💵 بازار آزاد' : '🏛️ یارانه دولتی'}
                    {' — '}
                    {slot.gathered!.source === 'market'
                      ? `💰 ${(slot.gathered!.unitCost * slot.gathered!.qty).toLocaleString('fa-IR')}`
                      : `سهمیه: ${(slot.gathered!.quotaCost * slot.gathered!.qty).toLocaleString('fa-IR')}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.sourceRow}>
                  {/* Market option */}
                  {isLoadingNearby ? (
                    <ActivityIndicator size="small" color="#60A5FA" style={{ flex: 1 }} />
                  ) : shopOption ? (
                    <TouchableOpacity
                      style={styles.sourceBtn}
                      onPress={async () => {
                        GameAudio.playTap();
                        await onGather({
                          slotId: slot.slotId,
                          itemId: slot.itemId,
                          itemNameFa: slot.nameFa,
                          qty: slot.qtyRequired,
                          source: 'market',
                          unitCost: shopOption.price,
                          quotaCostPerUnit: 0,
                          shopAssetId: shopOption.shopAssetId,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['rgba(96,165,250,0.2)', 'rgba(37,99,235,0.1)']}
                        style={styles.sourceBtnGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        <Text variant="caption" weight="bold" color="primary">💵 بازار آزاد</Text>
                        <Text variant="caption" color="secondary">
                          💰 {(shopOption.price * slot.qtyRequired).toLocaleString('fa-IR')}
                        </Text>
                        <Text style={styles.shopOwner}>{shopOption.shopOwnerUsername}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.sourceBtn, styles.sourceBtnUnavailable]}>
                      <Text variant="caption" color="muted">مغازه‌ای نزدیک ندارد</Text>
                    </View>
                  )}

                  {/* Subsidy option */}
                  <TouchableOpacity
                    style={styles.sourceBtn}
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
                        unitCost: subsidizedCost,
                        quotaCostPerUnit,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(52,211,153,0.2)', 'rgba(16,185,129,0.1)']}
                      style={styles.sourceBtnGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Text variant="caption" weight="bold" color="primary">🏛️ یارانه دولتی</Text>
                      <Text variant="caption" color="secondary">
                        سهمیه: {(quotaCostPerUnit * slot.qtyRequired).toLocaleString('fa-IR')}
                      </Text>
                      <Text style={styles.powerNote}>قدرت ۷۰٪</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Running totals */}
      <View style={styles.totals}>
        <TotalRow label="هزینه نقدی مصالح" value={`💰 ${totalCashCost.toLocaleString('fa-IR')}`} />
        <TotalRow label="سهمیه مصرف‌شده" value={`${totalQuotaUsed.toLocaleString('fa-IR')} / ${subsidyQuota.toLocaleString('fa-IR')}`} />
        <TotalRow
          label="نسبت پاداش قدرت"
          value={`${Math.round(effectivePowerRatio * 100)}٪`}
          highlight={effectivePowerRatio < 1}
        />
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirmBtn, !allGathered && styles.confirmBtnDisabled]}
        onPress={allGathered ? onConfirm : undefined}
        activeOpacity={0.85}
        disabled={!allGathered || isConfirming}
      >
        <LinearGradient
          colors={allGathered ? ['#6C63FF', '#A78BFA'] : ['#374151', '#1F2937']}
          style={styles.confirmGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {isConfirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text weight="semibold" color="inverse">
              {allGathered ? '🏗️ تأیید و ساخت' : `همه مصالح را تهیه کنید (${gatheredCount}/${slots.length})`}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text variant="caption" color="secondary">{label}</Text>
      <Text variant="caption" weight="bold" style={highlight ? { color: '#F59E0B' } : undefined} color="primary">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 4 },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressTrack: {
    height: 5,
    marginHorizontal: 20,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6C63FF',
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  slotCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  slotGathered: {
    borderColor: 'rgba(52,211,153,0.35)',
    backgroundColor: 'rgba(52,211,153,0.07)',
  },
  slotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gatheredRow: {},
  sourceRow: { flexDirection: 'row', gap: 8 },
  sourceBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  sourceBtnUnavailable: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBtnGrad: { padding: 10, gap: 2 },
  shopOwner: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  powerNote: { fontSize: 9, color: '#F59E0B', marginTop: 2 },
  totals: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn: { marginHorizontal: 20, borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmGrad: { paddingVertical: 15, alignItems: 'center' },
});
