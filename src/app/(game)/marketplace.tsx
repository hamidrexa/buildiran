/**
 * BuildIran — Marketplace Screen
 * Browse and buy assets listed for sale by other players.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { useAssetStore } from '@/store/useAssetStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import type { AssetListing, BuildingType } from '@/types/game.types';

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

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  const listings = useAssetStore((s) => s.listings);
  const isLoadingListings = useAssetStore((s) => s.isLoadingListings);
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleBuy = useCallback(async (listing: AssetListing) => {
    if (!userId || !player) return;
    if (listing.sellerId === userId) {
      Alert.alert('خطا', 'نمی‌توانید دارایی خود را بخرید.');
      return;
    }
    if (player.cash < listing.price) {
      GameAudio.playError();
      Alert.alert(
        'موجودی ناکافی',
        `برای خرید به ${listing.price.toLocaleString('fa-IR')} 💰 نیاز دارید.\nموجودی شما: ${player.cash.toLocaleString('fa-IR')} 💰`
      );
      return;
    }

    const assetLabel = listing.asset ? BUILDING_LABEL[listing.asset.type] : 'دارایی';
    Alert.alert(
      `خرید ${assetLabel}`,
      `قیمت: ${listing.price.toLocaleString('fa-IR')} 💰\nاز: ${listing.sellerUsername}`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: '💰 خرید',
          onPress: async () => {
            setBuying(listing.id);
            const ok = await buyAsset(listing.id, userId);
            if (ok) {
              // Deduct cash from buyer
              await supabase
                .from('profiles')
                .update({ cash: player.cash - listing.price })
                .eq('id', userId);

              // Add cash to seller
              try {
                await supabase.rpc('increment_cash', {
                  p_user_id: listing.sellerId,
                  p_amount: listing.price,
                });
              } catch {
                // Fallback if RPC not set up
              }

              updateCash(-listing.price);
              GameAudio.playBuy();
              Alert.alert('🎉 خرید موفق!', `${assetLabel} با موفقیت خریداری شد.`);
            } else {
              GameAudio.playError();
              Alert.alert('خطا', 'خرید ناموفق بود. دوباره تلاش کنید.');
            }
            setBuying(null);
          },
        },
      ]
    );
  }, [userId, player, buyAsset, updateCash]);

  const renderListing = useCallback(({ item, index }: { item: AssetListing; index: number }) => {
    const isOwn = item.sellerId === userId;
    const canAfford = (player?.cash ?? 0) >= item.price;
    const isBuying = buying === item.id;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
        <View style={cardStyles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Type + Level */}
          <View style={cardStyles.row}>
            <View style={cardStyles.emojiBox}>
              <Text style={cardStyles.emoji}>
                {item.asset ? BUILDING_EMOJI[item.asset.type] : '🏗️'}
              </Text>
            </View>
            <View style={cardStyles.info}>
              <Text style={cardStyles.name}>
                {item.asset ? BUILDING_LABEL[item.asset.type] : 'دارایی'}
                {item.asset ? ` — سطح ${item.asset.level}` : ''}
              </Text>
              <Text style={cardStyles.seller}>
                👤 {item.sellerUsername ?? 'ناشناس'}
                {isOwn ? '  (دارایی شما)' : ''}
              </Text>
              {item.asset && (
                <View style={cardStyles.statsRow}>
                  <Text style={cardStyles.stat}>💰 ارزش {item.asset.marketValue.toLocaleString('fa-IR')}</Text>
                  <Text style={cardStyles.stat}>⚔️ +{item.asset.powerBonus}</Text>
                  <Text style={cardStyles.stat}>
                    📍 {item.asset.latitude.toFixed(2)}°, {item.asset.longitude.toFixed(2)}°
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Price + Buy */}
          <View style={cardStyles.footer}>
            <View style={cardStyles.priceBox}>
              <Text style={cardStyles.priceLabel}>قیمت فروش</Text>
              <Text style={[cardStyles.price, !canAfford && cardStyles.priceRed]}>
                💰 {item.price.toLocaleString('fa-IR')}
              </Text>
            </View>
            {!isOwn && (
              <TouchableOpacity
                style={[
                  cardStyles.buyBtn,
                  (!canAfford || isBuying) && cardStyles.buyBtnDisabled,
                ]}
                onPress={() => handleBuy(item)}
                disabled={!canAfford || isBuying}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={canAfford ? ['#6C63FF', '#A78BFA'] : ['#374151', '#1F2937']}
                  style={cardStyles.buyBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isBuying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={cardStyles.buyBtnText}>
                      {canAfford ? '🛒 خرید' : '💸 ناکافی'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }, [userId, player, buying, handleBuy]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#080C1A', '#0D1533']}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderListing}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🏛️ بازار دارایی‌ها</Text>
            <Text style={styles.headerSub}>
              {listings.length} دارایی در فروش · موجودی: 💰{(player?.cash ?? 0).toLocaleString('fa-IR')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoadingListings ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#6C63FF" size="large" />
              <Text style={styles.emptyText}>در حال بارگذاری...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏷️</Text>
              <Text style={styles.emptyTitle}>بازار خالی است</Text>
              <Text style={styles.emptySub}>
                هنوز هیچ دارایی برای فروش لیست نشده. از صفحه «دارایی‌ها» دارایی خود را بفروشید!
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 4, marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  emptySub: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 12 },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,211,0,0.2)',
    overflow: 'hidden',
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,211,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  seller: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  stat: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceBox: { gap: 2 },
  priceLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  price: { color: '#FFD700', fontSize: 18, fontWeight: '800' },
  priceRed: { color: '#EF4444' },
  buyBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowRadius: 10,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  buyBtnDisabled: { shadowOpacity: 0 },
  buyBtnGradient: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
