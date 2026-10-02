/**
 * BuildIran — Marketplace Screen («Gentleman Neon» v2)
 * Browse and buy assets listed for sale by other players.
 *
 * Dual-theme (Midnight/Porcelain) · brass price numerals + the single primary
 * buy action · IconPlate instead of emoji · tabular fa-IR numerals.
 * Card anatomy and header treatment mirror the Assets screen.
 */

import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPlate } from "@/components/ui/IconPlate";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { GameAudio } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { useAssetStore } from "@/store/useAssetStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import type { AssetListing, BuildingType } from "@/types/game.types";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Motion, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { Palette } from "@/theme/palettes";

type PlateIcon = React.ComponentProps<typeof IconPlate>["name"];
type PlateTone = React.ComponentProps<typeof IconPlate>["tone"];

const BUILDING_LABEL: Record<BuildingType, string> = {
  house: "خانه", villa: "ویلا", tower: "برج",
  shop: "مغازه", cafe: "کافه", gym: "باشگاه", restaurant: "رستوران", mall: "مرکز خرید", exchange: "صرافی", warehouse: "انبار", market: "بازار", office: "اداره",
  farm: "مزرعه", factory: "کارخانه",
  hospital: "بیمارستان", park: "پارک", university: "دانشگاه", bank: "بانک",
  barracks: "پادگان", main_house: "خانه اصلی", resident_house: "خوابگاه کارگران",
};

/** Building type → Ionicon + IconPlate tone — mirrors the Assets screen map. */
const BUILDING_ICON: Record<string, { name: PlateIcon; tone: PlateTone }> = {
  // Residential — steel
  house: { name: "home", tone: "steel" },
  villa: { name: "home", tone: "steel" },
  tower: { name: "business", tone: "steel" },
  main_house: { name: "home", tone: "brass" }, // the player's own territory
  resident_house: { name: "bed", tone: "steel" },
  // Commercial — brass
  shop: { name: "storefront", tone: "brass" },
  cafe: { name: "cafe", tone: "brass" },
  gym: { name: "barbell", tone: "brass" },
  restaurant: { name: "restaurant", tone: "brass" },
  mall: { name: "storefront", tone: "brass" },
  exchange: { name: "swap-horizontal", tone: "brass" },
  market: { name: "storefront", tone: "brass" },
  office: { name: "business", tone: "brass" },
  // Industrial — ember
  warehouse: { name: "cube", tone: "ember" },
  farm: { name: "nutrition", tone: "ember" },
  factory: { name: "construct", tone: "ember" },
  // Civic — jade
  hospital: { name: "medkit", tone: "jade" },
  park: { name: "leaf", tone: "jade" },
  university: { name: "school", tone: "jade" },
  bank: { name: "business", tone: "jade" },
  // Military — crimson
  barracks: { name: "shield", tone: "crimson" },
};

// Geometry-only module styles (mode-independent)
const separatorStyles = StyleSheet.create({
  separator: { height: Spacing.md },
});

const ItemSeparator = () => <View style={separatorStyles.separator} />;

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeScreenStyles(c), [c]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const { track } = useActivityTracker();

  const listings = useAssetStore((s) => s.listings);
  const isLoadingListings = useAssetStore((s) => s.isLoadingListings);
  const listingsError = useAssetStore((s) => s.listingsError);
  const fetchListings = useAssetStore((s) => s.fetchListings);
  const buyAsset = useAssetStore((s) => s.buyAsset);
  const player = usePlayerStore((s) => s.player);
  const updateCash = usePlayerStore((s) => s.updateCash);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchListings();
      }
    });
  }, [fetchListings]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
      track("marketplace_view");
    }, [fetchListings, track]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleBuy = useCallback(
    async (listing: AssetListing) => {
      if (!userId || !player) return;
      if (listing.sellerId === userId) {
        Alert.alert("خطا", "نمی‌توانید دارایی خود را بخرید.");
        return;
      }
      if (player.cash < listing.price) {
        GameAudio.playError();
        Alert.alert(
          "موجودی ناکافی",
          `برای خرید به ${listing.price.toLocaleString("fa-IR")} نیاز دارید.\nموجودی شما: ${player.cash.toLocaleString("fa-IR")}`,
        );
        return;
      }

      const assetLabel = listing.asset
        ? BUILDING_LABEL[listing.asset.type]
        : "دارایی";
      Alert.alert(
        `خرید ${assetLabel}`,
        `قیمت: ${listing.price.toLocaleString("fa-IR")}\nاز: ${listing.sellerUsername}`,
        [
          { text: "انصراف", style: "cancel" },
          {
            text: "خرید",
            onPress: async () => {
              setBuying(listing.id);
              const ok = await buyAsset(listing.id, userId);
              if (ok) {
                updateCash(-listing.price);
                track("trade_complete");
                GameAudio.playBuy();
                Alert.alert(
                  "خرید موفق!",
                  `${assetLabel} با موفقیت خریداری شد.`,
                );
              } else {
                GameAudio.playError();
                Alert.alert("خطا", "خرید ناموفق بود. دوباره تلاش کنید.");
              }
              setBuying(null);
            },
          },
        ],
      );
    },
    [userId, player, buyAsset, updateCash],
  );

  const renderListing = useCallback(
    ({ item, index }: { item: AssetListing; index: number }) => {
      const isOwn = item.sellerId === userId;
      const canAfford = (player?.cash ?? 0) >= item.price;
      const isBuying = buying === item.id;

      return (
        <ListingCard
          listing={item}
          index={index}
          isOwn={isOwn}
          canAfford={canAfford}
          isBuying={isBuying}
          onBuy={() => handleBuy(item)}
        />
      );
    },
    [userId, player, buying, handleBuy],
  );

  return (
    <View style={styles.root}>
      {/* Header: kicker + title + count, then the balance chip — one entrance */}
      <Animated.View
        entering={FadeInDown.duration(Motion.durations.slow)}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <SectionTitle
          kicker="تجارت"
          title="بازار دارایی‌ها"
          trailing={
            <Text variant="caption" color="secondary">
              {listings.length.toLocaleString("fa-IR")} دارایی در فروش
            </Text>
          }
        />
        <View style={styles.balanceRow}>
          <Chip
            icon="wallet"
            value={player?.cash ?? 0}
            label="موجودی"
            tone="steel"
          />
        </View>
      </Animated.View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderListing}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.brass[400]}
            colors={[c.brass[400]]}
            progressBackgroundColor={c.ink[800]}
          />
        }
        ListEmptyComponent={
          isLoadingListings ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={c.steel} size="large" />
              <Text variant="body" color="secondary">
                در حال بارگذاری...
              </Text>
            </View>
          ) : listingsError ? (
            <Animated.View entering={FadeInDown.duration(Motion.durations.slow)}>
              <EmptyState
                icon="cloud-offline"
                tone="crimson"
                title="خطا در بارگذاری بازار"
                body={listingsError}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(Motion.durations.slow)}>
              <EmptyState
                icon="storefront"
                title="بازار خالی است"
                body="هنوز هیچ دارایی برای فروش لیست نشده. از صفحه «دارایی‌ها» دارایی خود را بفروشید!"
              />
            </Animated.View>
          )
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  );
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

