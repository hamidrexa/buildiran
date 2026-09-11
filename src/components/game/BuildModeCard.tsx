/**
 * BuildIran — BuildModeCard
 * Reusable card for Fast / Advanced build mode selection (Step 2 of BuildModal).
 */

import { Text } from '@/components/ui/Text';
import { SUBSIDY_QUOTA_DEFAULT } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const isFast = mode === 'fast';
  const quotaPct = Math.min(1, subsidyQuotaRemaining / SUBSIDY_QUOTA_DEFAULT);

  const borderColor = selected
    ? isFast ? '#F59E0B' : '#34D399'
    : 'rgba(255,255,255,0.1)';

  const gradientColors: [string, string] = selected
    ? isFast
      ? ['rgba(245,158,11,0.18)', 'rgba(217,119,6,0.10)']
      : ['rgba(52,211,153,0.18)', 'rgba(16,185,129,0.10)']
    : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.card, { borderColor }]}
    >
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Top row: icon + title + badge */}
      <View style={styles.row}>
        <Text variant="display" color="brand">{isFast ? '⚡' : '🔨'}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="title" weight="bold" color="primary">
            {isFast ? 'سریع' : 'پیشرفته'}
          </Text>
          <Text variant="caption" color="secondary">
            {isFast
              ? 'پرداخت فوری — بدون انتظار'
              : 'جمع‌آوری مصالح از بازار یا یارانه'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isFast ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)' }]}>
          <Text variant="caption" weight="bold" style={{ color: isFast ? '#F59E0B' : '#34D399' }}>
            {isFast ? 'فوری' : '~۴۰٪ ارزان‌تر'}
          </Text>
        </View>
      </View>

      {/* Cost breakdown */}
      <View style={styles.costBlock}>
        {isFast ? (
          <>
            <CostRow label={licenseFee > 0 ? "زمین + ساخت + مجوز" : "زمین + ساخت"} value={`💰 ${fastCost.toLocaleString('fa-IR')}`} />
            {licenseFee > 0 && <CostRow label="شامل مجوز کسب‌وکار" value={`✅ لحاظ شده`} />}
            <CostRow label="زمان" value="⚡ فوری" />
            <CostRow label="پاداش قدرت" value="✅ کامل ۱۰۰٪" />
          </>
        ) : (
          <>
            <CostRow label="تخمین هزینه مصالح" value={`💰 ~${advancedEstCost.toLocaleString('fa-IR')}`} />
            {licenseFee > 0 && <CostRow label="مجوز کسب‌وکار" value={`💰 ${licenseFee.toLocaleString('fa-IR')}`} />}
            <CostRow label="زمان" value="🔨 گام‌به‌گام" />
            <CostRow label="قدرت (بازار آزاد)" value="✅ ۱۰۰٪" />
            <CostRow label="قدرت (یارانه)" value="⚠️ ۷۰٪" />
          </>
        )}
      </View>

      {/* Advanced: subsidy quota bar */}
      {!isFast && (
        <View style={styles.quotaBlock}>
          <View style={styles.quotaLabelRow}>
            <Text variant="caption" color="secondary">سهمیه یارانه باقی‌مانده</Text>
            <Text variant="caption" weight="bold" color="primary">
              {subsidyQuotaRemaining.toLocaleString('fa-IR')} / {SUBSIDY_QUOTA_DEFAULT.toLocaleString('fa-IR')}
            </Text>
          </View>
          <View style={styles.quotaTrack}>
            <View style={[styles.quotaFill, { width: `${Math.round(quotaPct * 100)}%` }]} />
          </View>
        </View>
      )}

      {selected && (
        <View style={[styles.selectedDot, { backgroundColor: isFast ? '#F59E0B' : '#34D399' }]} />
      )}
    </TouchableOpacity>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.costRow}>
      <Text variant="caption" color="secondary">{label}</Text>
      <Text variant="caption" weight="semibold" color="primary">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  costBlock: { gap: 4 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaBlock: { gap: 4, marginTop: 2 },
  quotaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quotaTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  quotaFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
