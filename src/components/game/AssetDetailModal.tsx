/**
 * BuildIran — Asset Detail Modal
 * Interactive card/modal showing building details when an asset marker is tapped on the map.
 * Wired to the economy system: service usage, popularity boost, engagement dashboard.
 */

import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { BUILDING_CONFIG, useAssetStore } from "@/store/useAssetStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useEconomyStore } from "@/store/useEconomyStore";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { Colors, Radii } from "@/theme";
import type { Asset, InstitutionType } from "@/types/game.types";
import { INSTITUTION_DEFINITIONS } from "@/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { InstitutionServiceModal } from "./InstitutionServiceModal";
import { PopularityBoostModal } from "./PopularityBoostModal";
import { EngagementDashboard } from "./EngagementDashboard";

const BUILDING_LABELS: Record<
  string,
  { label: string; emoji: string; desc: string }
> = {
  house: { label: "خانه", emoji: "🏠", desc: "اقامتگاه مسکونی" },
  villa: { label: "ویلا", emoji: "🏡", desc: "اقامتگاه لوکس" },
  shop: { label: "مغازه", emoji: "🏪", desc: "واحد تجاری خرد" },
  mall: { label: "مرکز خرید", emoji: "🏬", desc: "مجتمع تجاری بزرگ" },
  market: { label: "بازار", emoji: "🏦", desc: "مرکز مبادلات اقتصادی" },
  office: { label: "اداره", emoji: "🏢", desc: "دفتر اداری و شرکتی" },
  farm: { label: "مزرعه", emoji: "🌾", desc: "تولید منابع غذایی" },
  warehouse: { label: "انبار", emoji: "🏭", desc: "ذخیره‌سازی تجهیزات" },
  tower: { label: "برج", emoji: "🗼", desc: "برج دیده‌بانی و دفاعی" },
  barracks: { label: "پادگان", emoji: "⚔️", desc: "پایگاه آموزش نظامی" },
};

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
  const isAssetBoosted = useEconomyStore((s) => s.isAssetBoosted);
  const { track } = useActivityTracker();

  // Track asset inspection for activity points
  useEffect(() => {
    if (visible && asset) {
      track('asset_inspect');
    }
  }, [visible, asset?.id]);

  if (!asset) return null;

  const isOwned = player ? asset.ownerId === player.id : false;
  const buildingInfo = BUILDING_LABELS[asset.type] || {
    label: asset.type,
    emoji: "🏛️",
    desc: "سازه شهری",
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
  const isBoosted = isAssetBoosted(asset.id);

  const handleUpgrade = async () => {
    if (!player) return;
    if (player.cash < upgradeCost) {
      GameAudio.playError();
      Alert.alert(
        "موجودی ناکافی",
        `برای ارتقاء به ${upgradeCost.toLocaleString("fa-IR")} 💰 نیاز دارید.`,
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
      const ok = await cancelListing(asset.id);
      if (ok) {
        GameAudio.playTap();
      }
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
        `شما برای خرید به ${priceToBuy.toLocaleString("fa-IR")} 💰 نیاز دارید.`,
      );
      return;
    }

    setLoading(true);
    try {
      if (activeListing) {
        const ok = await buyAsset(activeListing.id, player.id);
        if (ok) {
          updateCash(-priceToBuy);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={styles.sheet}
        >
          <LinearGradient
            colors={["#0D1533", "#080C1A"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.avatarBox,
                  { borderColor: isOwned ? "#10B981" : "#6366F1" },
                ]}
              >
                <Text variant="display" color="brand">
                  {buildingInfo.emoji}
                </Text>
              </View>
              <View style={styles.titleCol}>
                <View style={styles.titleRow}>
                  <Text variant="heading" weight="bold" color="primary">
                    {buildingInfo.label}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      isOwned ? styles.badgeOwned : styles.badgeOther,
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      color={isOwned ? "inverse" : "primary"}
                    >
                      {isOwned
                        ? "مالک: شما"
                        : `مالک: ${asset.ownerUsername || "ناشناس"}`}
                    </Text>
                  </View>
                </View>
                <Text variant="body" color="secondary">
                  {buildingInfo.desc}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text variant="caption" color="secondary">سطح سازه</Text>
              <Text variant="body" weight="medium" color="primary">
                ⭐ {asset.level}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="caption" color="secondary">ارزش بازار</Text>
              <Text variant="body" weight="medium" color="primary">
                💰 {asset.marketValue.toLocaleString("fa-IR")}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="caption" color="secondary">قدرت اثر</Text>
              <Text variant="body" weight="medium" color="primary">
                ⚡ +{asset.powerBonus}
              </Text>
            </View>
          </View>

          {/* Economy Stats Row */}
          <View style={styles.statsGrid}>
            {asset.incomeRate > 0 && (
              <View style={styles.statCard}>
                <Text variant="caption" color="secondary">درآمد/ساعت</Text>
                <Text variant="body" weight="medium" style={{ color: '#FFD700' }}>
                  💵 {asset.incomeRate.toLocaleString('fa-IR')}
                </Text>
              </View>
            )}
            {asset.dailyPowerDrip > 0 && (
              <View style={styles.statCard}>
                <Text variant="caption" color="secondary">قدرت/روز</Text>
                <Text variant="body" weight="medium" style={{ color: '#A78BFA' }}>
                  ⚔️ +{asset.dailyPowerDrip}
                </Text>
              </View>
            )}
            {asset.totalViews > 0 && (
              <View style={styles.statCard}>
                <Text variant="caption" color="secondary">بازدید کل</Text>
                <Text variant="body" weight="medium" style={{ color: '#34D399' }}>
                  👁️ {asset.totalViews.toLocaleString('fa-IR')}
                </Text>
              </View>
            )}
          </View>

          {/* Institution badge */}
          {instDef && (
            <View style={styles.instBadge}>
              <Text style={styles.instEmoji}>{instDef.emoji}</Text>
              <Text variant="caption" color="secondary">{instDef.nameFa}</Text>
              {isBoosted && (
                <View style={styles.boostPill}>
                  <Text variant="caption" weight="bold" style={{ color: '#FB923C' }}>🔥 ۲× درآمد</Text>
                </View>
              )}
            </View>
          )}

          {/* Engagement dashboard (owner only) */}
          {isOwned && showEngagement && (
            <View style={styles.engagementWrap}>
              <EngagementDashboard assetId={asset.id} />
            </View>
          )}

          {/* Coordinates Info */}
          <View style={styles.coordRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={Colors.text.muted}
            />
            <Text variant="caption" color="secondary">
              مختصات: {asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}
            </Text>
          </View>

          {/* Action Area */}
          <View style={styles.actionsContainer}>
            {isOwned ? (
              <>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.upgradeBtn]}
                    onPress={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
                        <Text weight="semibold" color="inverse">
                          ارتقاء سطح {asset.level + 1} ({upgradeCost.toLocaleString("fa-IR")} 💰)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {!asset.isForSale ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.sellBtn]}
                      onPress={() => setShowSellInput((v) => !v)}
                    >
                      <Ionicons name="pricetag-outline" size={18} color="#FFFFFF" />
                      <Text weight="semibold" color="inverse">فروش</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={handleCancelSale}
                      disabled={loading}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                      <Text weight="semibold" color="inverse">
                        لغو فروش ({asset.askPrice?.toLocaleString("fa-IR")} 💰)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Owner economy buttons */}
                <View style={styles.btnRow}>
                  {instDef && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.boostBtn]}
                      onPress={() => { GameAudio.playTap(); setShowBoostModal(true); }}
                    >
                      <Text weight="semibold" color="inverse">
                        {isBoosted ? '🔥 ۲× فعال' : '🚀 تقویت درآمد'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.dashBtn]}
                    onPress={() => { GameAudio.playTap(); setShowEngagement((v) => !v); }}
                  >
                    <Text weight="semibold" color="inverse">
                      {showEngagement ? '📊 بستن' : '📊 تعامل'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showSellInput && !asset.isForSale && (
                  <View style={styles.sellInputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="قیمت پیشنهادی (سکه)..."
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={salePrice}
                      onChangeText={setSalePrice}
                    />
                    <TouchableOpacity
                      style={styles.confirmSellBtn}
                      onPress={handleListForSale}
                      disabled={loading}
                    >
                      <Text weight="semibold" color="inverse">ثبت در بازار</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.otherActionBox}>
                {/* Use service institution (non-owner) */}
                {instDef && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.serviceBtn]}
                    onPress={() => { GameAudio.playTap(); setShowServiceModal(true); }}
                  >
                    <Text style={{ fontSize: 18 }}>{instDef.emoji}</Text>
                    <Text weight="semibold" color="inverse">
                      استفاده از {instDef.nameFa}
                    </Text>
                  </TouchableOpacity>
                )}

                {asset.isForSale && priceToBuy ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.buyBtn]}
                    onPress={handleBuy}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                        <Text weight="semibold" color="inverse">
                          خرید — {priceToBuy.toLocaleString("fa-IR")} 💰
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : !instDef ? (
                  <View style={styles.notForSaleBox}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#6366F1" />
                    <Text variant="body" color="secondary">
                      این سازه متعلق به بازیکن دیگری است.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>

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
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
  titleCol: {
    alignItems: "flex-end",
  },
  titleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeOwned: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  badgeOther: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  desc: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  coordRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  coordText: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  actionsContainer: {
    gap: 10,
  },
  btnRow: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  instBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    marginBottom: 4,
  },
  instEmoji: { fontSize: 18 },
  boostPill: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.4)',
  },
  engagementWrap: {
    maxHeight: 320,
    marginBottom: 8,
  },
  serviceBtn: {
    backgroundColor: '#6C63FF',
    marginBottom: 8,
  },
  boostBtn: {
    backgroundColor: '#D97706',
    flex: 1,
  },
  dashBtn: {
    backgroundColor: '#0F766E',
    flex: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  upgradeBtn: {
    backgroundColor: "#059669",
    flex: 2,
  },
  sellBtn: {
    backgroundColor: "#D97706",
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: "#DC2626",
  },
  buyBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  sellInputBox: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 6,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    color: "#FFFFFF",
    textAlign: "right",
    fontSize: 13,
  },
  confirmSellBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  confirmSellText: {
    color: "#000000",
    fontWeight: "800",
    fontSize: 12,
  },
  otherActionBox: {
    width: "100%",
  },
  notForSaleBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: Radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  notForSaleText: {
    color: "#A5B4FC",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AssetDetailModal;
