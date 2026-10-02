/**
 * BuildIran — Institution Service Modal — «Gentleman Neon» (v2)
 * Unified sheet for all institution interactions (client side).
 * Dynamically adapts to any institutionType: shows the conversion formula,
 * cost/gain preview, provider info, and handles the use_institution RPC.
 * Built on the shared Sheet primitive: institution IconPlate header,
 * tone-coded conversion pills, brass quick-select amounts (44pt targets),
 * Chip balance row and a single brass primary CTA in the sticky footer.
 * Dual theme via useTheme() — every color comes from the palette; neon is
 * intentionally absent (exchange/conversion is not a live signal).
 * Game logic, store/RPC calls, i18n copy and the public props are unchanged.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconPlate, toneOf } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { showAlert } from '@/lib/alert';
import { useEconomyStore } from '@/store/useEconomyStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { INSTITUTION_DEFINITIONS } from '@/lib/constants';
import { useScalePop } from '@/lib/effects';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import type { Asset, InstitutionType } from '@/types/game.types';
import t from '@/i18n';

const lang = t();

type PlateIcon = React.ComponentProps<typeof IconPlate>['name'];
type PlateTone =
  | 'brass'
  | 'jade'
  | 'crimson'
  | 'steel'
  | 'ember'
  | 'terracotta'
  | 'neutral'
  | 'inverse';

// ─── TouchableScale (press spring, same recipe as HUD / WorkersPanel) ─────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TouchableScale: React.FC<
  React.ComponentProps<typeof Pressable>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
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

// ─── Stat → tone/icon helpers (DESIGN.md iconography: cash / flame / flash) ──

const STAT_META: Record<
  'cash' | 'activity' | 'power',
  { tone: PlateTone; icon: PlateIcon }
> = {
  cash: { tone: 'brass', icon: 'cash' },
  activity: { tone: 'ember', icon: 'flame' },
  power: { tone: 'terracotta', icon: 'flash' },
};

function statLabel(stat: string): string {
  if (stat === 'cash')     return lang.economy.institution.stat_cash;
  if (stat === 'activity') return lang.economy.institution.stat_activity;
  if (stat === 'power')    return lang.economy.institution.stat_power;
  return stat;
}

// ─── Conversion Pills Row ─────────────────────────────────────────────────────

const ConversionRow: React.FC<{
  fromStat: 'cash' | 'activity';
  fromAmount: number;
  fromLabel: string;
  toStat: 'power' | 'cash';
  toAmount: number;
  toLabel: string;
}> = ({ fromStat, fromAmount, fromLabel, toStat, toAmount, toLabel }) => {
  const { colors: c } = useTheme();
  const from = STAT_META[fromStat];
  const to = STAT_META[toStat];
  const fromColor = toneOf(c, from.tone);
  const toColor = toneOf(c, to.tone);

  return (
    <View style={convStyles.row}>
      <View style={[convStyles.pill, { backgroundColor: `${fromColor}0F`, borderColor: `${fromColor}4D` }]}>
        <View style={convStyles.pillValueRow}>
          <Ionicons name={from.icon} size={14} color={fromColor} />
          <Text variant="subtitle" weight="bold" style={[convStyles.num, { color: fromColor }]}>
            {fromAmount.toLocaleString('fa-IR')}
          </Text>
        </View>
        <Text variant="caption" color="secondary">{fromLabel}</Text>
      </View>

      <Text variant="heading" color="secondary" style={convStyles.arrow}>←</Text>

      <View style={[convStyles.pill, { backgroundColor: `${toColor}0F`, borderColor: `${toColor}4D` }]}>
        <View style={convStyles.pillValueRow}>
          <Ionicons name={to.icon} size={14} color={toColor} />
          <Text variant="subtitle" weight="bold" style={[convStyles.num, { color: toColor }]}>
            {`+${toAmount.toLocaleString('fa-IR')}`}
          </Text>
        </View>
        <Text variant="caption" color="secondary">{toLabel}</Text>
      </View>
    </View>
  );
};

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
  const { style: btnStyle, pop } = useScalePop();

  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

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

  const meta = INSTITUTION_SERVICE_META[institutionType] ?? { icon: 'business' as PlateIcon, tone: 'steel' as PlateTone };

  // Compute active conversion amounts (dynamic for exchange, static for standard institutions)
  const activeRate = isExchange ? (exchangeRateKey === 'establishedBusiness' ? 5 : exchangeRateKey === 'ownerBonus' ? 3.5 : 2) : 1;
  const clientCostAmount = isExchange ? selectedActivityAmount : def.clientCost.amount;
  const clientGainAmount = isExchange ? Math.floor(selectedActivityAmount * activeRate) : def.clientGain.amount;

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
        'خطا',
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
            'بورس مبادلات',
            `تبدیل موفق! ${selectedActivityAmount.toLocaleString('fa-IR')} امتیاز فعالیت به ${clientGainAmount.toLocaleString('fa-IR')} سکه تبدیل شد.`,
          );
          onClose();
        } else {
          GameAudio.playError?.();
          showAlert('خطا', 'خطا در انجام مبادله. لطفاً دوباره تلاش کنید.');
        }
      } else {
        const result = await useInstitution(asset.id, institutionType);
        if (result.success) {
          GameAudio.playBuild?.();
          const gainMsg =
            result.clientGainStat === 'power'
              ? `${lang.economy.institution.successPower} +${result.clientGainAmount.toLocaleString('fa-IR')}`
              : `${lang.economy.institution.successCash} +${result.clientGainAmount.toLocaleString('fa-IR')}`;
          showAlert(def.nameFa, gainMsg);
          onClose();
        } else {
          GameAudio.playError?.();
          showAlert('خطا', lang.economy.institution.errorInsufficientCash);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      maxHeight={0.8}
      footer={
        <Animated.View style={btnStyle}>
          <Button
            fullWidth
            size="lg"
            loading={loading}
            disabled={!canAfford}
            onPress={handleUse}
            label={
              canAfford
                ? isExchange
                  ? `تبدیل ${clientCostAmount.toLocaleString('fa-IR')} فعالیت به ${clientGainAmount.toLocaleString('fa-IR')} سکه`
                  : lang.economy.institution.useService
                : def.clientCost.stat === 'cash'
                ? lang.economy.institution.errorInsufficientCash
                : lang.economy.institution.errorInsufficientActivity
            }
          />
        </Animated.View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Institution header ── */}
        <View style={styles.headerRow}>
          <IconPlate name={meta.icon} tone={meta.tone} size="lg" />
          <View style={styles.headerTexts}>
            <View style={styles.nameRow}>
              <Text variant="title" weight="extrabold" numberOfLines={1} style={styles.flex1}>
                {def.nameFa}
              </Text>
              <TouchableScale
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="بستن"
              >
                <Ionicons name="close" size={18} color={c.text.secondary} />
              </TouchableScale>
            </View>
            <View style={styles.chipsRow}>
              <Chip icon="ribbon" tone="brass" value={`سطح ${asset.level.toLocaleString('fa-IR')}`} />
              <Chip
                icon="person"
                tone="steel"
                value={
                  asset.ownerUsername
                    ? `${lang.economy.institution.ownerLabel}: ${asset.ownerUsername}`
                    : 'موسسه عمومی شهر'
                }
              />
            </View>
          </View>
        </View>

        {/* ── Exchange rate tier banner + quick amounts ── */}
        {isExchange && (
          <Card>
            <View style={styles.tierHead}>
              <View style={styles.tierTitleRow}>
                <IconPlate name="trending-up" size="xs" tone="jade" />
                <Text variant="body" weight="bold">
                  {exchangeRateKey === 'establishedBusiness'
                    ? 'نرخ کسب‌وکار مستقر'
                    : exchangeRateKey === 'ownerBonus'
                    ? 'بونوس مالک کسب‌وکار'
                    : 'نرخ پایه مبادله'}
                </Text>
              </View>
              <View style={styles.rateChip}>
                <Text variant="caption" weight="bold" style={styles.rateText}>
                  {`هر ۱ فعالیت = ${activeRate.toLocaleString('fa-IR')} سکه`}
                </Text>
              </View>
            </View>
            <Text variant="caption" color="secondary">
              {exchangeRateKey === 'establishedBusiness'
                ? 'دارای کسب‌وکار سطح ۲ به بالا با تراکنش فعال (حداکثر سود)'
                : exchangeRateKey === 'ownerBonus'
                ? 'مالک کسب‌وکار در شهر (پاداش کارآفرینی)'
                : 'برای نرخ بالاتر (تا ۵ برابر)، یک مغازه، کافه یا درمانگاه تأسیس کنید.'}
            </Text>

            {/* Activity amount quick selectors */}
            <Text variant="label" color="secondary" style={styles.amountsLabel}>
              میزان فعالیت جهت تبدیل:
            </Text>
            <View style={styles.amountsRow}>
              {[5, 10, 25, 50].map((amt) => {
                const isSelected = selectedActivityAmount === amt;
                const hasEnough = (player?.activity ?? 0) >= amt;
                return (
                  <TouchableScale
                    key={amt}
                    style={[
                      styles.amtPill,
                      isSelected && styles.amtPillSelected,
                      !hasEnough && styles.amtPillDisabled,
                    ]}
                    onPress={() => setSelectedActivityAmount(amt)}
                    accessibilityRole="button"
                    accessibilityLabel={`${amt.toLocaleString('fa-IR')}`}
                  >
                    <Ionicons
                      name="flame"
                      size={11}
                      color={isSelected ? c.text.inverse : hasEnough ? c.ember : c.text.muted}
                    />
                    <Text
                      variant="caption"
                      weight="bold"
                      style={{
                        color: isSelected
                          ? c.text.inverse
                          : hasEnough
                          ? c.text.primary
                          : c.text.muted,
                      }}
                    >
                      {amt.toLocaleString('fa-IR')}
                    </Text>
                  </TouchableScale>
                );
              })}
              {/* Max button */}
              {(player?.activity ?? 0) > 0 && (
                <TouchableScale
                  style={[
                    styles.amtPill,
                    selectedActivityAmount === player?.activity && styles.amtPillSelected,
                  ]}
                  onPress={() => setSelectedActivityAmount(player?.activity ?? 1)}
                  accessibilityRole="button"
                  accessibilityLabel="همه"
                >
                  <Text
                    variant="caption"
                    weight="bold"
                    style={{
                      color:
                        selectedActivityAmount === player?.activity
                          ? c.text.inverse
                          : c.text.primary,
                    }}
                  >
                    همه
                  </Text>
                </TouchableScale>
              )}
            </View>
          </Card>
        )}

        {/* ── Conversion formula ── */}
        <SectionTitle kicker="تبدیل" title={lang.economy.institution.conversionFormula} />
        <ConversionRow
          fromStat={def.clientCost.stat}
          fromAmount={clientCostAmount}
          fromLabel={statLabel(def.clientCost.stat)}
          toStat={def.clientGain.stat}
          toAmount={clientGainAmount}
          toLabel={statLabel(def.clientGain.stat)}
        />

        {/* ── Provider side (if applicable) ── */}
        {!isExchange && def.providerCost && def.providerGainPercent && (
          <>
            <SectionTitle kicker="ارائه‌دهنده" title={lang.economy.institution.providerEarns} />
            <View style={styles.providerRow}>
              <View style={styles.providerItem}>
                <IconPlate name="storefront" size="xxs" tone="brass" bordered={false} />
                <Text variant="caption" color="secondary" style={convStyles.num}>
                  {`${Math.floor(def.clientCost.amount * (def.providerGainPercent / 100)).toLocaleString('fa-IR')} ${lang.economy.institution.stat_cash}`}
                </Text>
              </View>
              <Text variant="caption" color="secondary" style={convStyles.num}>
                {`(−${def.providerCost.amount} ${lang.economy.institution.stat_activity})`}
              </Text>
            </View>
          </>
        )}

        {/* ── Player balance ── */}
        <View style={styles.balanceRow}>
          <Chip
            icon="cash"
            tone="brass"
            value={player?.cash ?? 0}
            label={lang.economy.institution.stat_cash}
          />
          <Chip
            icon="flame"
            tone="ember"
            value={player?.activity ?? 0}
            label={lang.economy.institution.stat_activity}
          />
          <Chip
            icon="flash"
            tone="terracotta"
            value={player?.power ?? 0}
            label={lang.economy.institution.stat_power}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
};

