/**
 * BuildIran — Asset Detail Modal — «Gentleman Neon» (v2)
 * Asset detail sheet opened when a building marker is tapped on the map.
 * Built on the shared Sheet primitive: building IconPlate header (type →
 * Ionicon + tone), tabular stat blocks (2-col wrap), «ارتقاء» section with
 * ProgressBar + cost row, workers section, and a sticky footer with the
 * single brass primary action in the thumb zone.
 * Dual theme via useTheme() — every color comes from the palette; neon is
 * intentionally absent (none of these actions are live signals).
 * All game logic (stores, upgrade, listing, workers, services, Supabase,
 * GameAudio, alerts) is unchanged — visuals only.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconPlate, toneOf } from "@/components/ui/IconPlate";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { GameAudio } from "@/lib/audio";
import { INSTITUTION_DEFINITIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { BUILDING_CONFIG, useAssetStore } from "@/store/useAssetStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { useNpcStore } from "@/store/useNpcStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Motion, Radii, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { Palette } from "@/theme/palettes";
import type { Asset, InstitutionType } from "@/types/game.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { EngagementDashboard } from "./EngagementDashboard";
import { InstitutionServiceModal } from "./InstitutionServiceModal";
import { PopularityBoostModal } from "./PopularityBoostModal";

type PlateIcon = React.ComponentProps<typeof IconPlate>["name"];
type PlateTone =
  | "brass"
  | "jade"
  | "crimson"
  | "steel"
  | "ember"
  | "terracotta"
  | "neutral"
  | "inverse";

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

/** Wraps a Latin fragment (coordinates) in LTR embedding controls so it renders
 * correctly inside RTL text. */
const ltr = (s: string) => `\u202A${s}\u202C`;
const fa = (n: number) => n.toLocaleString("fa-IR");

// ─── Building type → label / desc / Ionicon / tone (DESIGN.md §5 icon map) ───

const BUILDING_META: Record<
  string,
  { label: string; desc: string; icon: PlateIcon; tone: PlateTone }
> = {
  house: { label: "خانه", desc: "اقامتگاه مسکونی", icon: "home", tone: "steel" },
  villa: { label: "ویلا", desc: "اقامتگاه لوکس", icon: "home-outline", tone: "steel" },
  tower: { label: "برج", desc: "برج دیده‌بانی و دفاعی", icon: "business", tone: "steel" },
  shop: { label: "مغازه", desc: "واحد تجاری خرد", icon: "storefront", tone: "brass" },
  mall: { label: "مرکز خرید", desc: "مجتمع تجاری بزرگ", icon: "cart", tone: "brass" },
  market: { label: "بازار", desc: "مرکز مبادلات اقتصادی", icon: "storefront", tone: "brass" },
  office: { label: "اداره", desc: "دفتر اداری و شرکتی", icon: "business", tone: "brass" },
  cafe: { label: "کافه", desc: "کافه و نوشیدنی", icon: "cafe", tone: "brass" },
  gym: { label: "باشگاه", desc: "باشگاه ورزشی", icon: "barbell", tone: "brass" },
  restaurant: { label: "رستوران", desc: "رستوران و غذا", icon: "restaurant", tone: "brass" },
  exchange: { label: "صرافی", desc: "بورس فعالیت", icon: "swap-horizontal", tone: "brass" },
  warehouse: { label: "انبار", desc: "ذخیره‌سازی تجهیزات", icon: "archive", tone: "brass" },
  farm: { label: "مزرعه", desc: "تولید منابع غذایی", icon: "nutrition", tone: "ember" },
  factory: { label: "کارخانه", desc: "تولید صنعتی", icon: "construct", tone: "ember" },
  hospital: { label: "بیمارستان", desc: "خدمات درمانی", icon: "medkit", tone: "jade" },
  park: { label: "پارک", desc: "فضای سبز شهری", icon: "leaf", tone: "jade" },
  university: { label: "دانشگاه", desc: "آموزش دانشگاهی", icon: "school", tone: "jade" },
  bank: { label: "بانک", desc: "خدمات بانکی", icon: "cash", tone: "jade" },
  barracks: { label: "پادگان", desc: "پایگاه آموزش نظامی", icon: "shield", tone: "crimson" },
  main_house: { label: "خانه اصلی", desc: "اقامتگاه اصلی شما", icon: "home", tone: "steel" },
  resident_house: { label: "خانه ساکنان", desc: "اقامتگاه کارگران", icon: "home", tone: "steel" },
};

