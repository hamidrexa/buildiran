/**
 * BuildIran — Build Modal
 * Appears when user taps a location on the map.
 * Lets player select a standard or neighborhood-approved custom building type,
 * or propose a new custom building to the neighborhood editors.
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { useScalePop } from '@/lib/effects';
import { supabase } from '@/lib/supabase';
import { useAssetStore } from '@/store/useAssetStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import type { BuildingType, CustomBuildingType, LatLng } from '@/types/game.types';
import { tileIdFromCoordinate, type StreetProximityResult } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { ProposeBuildingModal } from './ProposeBuildingModal';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Standard Building definitions ──────────────────────────────────────────

interface BuildingDef {
  type: BuildingType;
  emoji: string;
  label: string;
  description: string;
  color: [string, string];
  cost: number;
  value: number;
  power: number;
}

const STANDARD_BUILDINGS: BuildingDef[] = [
  { type: 'house',     emoji: '🏠', label: 'خانه',       description: 'اقامتگاه ساده برای افزایش جمعیت',   color: ['#34D399', '#059669'], cost: 500,  value: 800,  power: 2 },
  { type: 'villa',     emoji: '🏡', label: 'ویلا',        description: 'اقامتگاه لوکس با ارزش بالا',        color: ['#A78BFA', '#7C3AED'], cost: 3500, value: 6000, power: 5 },
  { type: 'shop',      emoji: '🏪', label: 'مغازه',       description: 'تجارت کوچک برای درآمد روزانه',       color: ['#FCD34D', '#D97706'], cost: 1200, value: 2000, power: 3 },
  { type: 'mall',      emoji: '🏬', label: 'مرکز خرید',   description: 'مجتمع تجاری با سود بالا',           color: ['#FB923C', '#EA580C'], cost: 5000, value: 9000, power: 8 },
  { type: 'market',    emoji: '🏦', label: 'بازار',        description: 'مرکز مبادلات اقتصادی شهر',          color: ['#60A5FA', '#2563EB'], cost: 1500, value: 2500, power: 3 },
  { type: 'office',    emoji: '🏢', label: 'اداره',        description: 'دفتر اداری برای قدرت سیاسی',        color: ['#94A3B8', '#475569'], cost: 2500, value: 4500, power: 6 },
  { type: 'farm',      emoji: '🌾', label: 'مزرعه',        description: 'تولید غذا برای جمعیت',              color: ['#86EFAC', '#16A34A'], cost: 800,  value: 1200, power: 1 },
  { type: 'warehouse', emoji: '🏭', label: 'انبار',        description: 'ذخیره منابع و کالا',                color: ['#FCA5A5', '#DC2626'], cost: 1000, value: 1800, power: 2 },
  { type: 'tower',     emoji: '🗼', label: 'برج',          description: 'برج دفاعی با قدرت نظامی بالا',      color: ['#F472B6', '#DB2777'], cost: 3000, value: 5000, power: 15 },
  { type: 'barracks',  emoji: '⚔️', label: 'پادگان',       description: 'آموزش نیروهای نظامی',               color: ['#EF4444', '#991B1B'], cost: 4000, value: 7000, power: 20 },
];

interface BuildModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  proximityResult?: StreetProximityResult | null;
  onClose: () => void;
}

export function BuildModal({ visible, coordinate, proximityResult, onClose }: BuildModalProps) {
  const [selectedItem, setSelectedItem] = useState<{
    type: string;
    label: string;
    description: string;
    cost: number;
    value: number;
    power: number;
    emoji: string;
  } | null>(null);

  const [building, setBuilding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);

  const buildAsset = useAssetStore((s) => s.buildAsset);
  const player = usePlayerStore((s) => s.player);
  const updateCash = usePlayerStore((s) => s.updateCash);
  const updateStats = usePlayerStore((s) => s.updateStats);
  const incrementScore = usePlayerStore((s) => s.incrementScore);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const approvedCustomTypes = useNeighborhoodStore((s) => s.approvedCustomTypes);
  const { style: btnStyle, pop } = useScalePop();
  const { track } = useActivityTracker();
  const ruleMeters = proximityResult?.ruleDistanceMeters ?? 10;

  const handleSelectStandard = useCallback((b: BuildingDef) => {
    setSelectedItem({
      type: b.type,
      label: b.label,
      description: b.description,
      cost: b.cost,
      value: b.value,
      power: b.power,
      emoji: b.emoji,
    });
    GameAudio.playTap();
  }, []);

  const handleSelectCustom = useCallback((c: CustomBuildingType) => {
    setSelectedItem({
      type: c.code,
      label: c.nameFa,
      description: c.descriptionFa,
      cost: c.baseCost,
      value: Math.floor(c.baseCost * 1.3),
      power: c.powerBonus,
      emoji: c.emoji || '🏛️',
    });
    GameAudio.playTap();
  }, []);

  const handleBuild = useCallback(async () => {
    if (!selectedItem || !coordinate || !player) return;

    // Strict application-layer validation: Location must not be within rule distance of streets
    if (proximityResult && !proximityResult.isValid) {
      GameAudio.playError();
      Alert.alert(
        'عدم امکان احداث ملک',
        proximityResult.message || `ساخت روی معابر و خیابان‌ها (یا فاصله کمتر از ${ruleMeters.toLocaleString('fa-IR')} متر) مجاز نیست.`
      );
      return;
    }

    if (player.cash < selectedItem.cost) {
      GameAudio.playError();
      return;
    }

    pop();
    setBuilding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const tileId = tileIdFromCoordinate(coordinate);
      const asset = await buildAsset({
        userId: session.user.id,
        type: selectedItem.type,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        tileId,
        marketValue: selectedItem.value,
        powerBonus: selectedItem.power,
      });

      if (!asset) throw new Error('Build failed');

      const newPower = (player.power ?? 0) + selectedItem.power;

      // Deduct cash from profile and award building power bonus
      await supabase
        .from('profiles')
        .update({
          cash: player.cash - selectedItem.cost,
          power: newPower,
        })
        .eq('id', session.user.id);

      updateCash(-selectedItem.cost);
      updateStats({ power: newPower });
      incrementScore(selectedItem.power * 10);
      track('build_complete');
      await GameAudio.playBuild();
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setSelectedItem(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.warn('[BuildModal] build error:', err);
      GameAudio.playError();
    } finally {
      setBuilding(false);
    }
  }, [selectedItem, coordinate, player, proximityResult, ruleMeters, buildAsset, updateCash, updateStats, incrementScore, track, onClose, pop]);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  if (!coordinate) return null;

  const canAfford = player && selectedItem ? player.cash >= selectedItem.cost : false;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

          <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
            <LinearGradient
              colors={['#0D1533', '#080C1A']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            <View style={styles.handle} />

            {success ? (
              <View style={styles.successBox}>
                <Text variant="display" color="brand">🎉</Text>
                <Text variant="heading" weight="bold" color="primary">ساخت موفق!</Text>
                <Text variant="body" color="secondary">
                  {selectedItem?.label ?? 'سازه'} با موفقیت در نقشه ساخته شد
                </Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text variant="heading" weight="bold" color="primary">📍 انتخاب سازه برای ساخت</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <Text variant="caption" color="secondary">
                        {currentNeighborhood ? `محله ${currentNeighborhood.nameFa} | ` : ''}
                        {coordinate.latitude.toFixed(4)}°, {coordinate.longitude.toFixed(4)}°
                      </Text>
                      {proximityResult?.isValid && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>✅ حریم {ruleMeters.toLocaleString('fa-IR')} متر معابر رعایت شده</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.cashBadge}>
                    <Text variant="body" weight="semibold" color="inverse">💰 {(player?.cash ?? 0).toLocaleString('fa-IR')}</Text>
                  </View>
                </View>

                {/* Building Scroll Area */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollArea}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Standard Buildings */}
                  <Text variant="title" weight="semibold" color="primary">سازه‌های اصلی شهر:</Text>
                  <View style={styles.buildingGrid}>
                    {STANDARD_BUILDINGS.map((b) => {
                      const isSelected = selectedItem?.type === b.type;
                      const affordable = (player?.cash ?? 0) >= b.cost;

                      return (
                        <TouchableOpacity
                          key={b.type}
                          style={[
                            styles.buildingCard,
                            isSelected && styles.buildingCardSelected,
                            !affordable && styles.buildingCardDisabled,
                          ]}
                          onPress={() => affordable && handleSelectStandard(b)}
                          activeOpacity={affordable ? 0.8 : 1}
                        >
                          <Text variant="display" color="brand">{b.emoji}</Text>
                          <Text variant="body" weight="medium" color={affordable ? 'primary' : 'muted'}>
                            {b.label}
                          </Text>
                          <Text variant="caption" color={affordable ? 'primary' : 'muted'}>
                            💰 {b.cost.toLocaleString('fa-IR')}
                          </Text>
                          <Text variant="caption" color="secondary">⚔️ +{b.power}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Neighborhood Custom Approved Buildings */}
                  {approvedCustomTypes.length > 0 && (
                    <>
                      <Text variant="title" weight="semibold" color="primary">
                        سازه‌های اختصاصی محله (طراحی شده توسط بازیکنان):
                      </Text>
                      <View style={styles.buildingGrid}>
                        {approvedCustomTypes.map((c) => {
                          const isSelected = selectedItem?.type === c.code;
                          const affordable = (player?.cash ?? 0) >= c.baseCost;

                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={[
                                styles.buildingCard,
                                styles.customCard,
                                isSelected && styles.buildingCardSelected,
                                !affordable && styles.buildingCardDisabled,
                              ]}
                              onPress={() => affordable && handleSelectCustom(c)}
                              activeOpacity={affordable ? 0.8 : 1}
                            >
                              <Text variant="display" color="brand">{c.emoji || '🏛️'}</Text>
                              <Text variant="body" weight="medium" color={affordable ? 'primary' : 'muted'}>
                                {c.nameFa}
                              </Text>
                              <Text variant="caption" color={affordable ? 'primary' : 'muted'}>
                                💰 {c.baseCost.toLocaleString('fa-IR')}
                              </Text>
                              <Text variant="caption" color="secondary">⚔️ +{c.powerBonus}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Propose New Custom Building Button */}
                  <TouchableOpacity
                    style={styles.proposeBanner}
                    onPress={() => {
                      GameAudio.playTap();
                      setShowProposeModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(108,99,255,0.25)', 'rgba(139,92,246,0.15)']}
                      style={styles.proposeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text variant="display" color="brand">💡</Text>
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="semibold" color="primary">پیشنهاد نوع سازه جدید</Text>
                        <Text variant="caption" color="secondary">
                          طرح سازه دلخواه خود را ثبت کنید تا ویرایشگران محله آن را تأیید کنند
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#A78BFA" />
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>

                {/* Selected Details + Build Button */}
                {selectedItem && (
                  <View style={styles.footer}>
                    <View style={styles.selectedInfo}>
                      <Text variant="title" weight="semibold" color="primary">
                        {selectedItem.emoji} {selectedItem.label}
                      </Text>
                      <Text variant="body" color="secondary">{selectedItem.description}</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                          <Text variant="caption" color="secondary">ارزش سازه</Text>
                          <Text variant="body" weight="medium" color="primary">💰 {selectedItem.value.toLocaleString('fa-IR')}</Text>
                        </View>
                        <View style={styles.statBadge}>
                          <Text variant="caption" color="secondary">پاداش قدرت</Text>
                          <Text variant="body" weight="medium" color="primary">⚔️ +{selectedItem.power}</Text>
                        </View>
                        <View style={styles.statBadge}>
                          <Text variant="caption" color="secondary">هزینه ساخت</Text>
                          <Text variant="body" weight="medium" color={!canAfford ? 'muted' : 'primary'}>
                            💰 {selectedItem.cost.toLocaleString('fa-IR')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Animated.View style={btnStyle}>
                      <TouchableOpacity
                        style={[styles.buildBtn, (!canAfford || building) && styles.buildBtnDisabled]}
                        onPress={handleBuild}
                        disabled={!canAfford || building}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={canAfford ? ['#6C63FF', '#A78BFA'] : ['#374151', '#1F2937']}
                          style={styles.buildBtnGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          {building ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text weight="semibold" color="inverse">
                              {canAfford ? '🏗️  احداث سازه در این مکان' : '💸  موجودی ناکافی'}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Propose Custom Building Modal */}
      <ProposeBuildingModal
        visible={showProposeModal}
        onClose={() => setShowProposeModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: SCREEN_H * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  coords: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cashBadge: {
    backgroundColor: 'rgba(255,211,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,211,0,0.3)',
  },
  cashText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },

  scrollArea: { maxHeight: SCREEN_H * 0.4 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8, marginTop: 4 },

  buildingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  buildingCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  customCard: {
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  buildingCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108,99,255,0.2)',
  },
  buildingCardDisabled: { opacity: 0.35 },
  buildingEmoji: { fontSize: 26 },
  buildingLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  buildingCost: { color: '#FFD700', fontSize: 10 },
  buildingPower: { color: '#A78BFA', fontSize: 9 },
  dimText: { color: 'rgba(255,255,255,0.4)' },
  costRed: { color: '#EF4444' },

  proposeBanner: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.35)',
  },
  proposeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  proposeEmoji: { fontSize: 24 },
  proposeTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  proposeSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
  },
  selectedInfo: { gap: 4 },
  selectedTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  selectedDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statBadge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9 },
  statValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  buildBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  buildBtnDisabled: { opacity: 0.5 },
  buildBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  buildBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  successBox: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  successEmoji: { fontSize: 54 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#34D399' },
  successSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
});