const ListingCard: React.FC<{
  listing: AssetListing;
  index: number;
  isOwn: boolean;
  canAfford: boolean;
  isBuying: boolean;
  onBuy: () => void;
}> = ({ listing, index, isOwn, canAfford, isBuying, onBuy }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeCardStyles(c), [c]);
  const asset = listing.asset;
  const plate: { name: PlateIcon; tone: PlateTone } = asset
    ? (BUILDING_ICON[asset.type] ?? { name: "business", tone: "neutral" })
    : { name: "business", tone: "neutral" };

  return (
    <Animated.View
      entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}
    >
      <Card sheen>
        <View style={styles.stack}>
          {/* Header */}
          <View style={styles.headerRow}>
            <IconPlate name={plate.name} tone={plate.tone} size="md" />
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text
                  variant="subtitle"
                  weight="semibold"
                  numberOfLines={1}
                  style={styles.nameText}
                >
                  {asset ? BUILDING_LABEL[asset.type] : "دارایی"}
                </Text>
                {asset && (
                  <Chip
                    label={`سطح ${asset.level.toLocaleString("fa-IR")}`}
                    tone="neutral"
                  />
                )}
              </View>
              <View style={styles.sellerRow}>
                <Text
                  variant="caption"
                  color="secondary"
                  numberOfLines={1}
                  style={styles.sellerText}
                >
                  فروشنده: {listing.sellerUsername ?? "ناشناس"}
                </Text>
                {isOwn && <Chip icon="person" label="دارایی شما" tone="jade" />}
              </View>
              {asset && (
                <View style={styles.coordsRow}>
                  <Ionicons name="location" size={11} color={c.text.muted} />
                  <Text variant="caption" color="muted" style={styles.coords}>
                    {asset.latitude.toFixed(3)}°, {asset.longitude.toFixed(3)}°
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Data */}
          {asset && (
            <View style={styles.statsRow}>
              <Chip icon="cash" value={asset.marketValue} label="ارزش" tone="brass" />
              <Chip icon="flash" value={asset.powerBonus} label="قدرت" tone="terracotta" />
            </View>
          )}

          {/* Price + Buy — footer row (thumb zone) */}
          <View style={styles.footer}>
            <View style={styles.priceBox}>
              <Text variant="caption" color="secondary">
                قیمت
              </Text>
              <Text
                variant="subtitle"
                weight="bold"
                color="brand"
                style={styles.price}
              >
                {listing.price.toLocaleString("fa-IR")}
              </Text>
            </View>
            {!isOwn &&
              (canAfford ? (
                <Button
                  label="خرید"
                  variant="primary"
                  size="sm"
                  icon={<Ionicons name="cart" size={14} color={c.text.inverse} />}
                  loading={isBuying}
                  onPress={onBuy}
                  style={styles.buyBtn}
                />
              ) : (
                <Button
                  label="موجودی ناکافی"
                  variant="ghost"
                  size="sm"
                  disabled
                  onPress={onBuy}
                  style={styles.buyBtn}
                />
              ))}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeScreenStyles = (c: Palette) =>
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
    balanceRow: {
      flexDirection: "row",
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: Spacing["3xl"],
      gap: Spacing.md,
    },
  });

// Card anatomy (DESIGN.md §5): header row → meta → data row → action row,
// gaps 8/12/16, padding 16 (Card default), 44pt action targets.
const makeCardStyles = (c: Palette) =>
  StyleSheet.create({
    stack: {
      gap: Spacing.md, // 12 between anatomy sections
    },
    headerRow: {
      flexDirection: "row",
      gap: Spacing.md, // 12
      alignItems: "flex-start",
    },
    info: {
      flex: 1,
      gap: Spacing.sm, // 8 between meta rows
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    nameText: {
      flexShrink: 1,
    },
    sellerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flexWrap: "wrap",
    },
    sellerText: {
      flexShrink: 1,
    },
    coordsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xxs,
    },
    coords: {
      writingDirection: "ltr",
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm, // 8
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    priceBox: {
      gap: 1,
    },
    price: {
      fontVariant: ["tabular-nums"],
    },
    buyBtn: {
      minHeight: 44,
    },
  });
