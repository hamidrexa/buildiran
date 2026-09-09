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
  const player = usePlayerStore((s) => s.player);
  const { style: floatStyle } = useFloatIn(0);
  const { style: btnStyle, pop } = useScalePop();

  const def = INSTITUTION_DEFINITIONS[institutionType];
  if (!def) return null;

  // Colour coding by stat type
  const costColor  = def.clientCost.stat === 'cash' ? '#FFD700' : '#FB923C';
  const gainColor  = def.clientGain.stat === 'power' ? '#A78BFA' : '#FFD700';

  // Affordability check
  const canAfford = player
    ? def.clientCost.stat === 'cash'
      ? player.cash >= def.clientCost.amount
      : player.activity >= def.clientCost.amount
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
                {asset.ownerUsername && (
                  <Text variant="caption" color="secondary">
                    {lang.economy.institution.ownerLabel}: {asset.ownerUsername}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text variant="body" color="secondary">✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Conversion formula */}
              <Text variant="label" color="secondary" style={styles.sectionLabel}>
                {lang.economy.institution.conversionFormula}
              </Text>
              <ConversionRow
                fromLabel={statLabel(def.clientCost.stat)}
                fromAmount={def.clientCost.amount}
                toLabel={statLabel(def.clientGain.stat)}
                toAmount={def.clientGain.amount}
                fromColor={costColor}
                toColor={gainColor}
              />

              {/* Provider side (if applicable) */}
              {def.providerCost && def.providerGainPercent && (
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
                  colors={canAfford ? ['#6C63FF', '#8B5CF6'] : ['#3a3a4a', '#2a2a3a']}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text variant="body" weight="bold" color="inverse">
                      {canAfford
                        ? lang.economy.institution.useService
                        : lang.economy.institution.errorInsufficientCash}
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
