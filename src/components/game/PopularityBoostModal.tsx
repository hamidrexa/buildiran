/**
 * BuildIran — PopularityBoostModal
 * Lets a business owner spend popularity for 2× income on one of their assets.
 * Cost = 10 × asset.level. Duration = 24 hours. Non-stackable.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { showAlert } from '@/lib/alert';
import { useEconomyStore } from '@/store/useEconomyStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { POPULARITY_BOOST_DURATION_HOURS, POPULARITY_BOOST_MULTIPLIER } from '@/lib/constants';
import { useFloatIn, useScalePop } from '@/lib/effects';
import type { Asset } from '@/types/game.types';
import t from '@/i18n';

const lang = t();

// ─── Countdown helper ─────────────────────────────────────────────────────────

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '۰:۰۰:۰۰';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toLocaleString('fa-IR')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  asset: Asset;
  onClose: () => void;
}

export const PopularityBoostModal: React.FC<Props> = ({ visible, asset, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const activateBoost  = useEconomyStore((s) => s.activateBoost);
  const isAssetBoosted = useEconomyStore((s) => s.isAssetBoosted);
  const activeBoosts   = useEconomyStore((s) => s.activeBoosts);
  const getBoostCost   = useEconomyStore((s) => s.getBoostCost);
  const player         = usePlayerStore((s) => s.player);

  const { style: floatStyle } = useFloatIn(0);
  const { style: btnStyle, pop } = useScalePop();

  const cost      = getBoostCost(asset.level);
  const boosted   = isAssetBoosted(asset.id);
  const boost     = activeBoosts[asset.id];
  const canAfford = (player?.popularity ?? 0) >= cost;

  // Live countdown timer
  useEffect(() => {
    if (!boosted || !boost) return;
    setCountdown(formatCountdown(boost.expiresAt));
    const timer = setInterval(() => {
      setCountdown(formatCountdown(boost.expiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [boosted, boost]);

  const handleActivate = async () => {
    if (!canAfford) {
      GameAudio.playError?.();
      showAlert('⚠️', lang.economy.boost.errorPop);
      return;
    }
    pop();
    GameAudio.playTap();
    setLoading(true);
    try {
      const result = await activateBoost(asset.id);
      if (result.success) {
        GameAudio.playBuild?.();
        showAlert('🚀', lang.economy.boost.successMsg);
        onClose();
      } else {
        GameAudio.playError?.();
        showAlert('❌', lang.economy.boost.errorPop);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, floatStyle]}>
          <LinearGradient colors={['#0D1533', '#0A0E1F']} style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>🚀</Text>
              <View style={{ flex: 1 }}>
                <Text variant="title" weight="bold" color="primary">
                  {lang.economy.boost.title}
                </Text>
                <Text variant="caption" color="secondary">
                  {lang.economy.boost.subtitle}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text variant="body" color="secondary">✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Active boost status */}
            {boosted && boost ? (
              <View style={styles.activeCard}>
                <LinearGradient
                  colors={['rgba(251,146,60,0.15)', 'rgba(251,146,60,0.05)']}
                  style={styles.activeCardInner}
                >
                  <Text variant="body" weight="bold" style={{ color: '#FB923C' }}>
                    {lang.economy.boost.alreadyActive}
                  </Text>
                  <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                    {lang.economy.boost.remainingTime}: {countdown}
                  </Text>
                </LinearGradient>
              </View>
            ) : null}

            {/* Stat rows */}
            <View style={styles.statGrid}>
              <StatRow
                label={lang.economy.boost.cost}
                value={`${cost.toLocaleString('fa-IR')} ⭐`}
                sub={lang.economy.boost.costFormula}
                color="#34D399"
              />
              <StatRow
                label={lang.economy.boost.duration}
                value={lang.economy.boost.durationValue}
                color="#60A5FA"
              />
              <StatRow
                label={lang.economy.boost.yourPopularity}
                value={`${(player?.popularity ?? 0).toLocaleString('fa-IR')} ⭐`}
                color={canAfford ? '#34D399' : '#EF4444'}
              />
              <StatRow
                label="ضریب درآمد"
                value={`${POPULARITY_BOOST_MULTIPLIER}×`}
                color="#A78BFA"
              />
            </View>

            {/* CTA */}
            <Animated.View style={[styles.ctaWrap, btnStyle]}>
              <TouchableOpacity
                style={[styles.cta, (!canAfford || boosted) && styles.ctaDisabled]}
                onPress={handleActivate}
                disabled={loading || !canAfford || boosted}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canAfford && !boosted ? ['#FB923C', '#F59E0B'] : ['#3a3a4a', '#2a2a3a']}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text variant="body" weight="bold" color="inverse">
                      {boosted
                        ? lang.economy.boost.alreadyActive
                        : lang.economy.boost.activate}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatRow: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({
  label, value, sub, color = '#fff',
}) => (
  <View style={statRowStyles.row}>
    <View>
      <Text variant="caption" color="secondary">{label}</Text>
      {sub && <Text variant="caption" color="muted">{sub}</Text>}
    </View>
    <Text variant="body" weight="bold" style={{ color }}>{value}</Text>
  </View>
);

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
  },
  gradient: { padding: 24, paddingBottom: 36, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 32 },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  activeCard: { borderRadius: 14, overflow: 'hidden' },
  activeCardInner: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)' },
  statGrid: { gap: 12 },
  ctaWrap: { marginTop: 4 },
  cta: { borderRadius: 16, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.4 },
  ctaGradient: { paddingVertical: 16, alignItems: 'center' },
});

const statRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },
});
