/**
 * BuildIran — PopularityBoostModal — «Gentleman Neon» (v2)
 * Lets a business owner spend popularity for 2× income on one of their assets.
 * Cost = 10 × asset.level. Duration = 24 hours. Non-stackable.
 * Ember "flame" boost option card + duration/cost chips + single primary
 * confirm in the Sheet footer. Economy store calls, i18n copy, countdown
 * timer, GameAudio and public props ({visible, asset, onClose}) unchanged.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { IconPlate } from '@/components/ui/IconPlate';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spacing, Radii, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { GameAudio } from '@/lib/audio';
import { showAlert } from '@/lib/alert';
import { useEconomyStore } from '@/store/useEconomyStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { POPULARITY_BOOST_MULTIPLIER } from '@/lib/constants';
import { useScalePop } from '@/lib/effects';
import type { Asset } from '@/types/game.types';
import t from '@/i18n';

const lang = t();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '۰:۰۰:۰۰';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toLocaleString('fa-IR')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Strips a leading emoji from i18n copy — emoji as UI chrome is forbidden. */
function stripLeadingEmoji(s: string): string {
  return s.replace(/^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]+\s*/u, '').trim();
}

const fa = (n: number) => n.toLocaleString('fa-IR');

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  asset: Asset;
  onClose: () => void;
}

export const PopularityBoostModal: React.FC<Props> = ({ visible, asset, onClose }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const activateBoost  = useEconomyStore((s) => s.activateBoost);
  const isAssetBoosted = useEconomyStore((s) => s.isAssetBoosted);
  const activeBoosts   = useEconomyStore((s) => s.activeBoosts);
  const getBoostCost   = useEconomyStore((s) => s.getBoostCost);
  const player         = usePlayerStore((s) => s.player);

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
      showAlert('خطا', lang.economy.boost.errorPop);
      return;
    }
    pop();
    GameAudio.playTap();
    setLoading(true);
    try {
      const result = await activateBoost(asset.id);
      if (result.success) {
        GameAudio.playBuild?.();
        showAlert('تقویت درآمد', stripLeadingEmoji(lang.economy.boost.successMsg));
        onClose();
      } else {
        GameAudio.playError?.();
        showAlert('خطا', lang.economy.boost.errorPop);
      }
    } finally {
      setLoading(false);
    }
  };

  const popularity = player?.popularity ?? 0;
  const affordPct = cost > 0 ? Math.min((popularity / cost) * 100, 100) : 100;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={lang.economy.boost.title}
      subtitle={lang.economy.boost.subtitle}
      maxHeight={0.7}
      footer={
        <Animated.View style={btnStyle}>
          <Button
            label={boosted ? stripLeadingEmoji(lang.economy.boost.alreadyActive) : lang.economy.boost.activate}
            onPress={handleActivate}
            loading={loading}
            disabled={boosted || !canAfford}
            fullWidth
          />
        </Animated.View>
      }
    >
      {/* Active boost status */}
      {boosted && boost ? (
        <Card style={styles.activeCard}>
          <View style={styles.activeRow}>
            <IconPlate name="flame" size="sm" tone="ember" />
            <View style={styles.activeTexts}>
              <Text variant="body" weight="semibold" color="info">
                {stripLeadingEmoji(lang.economy.boost.alreadyActive)}
              </Text>
              <Text variant="caption" color="secondary" style={styles.tabular}>
                {lang.economy.boost.remainingTime}: {countdown}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Boost option card — ember flame tone */}
      <Card cornerTicks>
        <View style={styles.optionHeader}>
          <IconPlate name="flame" size="lg" tone="ember" />
          <View style={styles.optionTexts}>
            <Text variant="subtitle" weight="bold">
              تقویت درآمد {fa(POPULARITY_BOOST_MULTIPLIER)}×
            </Text>
            <Text variant="caption" color="secondary">
              {lang.economy.boost.subtitle}
            </Text>
          </View>
        </View>

        {/* Duration / cost / multiplier chips */}
        <View style={styles.chipsRow}>
          <Chip icon="star" tone="jade" value={fa(cost)} label={lang.economy.boost.cost} />
          <Chip icon="time" tone="steel" value={lang.economy.boost.durationValue} label={lang.economy.boost.duration} />
          <Chip icon="trending-up" tone="brass" value={`${fa(POPULARITY_BOOST_MULTIPLIER)}×`} label="ضریب درآمد" />
        </View>
        <Text variant="caption" color="muted" style={styles.formula}>
          {lang.economy.boost.cost}: {lang.economy.boost.costFormula}
        </Text>
      </Card>

      {/* Your popularity vs. cost */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Text variant="caption" color="secondary">
            {lang.economy.boost.yourPopularity}
          </Text>
          <Text
            variant="body"
            weight="bold"
            style={[styles.balanceValue, { color: canAfford ? c.jade : c.crimson }]}
          >
            {fa(popularity)} / {fa(cost)}
          </Text>
        </View>
        <ProgressBar
          percent={affordPct}
          height={5}
          tone={canAfford ? 'jade' : 'crimson'}
          sheen={false}
        />
        {!canAfford && (
          <Text variant="caption" color="error">
            {lang.economy.boost.errorPop}
          </Text>
        )}
      </View>
    </Sheet>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    tabular: {
      fontVariant: ['tabular-nums'],
    },

    activeCard: {
      borderColor: `${c.ember}4D`,
    },
    activeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    activeTexts: {
      flex: 1,
      gap: 2,
    },

    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    optionTexts: {
      flex: 1,
      gap: 2,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    formula: {
      textAlign: 'right',
    },

    balanceCard: {
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    balanceValue: {
      fontSize: Typography.sizes.lg,
      fontVariant: ['tabular-nums'],
    },
  });
