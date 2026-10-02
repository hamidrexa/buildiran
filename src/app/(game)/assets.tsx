/**
 * BuildIran — Assets Screen («Gentleman Neon» v2)
 * Lists all assets owned by the current player.
 * Includes nested Workers sub-screen (NPC management) as a tab inside Assets.
 *
 * Dual theme via useTheme() · brass hero accents · IconPlate instead of emoji ·
 * tabular fa-IR numerals · staggered FadeInDown entrances · floating-dock spacing.
 */

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlate } from '@/components/ui/IconPlate';
import { Input } from '@/components/ui/Input';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Sheet } from '@/components/ui/Sheet';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { BUILDING_CONFIG, useAssetStore } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Asset, BuildingType } from '@/types/game.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Motion, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { WorkersPanel } from '@/components/game/WorkersPanel';

type PlateIcon = React.ComponentProps<typeof IconPlate>['name'];
type PlateTone = React.ComponentProps<typeof IconPlate>['tone'];
type ChipTone = React.ComponentProps<typeof Chip>['tone'];

/**
 * Legacy export kept for backwards compatibility (module contract).
 * The redesigned UI never renders emoji — it uses BUILDING_ICON below,
 * which maps this record's exact key set to Ionicons + IconPlate tones.
 */
export const BUILDING_EMOJI: Record<string, string> = {
  house: '🏠', villa: '🏡', tower: '🏢',
  shop: '🏪', cafe: '☕', gym: '🏋️', restaurant: '🍽️', mall: '🏬', exchange: '💱', warehouse: '🏭', market: '🏦', office: '🏢',
  farm: '🌾', factory: '🏗️',
  hospital: '🏥', park: '🌳', university: '🎓', bank: '🏦',
  barracks: '⚔️',
  // v4 — NPC housing
  main_house: '🏡', resident_house: '🏘️',
};

export const BUILDING_LABEL: Record<string, string> = {
  house: 'خانه', villa: 'ویلا', tower: 'برج',
  shop: 'مغازه', cafe: 'کافه', gym: 'باشگاه', restaurant: 'رستوران', mall: 'مرکز خرید', exchange: 'صرافی', warehouse: 'انبار', market: 'بازار', office: 'اداره',
  farm: 'مزرعه', factory: 'کارخانه',
  hospital: 'بیمارستان', park: 'پارک', university: 'دانشگاه', bank: 'بانک',
  barracks: 'پادگان',
  // v4 — NPC housing
  main_house: 'خانه اصلی', resident_house: 'خوابگاه کارگران',
};

/** Building type → Ionicon + IconPlate tone (DESIGN.md §4 iconography map). */
export const BUILDING_ICON: Record<string, { name: PlateIcon; tone: PlateTone }> = {
  // Residential — steel
  house: { name: 'home', tone: 'steel' },
  villa: { name: 'home', tone: 'steel' },
  tower: { name: 'business', tone: 'steel' },
  main_house: { name: 'home', tone: 'brass' }, // the player's own territory
  resident_house: { name: 'bed', tone: 'steel' },
  // Commercial — brass
  shop: { name: 'storefront', tone: 'brass' },
  cafe: { name: 'cafe', tone: 'brass' },
  gym: { name: 'barbell', tone: 'brass' },
  restaurant: { name: 'restaurant', tone: 'brass' },
  mall: { name: 'storefront', tone: 'brass' },
  exchange: { name: 'swap-horizontal', tone: 'brass' },
  market: { name: 'storefront', tone: 'brass' },
  office: { name: 'business', tone: 'brass' },
  // Industrial — ember
  warehouse: { name: 'cube', tone: 'ember' },
  farm: { name: 'nutrition', tone: 'ember' },
  factory: { name: 'construct', tone: 'ember' },
  // Civic — jade
  hospital: { name: 'medkit', tone: 'jade' },
  park: { name: 'leaf', tone: 'jade' },
  university: { name: 'school', tone: 'jade' },
  bank: { name: 'business', tone: 'jade' },
  // Military — crimson
  barracks: { name: 'shield', tone: 'crimson' },
};