// ─── Institution type → Ionicon / tone ───────────────────────────────────────

const INSTITUTION_SERVICE_META: Record<string, { icon: PlateIcon; tone: PlateTone }> = {
  home_rent: { icon: 'home', tone: 'steel' },
  shopping: { icon: 'cart', tone: 'brass' },
  cafe: { icon: 'cafe', tone: 'brass' },
  gym: { icon: 'barbell', tone: 'brass' },
  restaurant: { icon: 'restaurant', tone: 'brass' },
  mall_service: { icon: 'storefront', tone: 'brass' },
  library: { icon: 'book', tone: 'brass' },
  exchange: { icon: 'swap-horizontal', tone: 'brass' },
  farm_supply: { icon: 'nutrition', tone: 'ember' },
  factory_supply: { icon: 'construct', tone: 'ember' },
  industrial_supply: { icon: 'cube', tone: 'ember' },
  hospital: { icon: 'medkit', tone: 'jade' },
  university: { icon: 'school', tone: 'jade' },
  park_service: { icon: 'leaf', tone: 'jade' },
  bank_service: { icon: 'cash', tone: 'jade' },
};

// ─── Styles — all colors from the active palette (dual theme §2) ─────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      gap: Spacing.lg,
      paddingTop: Spacing.sm,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    headerTexts: {
      flex: 1,
      gap: Spacing.xs + 2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs + 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flex1: {
      flex: 1,
    },

    // Exchange tier card
    tierHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginBottom: Spacing.xs + 2,
    },
    tierTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    rateChip: {
      backgroundColor: `${c.jade}1A`,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: `${c.jade}3D`,
    },
    rateText: {
      color: c.jade,
      fontVariant: ['tabular-nums'],
    },
    amountsLabel: {
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    amountsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    amtPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radii.md,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.default,
    },
    amtPillSelected: {
      backgroundColor: `${c.brass[400]}22`,
      borderColor: c.brass[400],
    },
    amtPillDisabled: {
      opacity: 0.4,
    },

    // Provider side
    providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      gap: Spacing.sm,
    },
    providerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },

    // Balance row
    balanceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.md,
      padding: Spacing.md,
    },
  });

// Geometry-only styles (no colors) — safe at module scope per DESIGN.md §2.
const convStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  pill: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 104,
    gap: Spacing.xs,
  },
  pillValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  num: {
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    fontSize: 22,
  },
});
