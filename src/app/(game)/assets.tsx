/**
 * BuildIran — Assets Screen
 * Lists all assets owned by the current player.
 * Allows upgrading and listing for sale.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useAssetStore, BUILDING_CONFIG } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import type { Asset, BuildingType } from '@/types/game.types';

const BUILDING_EMOJI: Record<BuildingType, string> = {
  house: '🏠', villa: '🏡', shop: '🏪', mall: '🏬',
  market: '🏦', office: '🏢', farm: '🌾', warehouse: '🏭',
  tower: '🗼', barracks: '⚔️',
};

const BUILDING_LABEL: Record<BuildingType, string> = {
  house: 'خانه', villa: 'ویلا', shop: 'مغازه', mall: 'مرکز خرید',
  market: 'بازار', office: 'اداره', farm: 'مزرعه', warehouse: 'انبار',
  tower: 'برج', barracks: 'پادگان',
};

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saleModal, setSaleModal] = useState<Asset | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('موجودی ناکافی', `برای ارتقاء به ${upgradeCost.toLocaleString('fa-IR')} 💰 نیاز دارید.`);
      return;
    }

    Alert.alert(
      `ارتقاء ${BUILDING_LABEL[asset.type]}`,
      `هزینه ارتقاء به سطح ${asset.level + 1}: ${upgradeCost.toLocaleString('fa-IR')} 💰`,
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
      Alert.alert('✅ موفق', 'دارایی شما در بازار فروش لیست شد.');
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
      <LinearGradient
        colors={['#080C1A', '#0D1533']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        {/* Header Stats */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>🏛️ دارایی‌های من</Text>
          <Text style={styles.headerSub}>{myAssets.length} سازه</Text>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: '#FFD700' }]}>
            <Text style={styles.summaryValue}>💰 {totalValue.toLocaleString('fa-IR')}</Text>
            <Text style={styles.summaryLabel}>ارزش کل</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#A78BFA' }]}>
            <Text style={styles.summaryValue}>⚔️ +{totalPower}</Text>
            <Text style={styles.summaryLabel}>قدرت کل</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#34D399' }]}>
            <Text style={styles.summaryValue}>💵 {(player?.cash ?? 0).toLocaleString('fa-IR')}</Text>
            <Text style={styles.summaryLabel}>موجودی</Text>
          </View>
        </Animated.View>

        {/* Asset List */}
        {myAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏗️</Text>
            <Text style={styles.emptyTitle}>هنوز سازه‌ای ندارید</Text>
            <Text style={styles.emptySub}>روی نقشه ضربه بزنید تا اولین ساختمان خود را بسازید</Text>
          </View>
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

      {/* List for Sale Modal */}
      <Modal visible={!!saleModal} transparent animationType="slide" onRequestClose={() => setSaleModal(null)}>
        <View style={saleStyles.overlay}>
          <View style={saleStyles.sheet}>
            <LinearGradient colors={['#0D1533', '#080C1A']} style={StyleSheet.absoluteFill} />
            <Text style={saleStyles.title}>
              💰 قیمت فروش {saleModal ? BUILDING_LABEL[saleModal.type] : ''}
            </Text>
            <Text style={saleStyles.sub}>ارزش بازار: {saleModal?.marketValue?.toLocaleString('fa-IR')}</Text>
            <View style={saleStyles.inputWrapper}>
              <TextInput
                style={saleStyles.input}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                placeholder="قیمت پیشنهادی"
                placeholderTextColor="rgba(255,255,255,0.35)"
                textAlign="right"
              />
            </View>
            <View style={saleStyles.btnRow}>
              <TouchableOpacity style={saleStyles.cancelBtn} onPress={() => setSaleModal(null)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)' }}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={saleStyles.confirmBtn} onPress={handleListForSale} disabled={loading}>
                <LinearGradient colors={['#6C63FF', '#A78BFA']} style={saleStyles.confirmGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>فروش در بازار</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── AssetCard ────────────────────────────────────────────────────────────────

const AssetCard: React.FC<{
  asset: Asset;
  index: number;
  onUpgrade: () => void;
  onList: () => void;
}> = ({ asset, index, onUpgrade, onList }) => (
  <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
    <View style={cardStyles.card}>
      <LinearGradient
        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.emojiBox}>
          <Text style={cardStyles.emoji}>{BUILDING_EMOJI[asset.type]}</Text>
        </View>
        <View style={cardStyles.info}>
          <View style={cardStyles.titleRow}>
            <Text style={cardStyles.name}>{BUILDING_LABEL[asset.type]}</Text>
            <View style={[cardStyles.levelBadge, asset.isForSale && cardStyles.saleBadge]}>
              <Text style={cardStyles.levelText}>
                {asset.isForSale ? '🔖 فروش' : `سطح ${asset.level}`}
              </Text>
            </View>
          </View>
          <Text style={cardStyles.coords}>
            📍 {asset.latitude.toFixed(3)}°, {asset.longitude.toFixed(3)}°
          </Text>
          <View style={cardStyles.statsRow}>
            <Text style={cardStyles.statText}>💰 {asset.marketValue.toLocaleString('fa-IR')}</Text>
            <Text style={cardStyles.statText}>⚔️ +{asset.powerBonus}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.upgradeBtn} onPress={onUpgrade}>
          <Text style={cardStyles.upgradeBtnText}>⬆️ ارتقاء</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.listBtn, asset.isForSale && cardStyles.listBtnActive]}
          onPress={onList}
        >
          <Text style={[cardStyles.listBtnText, asset.isForSale && { color: '#EF4444' }]}>
            {asset.isForSale ? '🚫 لغو فروش' : '🏷️ فروش'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Animated.View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 4, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  emptySub: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, fontSize: 14 },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    overflow: 'hidden',
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  levelBadge: {
    backgroundColor: 'rgba(108,99,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  saleBadge: { backgroundColor: 'rgba(255,211,0,0.2)', borderColor: '#FFD700' },
  levelText: { color: '#A78BFA', fontSize: 11, fontWeight: '600' },
  coords: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  upgradeBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.1)',
  },
  upgradeBtnText: { color: '#34D399', fontSize: 13, fontWeight: '600' },
  listBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.4)',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(108,99,255,0.1)',
  },
  listBtnActive: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.1)' },
  listBtnText: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
});

const saleStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    overflow: 'hidden',
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: { color: '#FFFFFF', fontSize: 16 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtn: { flex: 2, borderRadius: 12, overflow: 'hidden', elevation: 6 },
  confirmGradient: { paddingVertical: 14, alignItems: 'center' },
});
