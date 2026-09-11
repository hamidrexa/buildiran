/**
 * BuildIran — Build Modal (v3)
 * 3-step flow: 1) select building type → 2) choose build mode → 3a) fast confirm / 3b) gather materials
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { useScalePop } from '@/lib/effects';
import { supabase } from '@/lib/supabase';
import {
  BUILDING_CONFIG,
  INSTITUTION_CATEGORY,
  LICENSE_FEE,
  BUILD_MODE_ADVANCED_COST_RATIO,
} from '@/lib/constants';
import { useAssetStore } from '@/store/useAssetStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import type { BuildingType, CustomBuildingType, LatLng, InstitutionCategory } from '@/types/game.types';
import { tileIdFromCoordinate, type StreetProximityResult } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
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
import { BuildModeCard } from './BuildModeCard';
import { AdvancedBuildMaterialsSheet } from './AdvancedBuildMaterialsSheet';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Building catalog organized by institution category ──────────────────────

interface BuildingDef {
  type: string;
  emoji: string;
  label: string;
  category: InstitutionCategory;
}

const BUILDING_CATALOG: BuildingDef[] = [
  // Residential
  { type: 'house',      emoji: '🏠', label: 'خانه',       category: 'residential' },
  { type: 'villa',      emoji: '🏡', label: 'ویلا',        category: 'residential' },
  { type: 'tower',      emoji: '🏢', label: 'برج',         category: 'residential' },
  // Commercial
  { type: 'shop',       emoji: '🏪', label: 'مغازه',       category: 'commercial' },
  { type: 'cafe',       emoji: '☕', label: 'کافه',        category: 'commercial' },
  { type: 'gym',        emoji: '🏋️', label: 'باشگاه',      category: 'commercial' },
  { type: 'restaurant', emoji: '🍽️', label: 'رستوران',     category: 'commercial' },
  { type: 'mall',       emoji: '🏬', label: 'مرکز خرید',   category: 'commercial' },
  { type: 'exchange',   emoji: '💱', label: 'صرافی',       category: 'commercial' },
  { type: 'warehouse',  emoji: '🏭', label: 'انبار',        category: 'commercial' },
  // Industrial
  { type: 'farm',       emoji: '🌾', label: 'مزرعه',       category: 'industrial' },
  { type: 'factory',    emoji: '🏗️', label: 'کارخانه',     category: 'industrial' },
  // Public
  { type: 'hospital',   emoji: '🏥', label: 'بیمارستان',   category: 'public' },
  { type: 'park',       emoji: '🌳', label: 'پارک',         category: 'public' },
  { type: 'university', emoji: '🎓', label: 'دانشگاه',     category: 'public' },
  { type: 'bank',       emoji: '🏦', label: 'بانک',         category: 'public' },
];

const CATEGORY_LABELS: Record<InstitutionCategory, string> = {
  residential: 'مسکونی',
  commercial:  'تجاری',
  industrial:  'صنعتی',
  public:      'عمومی',
};

const CATEGORIES: InstitutionCategory[] = ['residential', 'commercial', 'industrial', 'public'];

type Step = 'type' | 'mode' | 'gather';

interface BuildModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  proximityResult?: StreetProximityResult | null;
  onClose: () => void;
}

export function BuildModal({ visible, coordinate, proximityResult, onClose }: BuildModalProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<BuildingDef | null>(null);
  const [selectedMode, setSelectedMode] = useState<'fast' | 'advanced' | null>(null);
  const [building, setBuilding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);

  const buildAssetFast    = useAssetStore((s) => s.buildAssetFast);
  const startAdvancedBuild = useAssetStore((s) => s.startAdvancedBuild);
  const addMaterialToSession = useAssetStore((s) => s.addMaterialToSession);
  const confirmAdvancedBuild = useAssetStore((s) => s.confirmAdvancedBuild);
  const cancelAdvancedBuild  = useAssetStore((s) => s.cancelAdvancedBuild);
  const fetchNearbyShopItems = useAssetStore((s) => s.fetchNearbyShopItems);
  const activeSession    = useAssetStore((s) => s.activeSession);
  const nearbyShopItems  = useAssetStore((s) => s.nearbyShopItems);
  const isLoadingNearby  = useAssetStore((s) => s.isLoadingNearby);

  const player         = usePlayerStore((s) => s.player);
  const updateCash     = usePlayerStore((s) => s.updateCash);
  const updateStats    = usePlayerStore((s) => s.updateStats);
  const incrementScore = usePlayerStore((s) => s.incrementScore);
  const useSubsidy     = usePlayerStore((s) => s.useSubsidy);

  const currentNeighborhood  = useNeighborhoodStore((s) => s.currentNeighborhood);
  const approvedCustomTypes  = useNeighborhoodStore((s) => s.approvedCustomTypes);
  const { style: btnStyle, pop } = useScalePop();
  const { track } = useActivityTracker();
  const ruleMeters = proximityResult?.ruleDistanceMeters ?? 10;

  // Derived cost values for selected type
  const config = selectedType ? (BUILDING_CONFIG[selectedType.type] ?? null) : null;
  const category = selectedType ? (INSTITUTION_CATEGORY[selectedType.type] ?? null) : null;
  const licenseFee = category ? LICENSE_FEE[category as keyof typeof LICENSE_FEE] : 0;
  const fastCost = config ? config.cost + licenseFee : 0;
  const advancedEstCost = config ? Math.round(config.cost * BUILD_MODE_ADVANCED_COST_RATIO) : 0;

  // Fetch nearby shops when entering gather step
  useEffect(() => {
    if (step === 'gather' && coordinate) {
      fetchNearbyShopItems(coordinate.latitude, coordinate.longitude);
    }
  }, [step, coordinate, fetchNearbyShopItems]);

  const handleSelectType = useCallback((b: BuildingDef) => {
    setSelectedType(b);
    setSelectedMode(null);
    GameAudio.playTap();
    setStep('mode');
  }, []);

  const handleSelectCustom = useCallback((c: CustomBuildingType) => {
    setSelectedType({ type: c.code, emoji: c.emoji || '🏰', label: c.nameFa, category: 'commercial' });
    setSelectedMode(null);
    GameAudio.playTap();
    setStep('mode');
  }, []);

  const handleConfirmMode = useCallback(async () => {
    if (!selectedMode) return;
    if (selectedMode === 'fast') {
      await handleFastBuild();
    } else {
      await handleStartAdvanced();
    }
  }, [selectedMode, selectedType, coordinate, player]);

  const handleFastBuild = async () => {
    if (!selectedType || !coordinate || !player || !config) return;
    if (proximityResult && !proximityResult.isValid) {
      GameAudio.playError();
      Alert.alert('عدم امکان احداث ملک', proximityResult.message || `فاصله کمتر از ${ruleMeters} متر از معابر مجاز نیست.`);
      return;
    }
    if (player.cash < fastCost) { GameAudio.playError(); return; }
    pop(); setBuilding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const tileId = tileIdFromCoordinate(coordinate);
      const asset = await buildAssetFast({ userId: session.user.id, type: selectedType.type, latitude: coordinate.latitude, longitude: coordinate.longitude, tileId });
      if (!asset) throw new Error('Build failed');
      updateCash(-fastCost);
      updateStats({ power: (player.power ?? 0) + config.power });
      incrementScore(config.power * 10);
      track('build_complete');
      await GameAudio.playBuild();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setSelectedType(null); setStep('type'); onClose(); }, 2000);
    } catch (err) {
      console.warn('[BuildModal] fast build error:', err);
      GameAudio.playError();
    } finally { setBuilding(false); }
  };

  const handleStartAdvanced = async () => {
    if (!selectedType || !coordinate || !player) return;
    if (proximityResult && !proximityResult.isValid) {
      GameAudio.playError();
      Alert.alert('عدم امکان احداث ملک', proximityResult.message || `فاصله کمتر از ${ruleMeters} متر از معابر مجاز نیست.`);
      return;
    }
    setBuilding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const tileId = tileIdFromCoordinate(coordinate);
      const sessionId = await startAdvancedBuild({ userId: session.user.id, type: selectedType.type, latitude: coordinate.latitude, longitude: coordinate.longitude, tileId });
      if (!sessionId) throw new Error('Could not start session');
      GameAudio.playTap();
      setStep('gather');
    } catch (err) {
      console.warn('[BuildModal] start advanced error:', err);
      GameAudio.playError();
    } finally { setBuilding(false); }
  };

  const handleConfirmAdvanced = async () => {
    if (!activeSession || !config || !player) return;
    setBuilding(true);
    try {
      const asset = await confirmAdvancedBuild();
      if (!asset) throw new Error('Confirm failed');
      const powerBonus = Math.round(config.power * activeSession.effectivePowerRatio);
      updateCash(-(activeSession.totalCashCost + licenseFee));
      if (activeSession.totalQuotaUsed > 0) useSubsidy(activeSession.totalQuotaUsed);
      updateStats({ power: (player.power ?? 0) + powerBonus });
      incrementScore(powerBonus * 10);
      track('build_complete');
      await GameAudio.playBuild();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setSelectedType(null); setStep('type'); onClose(); }, 2000);
    } catch (err) {
      console.warn('[BuildModal] confirm advanced error:', err);
      GameAudio.playError();
    } finally { setBuilding(false); }
  };

  const handleCancelAdvanced = useCallback(async () => {
    await cancelAdvancedBuild();
    setStep('mode');
  }, [cancelAdvancedBuild]);

  const handleClose = useCallback(() => {
    if (step === 'gather') cancelAdvancedBuild();
    setSelectedType(null);
    setSelectedMode(null);
    setStep('type');
    setSuccess(false);
    onClose();
  }, [onClose, step, cancelAdvancedBuild]);

  if (!coordinate) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

          <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
            <LinearGradient colors={['#0D1533', '#080C1A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <View style={styles.handle} />

            {success ? (
              <View style={styles.successBox}>
                <Text variant="display" color="brand">🎉</Text>
                <Text variant="heading" weight="bold" color="primary">ساخت موفق!</Text>
                <Text variant="body" color="secondary">
                  {selectedType?.label ?? 'سازه'} با موفقیت در نقشه ساخته شد
                </Text>
              </View>
            ) : step === 'gather' && activeSession ? (
              <AdvancedBuildMaterialsSheet
                buildingType={activeSession.buildingType}
                slots={activeSession.slots}
                nearbyShopItems={nearbyShopItems}
                isLoadingNearby={isLoadingNearby}
                onGather={addMaterialToSession}
                onConfirm={handleConfirmAdvanced}
                onCancel={handleCancelAdvanced}
                isConfirming={building}
                totalCashCost={activeSession.totalCashCost}
                totalQuotaUsed={activeSession.totalQuotaUsed}
                effectivePowerRatio={activeSession.effectivePowerRatio}
                allGathered={activeSession.allGathered}
              />
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text variant="heading" weight="bold" color="primary">
                      {step === 'type' ? '📍 انتخاب سازه' : `${selectedType?.emoji} ${selectedType?.label} — روش ساخت`}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {currentNeighborhood ? `محله ${currentNeighborhood.nameFa} | ` : ''}
                      {coordinate.latitude.toFixed(4)}°, {coordinate.longitude.toFixed(4)}°
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {step !== 'type' && (
                      <TouchableOpacity onPress={() => setStep('type')} style={styles.backBtn}>
                        <Text variant="caption" color="secondary">‹ بازگشت</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.cashBadge}>
                      <Text variant="body" weight="semibold" color="inverse">💰 {(player?.cash ?? 0).toLocaleString('fa-IR')}</Text>
                    </View>
                  </View>
                </View>

                {/* Step 1 — Type Selection */}
                {step === 'type' && (
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
                    {CATEGORIES.map((cat) => {
                      const catBuildings = BUILDING_CATALOG.filter((b) => b.category === cat);
                      return (
                        <View key={cat}>
                          <View style={styles.catHeader}>
                            <Text variant="caption" weight="bold" style={styles.catLabel}>{CATEGORY_LABELS[cat]}</Text>
                          </View>
                          <View style={styles.buildingGrid}>
                            {catBuildings.map((b) => {
                              const cfg = BUILDING_CONFIG[b.type];
                              const affordable = (player?.cash ?? 0) >= (cfg?.cost ?? 0);
                              return (
                                <TouchableOpacity
                                  key={b.type}
                                  style={[styles.buildingCard, !affordable && styles.buildingCardDisabled]}
                                  onPress={() => affordable && handleSelectType(b)}
                                  activeOpacity={affordable ? 0.8 : 1}
                                >
                                  <Text variant="display" color="brand">{b.emoji}</Text>
                                  <Text variant="caption" weight="bold" color={affordable ? 'primary' : 'muted'}>{b.label}</Text>
                                  <Text variant="caption" color={affordable ? 'secondary' : 'muted'}>💰 {(cfg?.cost ?? 0).toLocaleString('fa-IR')}</Text>
                                  <Text variant="caption" color="secondary">⚡ +{cfg?.power ?? 0}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}

                    {approvedCustomTypes.length > 0 && (
                      <View>
                        <View style={styles.catHeader}>
                          <Text variant="caption" weight="bold" style={styles.catLabel}>اختصاصی محله</Text>
                        </View>
                        <View style={styles.buildingGrid}>
                          {approvedCustomTypes.map((c) => {
                            const affordable = (player?.cash ?? 0) >= c.baseCost;
                            return (
                              <TouchableOpacity
                                key={c.id}
                                style={[styles.buildingCard, styles.customCard, !affordable && styles.buildingCardDisabled]}
                                onPress={() => affordable && handleSelectCustom(c)}
                                activeOpacity={affordable ? 0.8 : 1}
                              >
                                <Text variant="display" color="brand">{c.emoji || '🏛️'}</Text>
                                <Text variant="caption" weight="bold" color={affordable ? 'primary' : 'muted'}>{c.nameFa}</Text>
                                <Text variant="caption" color={affordable ? 'secondary' : 'muted'}>💰 {c.baseCost.toLocaleString('fa-IR')}</Text>
                                <Text variant="caption" color="secondary">⚡ +{c.powerBonus}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <TouchableOpacity style={styles.proposeBanner} onPress={() => { GameAudio.playTap(); setShowProposeModal(true); }} activeOpacity={0.8}>
                      <LinearGradient colors={['rgba(108,99,255,0.25)', 'rgba(139,92,246,0.15)']} style={styles.proposeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text variant="display" color="brand">💡</Text>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold" color="primary">پیشنهاد نوع سازه جدید</Text>
                          <Text variant="caption" color="secondary">طرح سازه دلخواه خود را ثبت کنید</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A78BFA" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                )}

                {/* Step 2 — Mode Selection */}
                {step === 'mode' && selectedType && (
                  <View style={styles.modeContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
                      <BuildModeCard
                        mode="fast"
                        selected={selectedMode === 'fast'}
                        fastCost={fastCost}
                        advancedEstCost={advancedEstCost}
                        licenseFee={licenseFee}
                        subsidyQuotaRemaining={player?.subsidyQuota ?? 5000}
                        onPress={() => { setSelectedMode('fast'); GameAudio.playTap(); }}
                      />
                      <BuildModeCard
                        mode="advanced"
                        selected={selectedMode === 'advanced'}
                        fastCost={fastCost}
                        advancedEstCost={advancedEstCost}
                        licenseFee={licenseFee}
                        subsidyQuotaRemaining={player?.subsidyQuota ?? 5000}
                        onPress={() => { setSelectedMode('advanced'); GameAudio.playTap(); }}
                      />
                    </ScrollView>

                    <Animated.View style={[btnStyle, { paddingHorizontal: 16 }]}>
                      <TouchableOpacity
                        style={[styles.buildBtn, (!selectedMode || building) && styles.buildBtnDisabled]}
                        onPress={handleConfirmMode}
                        disabled={!selectedMode || building}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={selectedMode ? ['#6C63FF', '#A78BFA'] : ['#374151', '#1F2937']}
                          style={styles.buildBtnGradient}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                          {building ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text weight="semibold" color="inverse">
                              {selectedMode === 'fast' ? '⚡ احداث سریع' : selectedMode === 'advanced' ? '🔨 شروع تهیه مصالح' : 'روش ساخت را انتخاب کنید'}
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

      <ProposeBuildingModal visible={showProposeModal} onClose={() => setShowProposeModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: SCREEN_H * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  cashBadge: { backgroundColor: 'rgba(255,211,0,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,211,0,0.3)' },
  verifiedBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, borderWidth: 1, borderColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2 },
  verifiedBadgeText: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  scrollArea: { maxHeight: SCREEN_H * 0.6 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12 },
  catHeader: { paddingVertical: 6, marginTop: 4 },
  catLabel: { color: '#94A3B8', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  buildingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', marginBottom: 12 },
  buildingCard: { width: '30%', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, alignItems: 'center', gap: 2 },
  customCard: { borderColor: 'rgba(139,92,246,0.35)', backgroundColor: 'rgba(139,92,246,0.08)' },
  buildingCardSelected: { borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.2)' },
  buildingCardDisabled: { opacity: 0.35 },
  proposeBanner: { marginTop: 6, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(108,99,255,0.35)' },
  proposeGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  modeContainer: { flex: 1, gap: 12, paddingTop: 4, paddingBottom: 8 },
  buildBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  buildBtnDisabled: { opacity: 0.5 },
  buildBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  successBox: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
});

