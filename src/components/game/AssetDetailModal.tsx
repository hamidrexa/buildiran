/**
 * BuildIran — Asset Detail Modal
 * Interactive card/modal showing building details when an asset marker is tapped on the map.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Colors, Radii } from '@/theme';
import { useAssetStore, BUILDING_CONFIG } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import type { Asset } from '@/types/game.types';

const BUILDING_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  house:     { label: 'خانه',       emoji: '🏠', desc: 'اقامتگاه مسکونی' },
  villa:     { label: 'ویلا',        emoji: '🏡', desc: 'اقامتگاه لوکس' },
  shop:      { label: 'مغازه',       emoji: '🏪', desc: 'واحد تجاری خرد' },
  mall:      { label: 'مرکز خرید',   emoji: '🏬', desc: 'مجتمع تجاری بزرگ' },
  market:    { label: 'بازار',        emoji: '🏦', desc: 'مرکز مبادلات اقتصادی' },
  office:    { label: 'اداره',        emoji: '🏢', desc: 'دفتر اداری و شرکتی' },
  farm:      { label: 'مزرعه',        emoji: '🌾', desc: 'تولید منابع غذایی' },
  warehouse: { label: 'انبار',        emoji: '🏭', desc: 'ذخیره‌سازی تجهیزات' },
  tower:     { label: 'برج',          emoji: '🗼', desc: 'برج دیده‌بانی و دفاعی' },
  barracks:  { label: 'پادگان',       emoji: '⚔️', desc: 'پایگاه آموزش نظامی' },
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
  const [salePrice, setSalePrice] = useState('');

  const player = usePlayerStore((s) => s.player);
  const updateCash = usePlayerStore((s) => s.updateCash);
  const upgradeAsset = useAssetStore((s) => s.upgradeAsset);
  const listForSale = useAssetStore((s) => s.listForSale);
  const cancelListing = useAssetStore((s) => s.cancelListing);
  const buyAsset = useAssetStore((s) => s.buyAsset);
  const listings = useAssetStore((s) => s.listings);

  if (!asset) return null;

  const isOwned = player ? asset.ownerId === player.id : false;
  const buildingInfo = BUILDING_LABELS[asset.type] || {
    label: asset.type,
    emoji: '🏛️',
    desc: 'سازه شهری',
  };

  const cfg = (BUILDING_CONFIG as any)[asset.type] || { cost: 1000, value: 1500, power: 5 };
  const upgradeCost = Math.floor(cfg.cost * 0.5 * asset.level);

  // Check if there's an active listing for this asset
  const activeListing = listings.find((l) => l.assetId === asset.id && l.status === 'active');
  const priceToBuy = asset.askPrice ?? activeListing?.price ?? null;

  const handleUpgrade = async () => {
    if (!player) return;
    if (player.cash < upgradeCost) {
      GameAudio.playError();
      Alert.alert('موجودی ناکافی', `برای ارتقاء به ${upgradeCost.toLocaleString('fa-IR')} 💰 نیاز دارید.`);
      return;
    }

    setLoading(true);
    try {
      const ok = await upgradeAsset(asset.id);
      if (ok) {
        updateCash(-upgradeCost);
        await supabase
          .from('profiles')
          .update({ cash: player.cash - upgradeCost })
          .eq('id', player.id);
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
      Alert.alert('خطا', 'لطفاً یک قیمت معتبر وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const ok = await listForSale(asset.id, priceNum);
      if (ok) {
        setShowSellInput(false);
        setSalePrice('');
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
      Alert.alert('موجودی ناکافی', `شما برای خرید به ${priceToBuy.toLocaleString('fa-IR')} 💰 نیاز دارید.`);
      return;
    }

    setLoading(true);
    try {
      if (activeListing) {
        const ok = await buyAsset(activeListing.id, player.id);
        if (ok) {
          updateCash(-priceToBuy);
          await supabase
            .from('profiles')
            .update({ cash: player.cash - priceToBuy })
            .eq('id', player.id);
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <LinearGradient
            colors={['#0D1533', '#080C1A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarBox, { borderColor: isOwned ? '#10B981' : '#6366F1' }]}>
                <Text style={styles.emoji}>{buildingInfo.emoji}</Text>
              </View>
              <View style={styles.titleCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{buildingInfo.label}</Text>
                  <View style={[styles.badge, isOwned ? styles.badgeOwned : styles.badgeOther]}>
                    <Text style={styles.badgeText}>{isOwned ? 'مالک: شما' : `مالک: ${asset.ownerUsername || 'ناشناس'}`}</Text>
                  </View>
                </View>
                <Text style={styles.desc}>{buildingInfo.desc}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>سطح سازه</Text>
              <Text style={styles.statVal}>⭐ {asset.level}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ارزش بازار</Text>
              <Text style={styles.statVal}>💰 {asset.marketValue.toLocaleString('fa-IR')}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>قدرت اثر</Text>
              <Text style={styles.statVal}>⚡ +{asset.powerBonus}</Text>
            </View>
          </View>

          {/* Coordinates Info */}
          <View style={styles.coordRow}>
            <Ionicons name="location-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.coordText}>
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
                        <Text style={styles.btnText}>
                          ارتقاء به سطح {asset.level + 1} ({upgradeCost.toLocaleString('fa-IR')} 💰)
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
                      <Text style={styles.btnText}>فروش</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={handleCancelSale}
                      disabled={loading}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>لغو فروش ({asset.askPrice?.toLocaleString('fa-IR')} 💰)</Text>
                    </TouchableOpacity>
                  )}
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
                      <Text style={styles.confirmSellText}>ثبت در بازار</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.otherActionBox}>
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
                        <Text style={styles.btnText}>
                          خرید این سازه به قیمت {priceToBuy.toLocaleString('fa-IR')} 💰
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.notForSaleBox}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#6366F1" />
                    <Text style={styles.notForSaleText}>این سازه متعلق به بازیکن دیگری است.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
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
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  titleCol: {
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeOwned: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgeOther: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row-reverse',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  upgradeBtn: {
    backgroundColor: '#059669',
    flex: 2,
  },
  sellBtn: {
    backgroundColor: '#D97706',
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: '#DC2626',
  },
  buyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sellInputBox: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    textAlign: 'right',
    fontSize: 13,
  },
  confirmSellBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  confirmSellText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
  },
  otherActionBox: {
    width: '100%',
  },
  notForSaleBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: Radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  notForSaleText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AssetDetailModal;