// Active tab type for the Assets screen
type AssetsTab = 'assets' | 'workers';

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saleModal, setSaleModal] = useState<Asset | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AssetsTab>('assets');

  const assets = useAssetStore((s) => s.assets);
  const fetchMyAssets = useAssetStore((s) => s.fetchMyAssets);
  const upgradeAsset = useAssetStore((s) => s.upgradeAsset);
  const listForSale = useAssetStore((s) => s.listForSale);
  const cancelListing = useAssetStore((s) => s.cancelListing);
  const player = usePlayerStore((s) => s.player);
  const updateCash = usePlayerStore((s) => s.updateCash);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchMyAssets(session.user.id);
      }
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) await fetchMyAssets(userId);
    setRefreshing(false);
  }, [userId, fetchMyAssets]);

  const handleUpgrade = useCallback(async (asset: Asset) => {
    const cfg = BUILDING_CONFIG[asset.type];
    const upgradeCost = Math.floor(cfg.cost * 0.5 * asset.level);
    if ((player?.cash ?? 0) < upgradeCost) {
      GameAudio.playError();
      Alert.alert('موجودی ناکافی', `برای ارتقاء به ${upgradeCost.toLocaleString('fa-IR')} نیاز دارید.`);
      return;
    }

    Alert.alert(
      `ارتقاء ${BUILDING_LABEL[asset.type]}`,
      `هزینه ارتقاء به سطح ${asset.level + 1}: ${upgradeCost.toLocaleString('fa-IR')}`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ارتقاء',
          onPress: async () => {
            setLoading(true);
            const ok = await upgradeAsset(asset.id);
            if (ok) {
              updateCash(-upgradeCost);
              // Update Supabase cash
              if (userId) {
                await supabase
                  .from('profiles')
                  .update({ cash: (player?.cash ?? 0) - upgradeCost })
                  .eq('id', userId);
              }
              GameAudio.playBuild();
            } else {
              GameAudio.playError();
            }
            setLoading(false);
          },
        },
      ]
    );
  }, [player, upgradeAsset, updateCash, userId]);

  const handleListForSale = useCallback(async () => {
    if (!saleModal || !salePrice) return;
    const price = parseInt(salePrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(price) || price <= 0) {
      Alert.alert('خطا', 'قیمت معتبر وارد کنید.');
      return;
    }
    setLoading(true);
    const ok = await listForSale(saleModal.id, price);
    if (ok) {
      GameAudio.playSell();
      Alert.alert('موفق', 'دارایی شما در بازار فروش لیست شد.');
    } else {
      GameAudio.playError();
    }
    setLoading(false);
    setSaleModal(null);
    setSalePrice('');
  }, [saleModal, salePrice, listForSale]);

  const myAssets = Object.values(assets).filter((a) => a.ownerId === userId);

  const totalValue = myAssets.reduce((sum, a) => sum + a.marketValue, 0);
  const totalPower = myAssets.reduce((sum, a) => sum + a.powerBonus, 0);

  return (
    <View style={styles.root}>
      {/* Header: kicker + title + count, then the assets/workers switcher */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <SectionTitle
          kicker="امپراتوری شما"
          title="دارایی‌های من"
          trailing={
            <Text variant="caption" color="secondary">
              {myAssets.length.toLocaleString('fa-IR')} سازه
            </Text>
          }
        />
        <SegmentedTabs
          items={[
            { key: 'assets', label: 'دارایی‌ها' },
            { key: 'workers', label: 'کارگران' },
          ]}
          value={activeTab}
          onChange={(key) => {
            GameAudio.playTap();
            setActiveTab(key);
          }}
        />
      </View>

      {/* Workers Panel (sub-screen, no new tab) */}
      {activeTab === 'workers' ? (
        <WorkersPanel userId={userId} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.brass[400]}
              colors={[c.brass[400]]}
              progressBackgroundColor={c.ink[800]}
            />
          }
        >
          {/* Summary — 3 small cards */}
          <View style={styles.summaryRow}>
            <SummaryCard index={0} icon="cash" tone="brass" value={totalValue} label="ارزش کل" />
            <SummaryCard index={1} icon="flash" tone="terracotta" value={totalPower} label="قدرت کل" />
            <SummaryCard index={2} icon="wallet" tone="steel" value={player?.cash ?? 0} label="موجودی" />
          </View>

          {/* Asset list */}
          {myAssets.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(Motion.durations.slow)}>
              <EmptyState
                icon="business"
                title="هنوز سازه‌ای ندارید"
                body="روی نقشه ضربه بزنید تا اولین ساختمان خود را بسازید"
                style={styles.emptyState}
              />
            </Animated.View>
          ) : (
            myAssets.map((asset, i) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                index={i}
                onUpgrade={() => handleUpgrade(asset)}
                onList={() => {
                  if (asset.isForSale) {
                    Alert.alert(
                      'لغو فروش',
                      'آیا می‌خواهید این دارایی را از فروش خارج کنید؟',
                      [
                        { text: 'خیر', style: 'cancel' },
                        { text: 'بله', onPress: () => cancelListing(asset.id).then(() => GameAudio.playTap()) },
                      ]
                    );
                  } else {
                    setSaleModal(asset);
                    setSalePrice(String(asset.marketValue));
                  }
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* List for Sale — bottom Sheet */}
      <Sheet
        visible={!!saleModal}
        onClose={() => setSaleModal(null)}
        title="قیمت گذاری"
        subtitle={saleModal ? (BUILDING_LABEL[saleModal.type] ?? saleModal.type) : undefined}
        footer={
          <View style={saleStyles.footerRow}>
            <Button
              label="انصراف"
              variant="ghost"
              onPress={() => setSaleModal(null)}
              style={saleStyles.footerBtn}
            />
            <Button
              label="فروش در بازار"
              variant="primary"
              loading={loading}
              onPress={handleListForSale}
              style={saleStyles.footerConfirm}
            />
          </View>
        }
      >
        <View style={saleStyles.body}>
          <View style={saleStyles.marketRow}>
            <Text variant="caption" color="secondary">ارزش بازار</Text>
            <Text variant="caption" weight="bold" style={saleStyles.tabular}>
              {(saleModal?.marketValue ?? 0).toLocaleString('fa-IR')}
            </Text>
          </View>
          <Input
            label="قیمت پیشنهادی"
            icon="cash"
            value={salePrice}
            onChangeText={setSalePrice}
            keyboardType="numeric"
            placeholder="قیمت پیشنهادی"
          />
        </View>
      </Sheet>
    </View>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  icon: PlateIcon;
  tone: ChipTone;
  value: number | string;
  label: string;
  index: number;
}> = ({ icon, tone, value, label, index }) => (
  <Animated.View
    entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}
    style={summaryStyles.cell}
  >
    <Card padded={false} style={summaryStyles.card}>
      <Chip icon={icon} value={value} tone={tone} />
      <Text variant="caption" color="secondary">{label}</Text>
    </Card>
  </Animated.View>
);

// ─── AssetCard ────────────────────────────────────────────────────────────────

const AssetCard: React.FC<{
  asset: Asset;
  index: number;
  onUpgrade: () => void;
  onList: () => void;
}> = ({ asset, index, onUpgrade, onList }) => {
  const { colors: c } = useTheme();
  const plate = BUILDING_ICON[asset.type] ?? { name: 'business' as PlateIcon, tone: 'neutral' as PlateTone };

  return (
    <Animated.View entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}>
      <Card sheen>
        {/* Header */}
        <View style={cardStyles.headerRow}>
          <IconPlate name={plate.name} tone={plate.tone} size="md" />
          <View style={cardStyles.info}>
            <View style={cardStyles.titleRow}>
              <Text variant="subtitle" weight="semibold" numberOfLines={1} style={cardStyles.nameText}>
                {BUILDING_LABEL[asset.type] ?? asset.type}
              </Text>
              {asset.isForSale ? (
                <Chip icon="pricetag" label="فروش" tone="brass" />
              ) : (
                <Chip label={`سطح ${asset.level.toLocaleString('fa-IR')}`} tone="neutral" />
              )}
            </View>
            <View style={cardStyles.coordsRow}>
              <Ionicons name="location" size={11} color={c.text.muted} />
              <Text variant="caption" color="muted" style={cardStyles.coords}>
                {asset.latitude.toFixed(3)}°, {asset.longitude.toFixed(3)}°
              </Text>
            </View>
          </View>
        </View>

        {/* Data */}
        <View style={cardStyles.statsRow}>
          <Chip icon="cash" value={asset.marketValue} label="ارزش" tone="brass" />
          <Chip icon="flash" value={asset.powerBonus} label="قدرت" tone="terracotta" />
        </View>

        {/* Actions */}
        <View style={cardStyles.actions}>
          <Button
            label="ارتقاء"
            variant="secondary"
            size="sm"
            icon={<Ionicons name="trending-up" size={14} color={c.text.brand} />}
            onPress={onUpgrade}
            style={cardStyles.actionBtn}
          />
          <Button
            label={asset.isForSale ? 'لغو فروش' : 'فروش'}
            variant="ghost"
            size="sm"
            icon={
              <Ionicons
                name={asset.isForSale ? 'close-circle' : 'pricetag'}
                size={14}
                color={c.text.secondary}
              />
            }
            onPress={onList}
            style={cardStyles.actionBtn}
          />
        </View>
      </Card>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg.primary,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
      gap: Spacing.md,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    emptyState: {
      paddingVertical: Spacing.xl,
    },
  });

/** Geometry-only summary tiles — mode-independent, safe at module scope. */
const summaryStyles = StyleSheet.create({
  cell: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
});

const cardStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  nameText: {
    flexShrink: 1,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  coords: {
    writingDirection: 'ltr',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});

const saleStyles = StyleSheet.create({
  body: {
    gap: Spacing.lg,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
  footerConfirm: {
    flex: 2,
  },
});
