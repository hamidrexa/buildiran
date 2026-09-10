/**
 * BuildIran — InstitutionServiceModal
 * Unified modal for all institution interactions (client side).
 * Dynamically adapts to any institutionType: shows conversion formula,
 * cost/gain preview, provider info, and handles the use_institution RPC.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { showAlert } from '@/lib/alert';
import { useEconomyStore } from '@/store/useEconomyStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { INSTITUTION_DEFINITIONS } from '@/lib/constants';
import { useFloatIn, useScalePop } from '@/lib/effects';
import Animated from 'react-native-reanimated';
import type { Asset, InstitutionType } from '@/types/game.types';
import t from '@/i18n';

const lang = t();

// ─── Stat label helper ────────────────────────────────────────────────────────

function statLabel(stat: string): string {
  if (stat === 'cash')     return lang.economy.institution.stat_cash;
  if (stat === 'activity') return lang.economy.institution.stat_activity;
  if (stat === 'power')    return lang.economy.institution.stat_power;
  return stat;
}

// ─── Conversion Arrow Row ─────────────────────────────────────────────────────

const ConversionRow: React.FC<{
  fromLabel: string;
  fromAmount: number;
  toLabel: string;
  toAmount: number;
  fromColor: string;
  toColor: string;
}> = ({ fromLabel, fromAmount, toLabel, toAmount, fromColor, toColor }) => (
  <View style={convStyles.row}>
    <View style={[convStyles.pill, { borderColor: fromColor }]}>
      <Text variant="body" weight="bold" style={{ color: fromColor }}>
        {fromAmount.toLocaleString('fa-IR')}
      </Text>
      <Text variant="caption" color="secondary">{fromLabel}</Text>
    </View>
    <Text variant="heading" color="secondary" style={convStyles.arrow}>←</Text>
    <View style={[convStyles.pill, { borderColor: toColor }]}>
      <Text variant="body" weight="bold" style={{ color: toColor }}>
        +{toAmount.toLocaleString('fa-IR')}
      </Text>
      <Text variant="caption" color="secondary">{toLabel}</Text>
    </View>
  </View>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  asset: Asset;
  institutionType: InstitutionType;
  onClose: () => void;
}

export const InstitutionServiceModal: React.FC<Props> = ({
  visible,
  asset,
  institutionType,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const useInstitution = useEconomyStore((s) => s.useInstitution);
  const resolveExchangeRate = useEconomyStore((s) => s.resolveExchangeRate);
  const exchangeActivity = useEconomyStore((s) => s.exchangeActivity);
  const player = usePlayerStore((s) => s.player);
  const { style: floatStyle } = useFloatIn(0);
  const { style: btnStyle, pop } = useScalePop();

  // Exchange specific state
  const isExchange = institutionType === 'exchange';
  const [exchangeRateKey, setExchangeRateKey] = useState<'base' | 'ownerBonus' | 'establishedBusiness'>('base');
  const [selectedActivityAmount, setSelectedActivityAmount] = useState<number>(10);

  // Fetch exchange rate on mount
  React.useEffect(() => {
    if (visible && isExchange && player?.id) {
      resolveExchangeRate(player.id).then((rate) => {
        setExchangeRateKey(rate);
      });
      // Default to min(10, player.activity) or 5
      setSelectedActivityAmount(Math.max(1, Math.min(10, player?.activity ?? 10)));
    }
  }, [visible, isExchange, player?.id, resolveExchangeRate]);

  const def = INSTITUTION_DEFINITIONS[institutionType];
  if (!def) return null;

  // Compute active conversion amounts (dynamic for exchange, static for standard institutions)
  const activeRate = isExchange ? (exchangeRateKey === 'establishedBusiness' ? 5 : exchangeRateKey === 'ownerBonus' ? 3.5 : 2) : 1;
  const clientCostAmount = isExchange ? selectedActivityAmount : def.clientCost.amount;
  const clientGainAmount = isExchange ? Math.floor(selectedActivityAmount * activeRate) : def.clientGain.amount;

  // Colour coding by stat type
  const costColor  = def.clientCost.stat === 'cash' ? '#FFD700' : '#FB923C';
  const gainColor  = def.clientGain.stat === 'power' ? '#A78BFA' : '#FFD700';

  // Affordability check
  const canAfford = player
    ? def.clientCost.stat === 'cash'
      ? player.cash >= clientCostAmount
      : player.activity >= clientCostAmount
    : false;

  const handleUse = async () => {
    if (!canAfford) {
      GameAudio.playError?.();
      showAlert(
        '⚠️',
        def.clientCost.stat === 'cash'
          ? lang.economy.institution.errorInsufficientCash
          : lang.economy.institution.errorInsufficientActivity,
      );
      return;
    }
    pop();
    GameAudio.playTap();
    setLoading(true);
    try {
      if (isExchange) {
        const ok = await exchangeActivity(selectedActivityAmount, exchangeRateKey);
        if (ok) {
          GameAudio.playBuild?.();
          showAlert(
            '🏦 بورس مبادلات',
            `تبدیل موفق! ${selectedActivityAmount.toLocaleString('fa-IR')} امتیاز فعالیت به ${clientGainAmount.toLocaleString('fa-IR')} 💰 تبدیل شد.`,
          );
          onClose();
        } else {
          GameAudio.playError?.();
          showAlert('❌', 'خطا در انجام مبادله. لطفاً دوباره تلاش کنید.');
        }
      } else {
        const result = await useInstitution(asset.id, institutionType);
        if (result.success) {
          GameAudio.playBuild?.();
          const gainMsg =
            result.clientGainStat === 'power'
              ? `${lang.economy.institution.successPower} +${result.clientGainAmount}`
              : `${lang.economy.institution.successCash} +${result.clientGainAmount.toLocaleString('fa-IR')}`;
          showAlert(def.emoji + ' ' + def.nameFa, gainMsg);
          onClose();
        } else {
          GameAudio.playError?.();
          showAlert('❌', lang.economy.institution.errorInsufficientCash);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, floatStyle]}>
          <LinearGradient
            colors={['#0D1533', '#0A0E1F']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text variant="heading" style={styles.emoji}>{def.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="title" weight="bold" color="primary">{def.nameFa}</Text>
                {asset.ownerUsername ? (
                  <Text variant="caption" color="secondary">
                    {lang.economy.institution.ownerLabel}: {asset.ownerUsername}
                  </Text>
                ) : (
                  <Text variant="caption" color="secondary">موسسه عمومی شهر</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text variant="body" color="secondary">✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dynamic Exchange Rate Tier Banner */}
              {isExchange && (
                <View style={exchangeStyles.tierCard}>
                  <View style={exchangeStyles.tierHeader}>
                    <Text variant="caption" weight="bold" color="primary">
                      {exchangeRateKey === 'establishedBusiness'
                        ? '🌟 نرخ کسب‌وکار مستقر'
                        : exchangeRateKey === 'ownerBonus'
                        ? '🏪 بونوس مالک کسب‌وکار'
                        : '🚶‍♂️ نرخ پایه مبادله'}
                    </Text>
                    <View style={exchangeStyles.rateChip}>
                      <Text variant="caption" weight="bold" style={{ color: '#10B981' }}>
                        هر ۱ 🔥 = {activeRate.toLocaleString('fa-IR')} 💰
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                    {exchangeRateKey === 'establishedBusiness'
                      ? 'دارای کسب‌وکار سطح ۲ به بالا با تراکنش فعال (حداکثر سود)'
                      : exchangeRateKey === 'ownerBonus'
                      ? 'مالک کسب‌وکار در شهر (پاداش کارآفرینی)'
                      : 'برای نرخ بالاتر (تا ۵ برابر)، یک مغازه، کافه یا درمانگاه تأسیس کنید.'}
                  </Text>

                  {/* Activity Amount Quick Selectors */}
                  <Text variant="label" color="secondary" style={[styles.sectionLabel, { marginTop: 12 }]}>
                    میزان فعالیت جهت تبدیل:
                  </Text>
                  <View style={exchangeStyles.amountsRow}>
                    {[5, 10, 25, 50].map((amt) => {
                      const isSelected = selectedActivityAmount === amt;
                      const hasEnough = (player?.activity ?? 0) >= amt;
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            exchangeStyles.amtPill,
                            isSelected && exchangeStyles.amtPillSelected,
                            !hasEnough && exchangeStyles.amtPillDisabled,
                          ]}
                          onPress={() => setSelectedActivityAmount(amt)}
                        >
                          <Text
                            variant="caption"
                            weight="bold"
                            style={{ color: isSelected ? '#fff' : hasEnough ? '#CBD5E1' : '#64748B' }}
                          >
                            {amt.toLocaleString('fa-IR')} 🔥
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {/* Max button */}
                    {(player?.activity ?? 0) > 0 && (
                      <TouchableOpacity
                        style={[
                          exchangeStyles.amtPill,
                          selectedActivityAmount === player?.activity && exchangeStyles.amtPillSelected,
                        ]}
                        onPress={() => setSelectedActivityAmount(player?.activity ?? 1)}
                      >
                        <Text variant="caption" weight="bold" color="inverse">همه</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Conversion formula */}
              <Text variant="label" color="secondary" style={styles.sectionLabel}>
                {lang.economy.institution.conversionFormula}
              </Text>
              <ConversionRow
                fromLabel={statLabel(def.clientCost.stat)}
                fromAmount={clientCostAmount}
                toLabel={statLabel(def.clientGain.stat)}
                toAmount={clientGainAmount}
                fromColor={costColor}
                toColor={gainColor}
              />

              {/* Provider side (if applicable) */}
              {!isExchange && def.providerCost && def.providerGainPercent && (
                <>
                  <View style={styles.divider} />
                  <Text variant="label" color="secondary" style={styles.sectionLabel}>
                    {lang.economy.institution.providerEarns}
                  </Text>
                  <View style={convStyles.providerRow}>
                    <Text variant="caption" color="secondary">
                      🏪 {Math.floor(def.clientCost.amount * (def.providerGainPercent / 100)).toLocaleString('fa-IR')} {lang.economy.institution.stat_cash}
                    </Text>
                    <Text variant="caption" color="secondary">
                      (−{def.providerCost.amount} {lang.economy.institution.stat_activity})
                    </Text>
                  </View>
                </>
              )}

              {/* Player balance */}
              <View style={styles.divider} />
              <View style={styles.balanceRow}>
                <Text variant="caption" color="secondary">
                  💰 {(player?.cash ?? 0).toLocaleString('fa-IR')}
                </Text>
                <Text variant="caption" color="secondary">
                  🔥 {(player?.activity ?? 0).toLocaleString('fa-IR')}
                </Text>
                <Text variant="caption" color="secondary">
                  ⚔️ {(player?.power ?? 0).toLocaleString('fa-IR')}
                </Text>
              </View>
            </ScrollView>

            {/* CTA */}
            <Animated.View style={[styles.ctaWrap, btnStyle]}>
              <TouchableOpacity
                style={[styles.cta, !canAfford && styles.ctaDisabled]}
                onPress={handleUse}
                disabled={loading || !canAfford}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canAfford ? (isExchange ? ['#10B981', '#059669'] : ['#6C63FF', '#8B5CF6']) : ['#3a3a4a', '#2a2a3a']}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text variant="body" weight="bold" color="inverse">
                      {canAfford
                        ? isExchange
                          ? `تبدیل ${clientCostAmount.toLocaleString('fa-IR')} فعالیت به ${clientGainAmount.toLocaleString('fa-IR')} سکه`
                          : lang.economy.institution.useService
                        : def.clientCost.stat === 'cash'
                        ? lang.economy.institution.errorInsufficientCash
                        : lang.economy.institution.errorInsufficientActivity}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '75%',
  },
  gradient: {
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 32 },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  sectionLabel: { marginBottom: 8 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
  },
  ctaWrap: { marginTop: 8 },
  cta: { borderRadius: 16, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

const convStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pill: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  arrow: { fontSize: 22 },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },
});

const exchangeStyles = StyleSheet.create({
  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginBottom: 8,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateChip: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  amountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  amtPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  amtPillSelected: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  amtPillDisabled: {
    opacity: 0.4,
  },
});