const BUILDING_META_FALLBACK = {
  label: "",
  desc: "سازه شهری",
  icon: "business" as PlateIcon,
  tone: "steel" as PlateTone,
};

// ─── Institution type → Ionicon / tone ───────────────────────────────────────

const INSTITUTION_META: Record<string, { icon: PlateIcon; tone: PlateTone }> = {
  home_rent: { icon: "home", tone: "steel" },
  shopping: { icon: "cart", tone: "brass" },
  cafe: { icon: "cafe", tone: "brass" },
  gym: { icon: "barbell", tone: "brass" },
  restaurant: { icon: "restaurant", tone: "brass" },
  mall_service: { icon: "storefront", tone: "brass" },
  library: { icon: "book", tone: "brass" },
  exchange: { icon: "swap-horizontal", tone: "brass" },
  farm_supply: { icon: "nutrition", tone: "ember" },
  factory_supply: { icon: "construct", tone: "ember" },
  industrial_supply: { icon: "cube", tone: "ember" },
  hospital: { icon: "medkit", tone: "jade" },
  university: { icon: "school", tone: "jade" },
  park_service: { icon: "leaf", tone: "jade" },
  bank_service: { icon: "cash", tone: "jade" },
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "مسکونی",
  commercial: "تجاری",
  industrial: "صنعتی",
  public: "عمومی",
};

// ─── Small stat block (tabular numeral card) ─────────────────────────────────

const StatBlock: React.FC<{
  icon: PlateIcon;
  tone: PlateTone;
  label: string;
  value: string;
}> = ({ icon, tone, label, value }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStatStyles(c), [c]);

  return (
    <Card padded={false} style={styles.statCard}>
      <View style={styles.statHead}>
        <IconPlate name={icon} size="xxs" tone={tone} bordered={false} />
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        variant="subtitle"
        weight="bold"
        style={[styles.tabular, { color: toneOf(c, tone) }]}
      >
        {value}
      </Text>
    </Card>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

interface AssetDetailModalProps {
  asset: Asset | null;
  visible: boolean;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [showSellInput, setShowSellInput] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);

  const player = usePlayerStore((s) => s.player);
  const updateCash = usePlayerStore((s) => s.updateCash);
  const upgradeAsset = useAssetStore((s) => s.upgradeAsset);
  const listForSale = useAssetStore((s) => s.listForSale);
  const cancelListing = useAssetStore((s) => s.cancelListing);
  const buyAsset = useAssetStore((s) => s.buyAsset);
  const listings = useAssetStore((s) => s.listings);
  const allAssets = useAssetStore((s) => s.assets);
  const fillWarehouse = useAssetStore((s) => s.fillWarehouse);
  const updateStats = usePlayerStore((s) => s.updateStats);
  const isAssetBoosted = useEconomyStore((s) => s.isAssetBoosted);
  const { track } = useActivityTracker();

  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  // NPC logic
  const allNpcs = useNpcStore((s) => s.npcs);
  const assetWorkers = Object.values(allNpcs).filter((n) => n.currentBusinessAssetId === asset?.id);

  // Track asset inspection for activity points
  useEffect(() => {
    if (visible && asset) {
      track("asset_inspect");
    }
  }, [visible, asset?.id]);

  if (!asset) return null;

  const isOwned = player ? asset.ownerId === player.id : false;
  const buildingInfo = BUILDING_META[asset.type] || {
    ...BUILDING_META_FALLBACK,
    label: asset.type,
  };

  const cfg = (BUILDING_CONFIG as any)[asset.type] || {
    cost: 1000,
    value: 1500,
    power: 5,
  };
  const upgradeCost = Math.floor(cfg.cost * 0.5 * asset.level);

  // Check if there's an active listing for this asset
  const activeListing = listings.find(
    (l) => l.assetId === asset.id && l.status === "active",
  );
  const priceToBuy = asset.askPrice ?? activeListing?.price ?? null;

  // Economy helpers
  const instType = asset.institutionType as InstitutionType | null;
  const instDef = instType ? INSTITUTION_DEFINITIONS[instType] : null;
  const instMeta = instType ? INSTITUTION_META[instType] : undefined;
  const isBoosted = isAssetBoosted(asset.id);

  const myIndustrialAssets = Object.values(allAssets).filter(
    (a) => a.ownerId === player?.id && a.institutionCategory === "industrial"
  );
  const canFillWarehouse = myIndustrialAssets.length > 0;
  const warehouseEmpty = (instDef?.requiresWarehouse && !asset.warehouseFilled) ?? false;

  const canBuy = asset.isForSale && !!priceToBuy;
  const canUseService = !!instDef && !warehouseEmpty;
  const hasFooter = isOwned || canBuy || canUseService;

  const handleFillWarehouse = async () => {
    if (!myIndustrialAssets[0] || !player) return;
    setLoading(true);
    try {
      const { success, cashEarned, powerEarned, error } = await fillWarehouse(myIndustrialAssets[0].id, asset.id);
      if (success) {
        GameAudio.playBuild();
        if (cashEarned) updateCash(cashEarned);
        if (powerEarned) updateStats({ power: (player.power ?? 0) + powerEarned });
      } else {
        GameAudio.playError();
        if (error === 'insufficient_activity') {
           Alert.alert("خطا", "فعالیت کافی برای تأمین انبار ندارید.");
        }
      }
    } catch {
      GameAudio.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!player) return;
    if (player.cash < upgradeCost) {
      GameAudio.playError();
      Alert.alert(
        "موجودی ناکافی",
        `برای ارتقاء به ${upgradeCost.toLocaleString("fa-IR")} نیاز دارید.`,
      );
      return;
    }

    setLoading(true);
    try {
      const ok = await upgradeAsset(asset.id);
      if (ok) {
        updateCash(-upgradeCost);
        await supabase
          .from("profiles")
          .update({ cash: player.cash - upgradeCost })
          .eq("id", player.id);
        track("upgrade_complete");
        await GameAudio.playBuild();
      } else {
        GameAudio.playError();
      }
    } catch {
      GameAudio.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleListForSale = async () => {
    const priceNum = parseInt(salePrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      GameAudio.playError();
      Alert.alert("خطا", "لطفاً یک قیمت معتبر وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const ok = await listForSale(asset.id, priceNum);
      if (ok) {
        setShowSellInput(false);
        setSalePrice("");
        GameAudio.playTap();
      } else {
        GameAudio.playError();
      }
    } catch {
      GameAudio.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSale = async () => {
    setLoading(true);
    try {
      await cancelListing(asset.id);
      GameAudio.playTap();
    } catch {
      GameAudio.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!player || !priceToBuy) return;
    if (player.cash < priceToBuy) {
      GameAudio.playError();
      Alert.alert(
        "موجودی ناکافی",
        `شما برای خرید به ${priceToBuy.toLocaleString("fa-IR")} نیاز دارید.`,
      );
      return;
    }

    setLoading(true);
    try {
      if (activeListing) {
        const ok = await buyAsset(activeListing.id, player.id);
        if (ok) {
          updateCash(-priceToBuy);
          track("trade_complete");
          await GameAudio.playBuild();
          onClose();
        }
      }
    } catch {
      GameAudio.playError();
    } finally {
      setLoading(false);
    }
  };

  // ── Footer: single brass primary + secondary per view (thumb zone) ──────────
  const footer = isOwned ? (
    <View style={styles.footerRow}>
      <Button
        label={`ارتقاء به سطح ${fa(asset.level + 1)}`}
        icon={<Ionicons name="trending-up" size={18} color={c.text.inverse} />}
        onPress={handleUpgrade}
        loading={loading}
        disabled={player ? player.cash < upgradeCost : true}
        style={styles.grow2}
      />
      {!asset.isForSale ? (
        <Button
          variant="secondary"
          label="فروش"
          icon={<Ionicons name="pricetag" size={16} color={c.brass[400]} />}
          onPress={() => setShowSellInput((v) => !v)}
          style={styles.grow1}
        />
      ) : (
        <Button
          variant="secondary"
          label={asset.askPrice != null ? `لغو فروش (${fa(asset.askPrice)} سکه)` : "لغو فروش"}
          icon={<Ionicons name="close-circle" size={16} color={c.brass[400]} />}
          onPress={handleCancelSale}
          disabled={loading}
          style={styles.grow1}
        />
      )}
    </View>
  ) : (
    <View style={styles.footerCol}>
      {canUseService && (
        <Button
          variant={canBuy ? "secondary" : "primary"}
          fullWidth
          label={`استفاده از ${instDef!.nameFa}`}
          icon={
            <Ionicons
              name={instMeta?.icon ?? "business"}
              size={16}
              color={canBuy ? c.brass[400] : c.text.inverse}
            />
          }
          onPress={() => {
            GameAudio.playTap();
            setShowServiceModal(true);
          }}
        />
      )}
      {canBuy && (
        <Button
          label={`خرید — ${fa(priceToBuy!)} سکه`}
          icon={<Ionicons name="cart" size={16} color={c.text.inverse} />}
          onPress={handleBuy}
          loading={loading}
          fullWidth
        />
      )}
    </View>
  );

  return (
    <>
      <Sheet visible={visible} onClose={onClose} maxHeight={0.9} footer={hasFooter ? footer : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header: IconPlate + name + level/sale/owner chips + coords ── */}
          <View style={styles.headerRow}>
            <IconPlate name={buildingInfo.icon} tone={buildingInfo.tone} size="lg" />
            <View style={styles.headerTexts}>
              <View style={styles.nameRow}>
                <Text variant="title" weight="extrabold" numberOfLines={1} style={styles.flex1}>
                  {buildingInfo.label}
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
                <Chip icon="ribbon" tone="brass" value={`سطح ${fa(asset.level)}`} />
                {asset.isForSale && <Chip icon="pricetag" tone="jade" value="در حال فروش" />}
                <Chip
                  icon="person"
                  tone={isOwned ? "jade" : "steel"}
                  value={isOwned ? "مالک: شما" : `مالک: ${asset.ownerUsername || "ناشناس"}`}
                />
              </View>
              <Text variant="caption" color="secondary">
                {buildingInfo.desc}
              </Text>
              <View style={styles.coordRow}>
                <Ionicons name="location" size={12} color={c.text.muted} />
                <Text variant="caption" color="muted" style={styles.tabular}>
                  {`مختصات ${ltr(`${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}`)}`}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Stat blocks (2-col wrap, mobile-first §5) ── */}
          <SectionTitle kicker="داده‌ها" title="شاخص‌های ملک" />
          <View style={styles.statsGrid}>
            <StatBlock icon="cash" tone="brass" label="ارزش بازار" value={fa(asset.marketValue)} />
            <StatBlock icon="flash" tone="terracotta" label="قدرت اثر" value={`+${fa(asset.powerBonus)}`} />
            {asset.incomeRate > 0 && (
              <StatBlock icon="trending-up" tone="jade" label="درآمد/ساعت" value={fa(asset.incomeRate)} />
            )}
            {asset.dailyPowerDrip > 0 && (
              <StatBlock icon="sparkles" tone="jade" label="قدرت/روز" value={`+${fa(asset.dailyPowerDrip)}`} />
            )}
            {asset.totalViews > 0 && (
              <StatBlock icon="eye" tone="steel" label="بازدید کل" value={fa(asset.totalViews)} />
            )}
          </View>

          {/* ── Institution card ── */}
          {instDef && (
            <Card padded={false}>
              <View style={styles.instRow}>
                <IconPlate
                  name={instMeta?.icon ?? "business"}
                  tone={instMeta?.tone ?? "steel"}
                  size="sm"
                />
                <View style={styles.flex1}>
                  <Text variant="body" weight="semibold">
                    {instDef.nameFa}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {CATEGORY_LABELS[instDef.category] ?? "خدمات شهری"}
                  </Text>
                </View>
                {isBoosted && (
                  <View style={styles.boostPill}>
                    <Ionicons name="flame" size={12} color={c.ember} />
                    <Text variant="caption" weight="bold" style={styles.boostText}>
                      ۲× درآمد
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* ── Engagement dashboard (owner only) ── */}
          {isOwned && showEngagement && (
            <View style={styles.engagementWrap}>
              <EngagementDashboard assetId={asset.id} />
            </View>
          )}

          {/* ── Upgrade section (owner) ── */}
          {isOwned && (
            <View style={styles.sectionGap}>
              <SectionTitle kicker="توسعه" title="ارتقاء" />
              <ProgressBar percent={Math.min(asset.level * 10, 100)} tone="brass" />
              <View style={styles.costRow}>
                <IconPlate name="cash" size="xxs" tone="brass" bordered={false} />
                <Text variant="caption" color="secondary">
                  هزینه ارتقاء به سطح {fa(asset.level + 1)}
                </Text>
                <View style={styles.flex1} />
                <Text variant="body" weight="bold" style={[styles.tabular, styles.costValue]}>
                  {`${fa(upgradeCost)} سکه`}
                </Text>
              </View>
            </View>
          )}

          {/* ── Owner economy tools ── */}
          {isOwned && (
            <View style={styles.btnRow}>
              {instDef && (
                <Button
                  variant="secondary"
                  label={isBoosted ? "۲× فعال" : "تقویت درآمد"}
                  icon={<Ionicons name="flame" size={16} color={c.brass[400]} />}
                  onPress={() => {
                    GameAudio.playTap();
                    setShowBoostModal(true);
                  }}
                  style={styles.grow1}
                />
              )}
              <Button
                variant="secondary"
                label={showEngagement ? "بستن" : "تعامل"}
                icon={<Ionicons name="analytics" size={16} color={c.brass[400]} />}
                onPress={() => {
                  GameAudio.playTap();
                  setShowEngagement((v) => !v);
                }}
                style={instDef ? styles.grow1 : styles.fullWidth}
              />
            </View>
          )}

          {/* ── Sell input (owner, toggled from footer) ── */}
          {isOwned && showSellInput && !asset.isForSale && (
            <Card>
              <Input
                label="قیمت فروش (سکه)"
                placeholder="قیمت پیشنهادی (سکه)..."
                keyboardType="numeric"
                value={salePrice}
                onChangeText={setSalePrice}
              />
              <Button
                label="ثبت در بازار"
                onPress={handleListForSale}
                loading={loading}
                fullWidth
                style={styles.confirmBtn}
              />
            </Card>
          )}

          {/* ── Warehouse warning + fill (non-owner) ── */}
          {!isOwned && warehouseEmpty && (
            <View style={styles.warnCard}>
              <View style={styles.warnHead}>
                <IconPlate name="warning" size="xs" tone="crimson" />
                <Text variant="body" weight="bold" style={styles.warnTitle}>
                  انبار خالی است
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                نیازمند تأمین توسط بخش صنعتی
              </Text>
              {canFillWarehouse && (
                <Button
                  variant="secondary"
                  label="تأمین انبار (صنعتی)"
                  icon={<Ionicons name="cube" size={16} color={c.brass[400]} />}
                  onPress={handleFillWarehouse}
                  loading={loading}
                  fullWidth
                  style={styles.warnAction}
                />
              )}
            </View>
          )}

          {/* ── Other-player note ── */}
          {!isOwned && !instDef && !canBuy && (
            <View style={styles.infoRow}>
              <IconPlate name="shield-checkmark" size="sm" tone="steel" />
              <Text variant="body" color="secondary" style={styles.flex1}>
                این سازه متعلق به بازیکن دیگری است.
              </Text>
            </View>
          )}

          {/* ── Workers ── */}
          {!["main_house", "resident_house"].includes(asset.type) && (
            <View style={styles.sectionGap}>
              <SectionTitle
                kicker="نیروی کار"
                title="کارگران مشغول به کار"
                trailing={<Chip icon="people" tone="steel" value={assetWorkers.length} label="نفر" />}
              />
              <Card>
                <View style={styles.workersRow}>
                  <IconPlate name="people" size="sm" tone="steel" />
                  <Text variant="caption" color="secondary" style={styles.flex1}>
                    {assetWorkers.length > 0
                      ? "کارگران به این کسب‌وکار کمک می‌کنند تا حتی در زمان آفلاین نیز فعالیت تولید کند."
                      : "هیچ کارگری در این کسب‌وکار مشغول نیست."}
                  </Text>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>
      </Sheet>

      {/* Economy sub-modals */}
      {instType && (
        <InstitutionServiceModal
          visible={showServiceModal}
          asset={asset}
          institutionType={instType}
          onClose={() => setShowServiceModal(false)}
        />
      )}
      {instType && isOwned && (
        <PopularityBoostModal
          visible={showBoostModal}
          asset={asset}
          onClose={() => setShowBoostModal(false)}
        />
      )}
    </>
  );
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
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
    },
    headerTexts: {
      flex: 1,
      gap: Spacing.xs + 2,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs + 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.subtle,
      alignItems: "center",
      justifyContent: "center",
    },
    coordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
    },
    tabular: {
      fontVariant: ["tabular-nums"],
    },

    // Stats grid — 2 columns max at 390pt (mobile-first §5)
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },

    // Institution card
    instRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
    },
    boostPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: `${c.ember}1A`,
      borderColor: `${c.ember}3D`,
      borderWidth: 1,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
    },
    boostText: {
      color: c.ember,
    },

    // Engagement
    engagementWrap: {
      maxHeight: 320,
      borderRadius: Radii.lg,
      overflow: "hidden",
    },

    // Upgrade section
    sectionGap: {
      gap: Spacing.md,
    },
    costRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    costValue: {
      color: c.brass[400],
    },

    // Buttons
    btnRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    footerRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    footerCol: {
      gap: Spacing.sm,
    },
    grow1: {
      flex: 1,
    },
    grow2: {
      flex: 2,
    },
    fullWidth: {
      alignSelf: "stretch",
    },
    confirmBtn: {
      marginTop: Spacing.md,
    },

    // Warehouse warning
    warnCard: {
      backgroundColor: `${c.crimson}14`,
      borderColor: `${c.crimson}33`,
      borderWidth: 1,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      gap: Spacing.xs + 2,
    },
    warnHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    warnTitle: {
      color: c.crimson,
    },
    warnAction: {
      marginTop: Spacing.sm,
    },

    // Other-player note
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.lg,
      padding: Spacing.md,
    },

    // Workers
    workersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    flex1: {
      flex: 1,
    },
  });

const makeStatStyles = (c: Palette) =>
  StyleSheet.create({
    statCard: {
      flexGrow: 1,
      flexBasis: "47%",
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    statHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
    },
    tabular: {
      fontVariant: ["tabular-nums"],
    },
  });

export default AssetDetailModal;
