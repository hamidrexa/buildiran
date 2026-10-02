/**
 * BuildIran — Build Modal «ساخت و ساز» (v2 «Gentleman Neon», dual theme)
 * 3-step flow inside a Sheet: 1) select building type → 2) choose build mode → 3a) fast confirm / 3b) gather materials
 * Design: blueprint grid of IconPlate cards, brass selection (brandSoft tint), tabular fa-IR numerals.
 * Build confirmations stay brass (normal actions — neon is for live signals only). No emoji in UI chrome.
 */

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Sheet } from '@/components/ui/Sheet';
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
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import type { CustomBuildingType, LatLng, InstitutionCategory } from '@/types/game.types';
import { tileIdFromCoordinate, type StreetProximityResult } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ProposeBuildingModal } from './ProposeBuildingModal';
import { BuildModeCard } from './BuildModeCard';
import { AdvancedBuildMaterialsSheet } from './AdvancedBuildMaterialsSheet';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Press-spring touchable (§4 — every touchable springs) ───────────────────

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TouchableScale: React.FC<
  React.ComponentProps<typeof TouchableOpacity>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchable
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

type IconName = keyof typeof Ionicons.glyphMap;
type IconTone = 'brass' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta' | 'neutral' | 'inverse';

/** DESIGN.md §4 — building type → Ionicon + tone (no emoji in UI chrome) */
const BUILDING_VISUALS: Record<string, { icon: IconName; tone: IconTone }> = {
  // Residential — steel
  house: { icon: 'home', tone: 'steel' },
  villa: { icon: 'home-outline', tone: 'steel' },
  tower: { icon: 'business', tone: 'steel' },
  main_house: { icon: 'home', tone: 'steel' },
  resident_house: { icon: 'home-outline', tone: 'steel' },
  // Commercial — brass
  shop: { icon: 'storefront', tone: 'brass' },
  market: { icon: 'storefront', tone: 'brass' },
  cafe: { icon: 'cafe', tone: 'brass' },
  gym: { icon: 'barbell', tone: 'brass' },
  restaurant: { icon: 'restaurant', tone: 'brass' },
  mall: { icon: 'cart', tone: 'brass' },
  exchange: { icon: 'swap-horizontal', tone: 'brass' },
  office: { icon: 'briefcase', tone: 'brass' },
  warehouse: { icon: 'archive', tone: 'brass' },
  // Industrial — ember
  farm: { icon: 'nutrition', tone: 'ember' },
  factory: { icon: 'construct', tone: 'ember' },
  // Civic / public — jade
  hospital: { icon: 'medkit', tone: 'jade' },
  park: { icon: 'leaf', tone: 'jade' },
  university: { icon: 'school', tone: 'jade' },
  bank: { icon: 'cash', tone: 'jade' },
  // Military — crimson
  barracks: { icon: 'shield', tone: 'crimson' },
};

const CATEGORY_TONES: Record<InstitutionCategory, IconTone> = {
  residential: 'steel',
  commercial: 'brass',
  industrial: 'ember',
  public: 'jade',
};

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

const getBuildingVisual = (type: string, category: InstitutionCategory) =>
  BUILDING_VISUALS[type] ?? { icon: 'business' as IconName, tone: CATEGORY_TONES[category] ?? 'steel' };

// ─── Building catalog organized by institution category ──────────────────────

interface BuildingDef {
  type: string;
  icon: IconName;
  tone: IconTone;
  label: string;
  category: InstitutionCategory;
}

const BUILDING_CATALOG: BuildingDef[] = [
  // Residential
  { type: 'house',      icon: 'home',             tone: 'steel',  label: 'خانه',       category: 'residential' },
  { type: 'villa',      icon: 'home-outline',     tone: 'steel',  label: 'ویلا',        category: 'residential' },
  { type: 'tower',      icon: 'business',         tone: 'steel',  label: 'برج',         category: 'residential' },
  // Commercial
  { type: 'shop',       icon: 'storefront',       tone: 'brass',  label: 'مغازه',       category: 'commercial' },
  { type: 'cafe',       icon: 'cafe',             tone: 'brass',  label: 'کافه',        category: 'commercial' },
  { type: 'gym',        icon: 'barbell',          tone: 'brass',  label: 'باشگاه',      category: 'commercial' },
  { type: 'restaurant', icon: 'restaurant',       tone: 'brass',  label: 'رستوران',     category: 'commercial' },
  { type: 'mall',       icon: 'cart',             tone: 'brass',  label: 'مرکز خرید',   category: 'commercial' },
  { type: 'exchange',   icon: 'swap-horizontal',  tone: 'brass',  label: 'صرافی',       category: 'commercial' },
  { type: 'warehouse',  icon: 'archive',          tone: 'brass',  label: 'انبار',        category: 'commercial' },
  // Industrial
  { type: 'farm',       icon: 'nutrition',        tone: 'ember',  label: 'مزرعه',       category: 'industrial' },
  { type: 'factory',    icon: 'construct',        tone: 'ember',  label: 'کارخانه',     category: 'industrial' },
  // Public
  { type: 'hospital',   icon: 'medkit',           tone: 'jade',   label: 'بیمارستان',   category: 'public' },
  { type: 'park',       icon: 'leaf',             tone: 'jade',   label: 'پارک',         category: 'public' },
  { type: 'university', icon: 'school',           tone: 'jade',   label: 'دانشگاه',     category: 'public' },
  { type: 'bank',       icon: 'cash',             tone: 'jade',   label: 'بانک',        category: 'public' },
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
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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
  const { pop } = useScalePop();
  const { track } = useActivityTracker();
  const ruleMeters = proximityResult?.ruleDistanceMeters ?? 10;

  // Derived cost values for selected type
  const config = selectedType ? (BUILDING_CONFIG[selectedType.type] ?? null) : null;
  const category = selectedType ? (INSTITUTION_CATEGORY[selectedType.type] ?? null) : null;
  const licenseFee = category ? LICENSE_FEE[category as keyof typeof LICENSE_FEE] : 0;
  const baseCost = config ? config.cost : 0;
  const neighborhoodCostMultiplier = currentNeighborhood ? (useNeighborhoodStore.getState().getNeighborhoodCostMultiplier(currentNeighborhood.id)) : 1.0;
  const careerCostMultiplier = player?.careerPath === 'real_estate' ? 0.9 : 1.0;
  const totalCostMultiplier = neighborhoodCostMultiplier * careerCostMultiplier;

  const fastCost = Math.round(baseCost * totalCostMultiplier) + Math.round(licenseFee * neighborhoodCostMultiplier);
  const advancedEstCost = Math.round(baseCost * totalCostMultiplier * BUILD_MODE_ADVANCED_COST_RATIO);

  // Fetch nearby shops when entering gather step
  useEffect(() => {
    if (step === 'gather' && coordinate) {
      fetchNearbyShopItems(coordinate.latitude, coordinate.longitude);
    }
  }, [step, coordinate, fetchNearbyShopItems]);

  // Selection (step 1): pick a card, then confirm via the brass footer button
  const handleTapBuilding = useCallback((b: BuildingDef) => {
    setSelectedType(b);
    setSelectedMode(null);
    GameAudio.playTap();
  }, []);

  const handleTapCustom = useCallback((c: CustomBuildingType) => {
    setSelectedType({ type: c.code, icon: 'business', tone: 'brass', label: c.nameFa, category: 'commercial' });
    setSelectedMode(null);
    GameAudio.playTap();
  }, []);

  const handleConfirmType = useCallback(() => {
    if (!selectedType) return;
    setStep('mode');
  }, [selectedType]);

  const handleBackToType = useCallback(() => {
    setStep('type');
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

  const subtitle = `${currentNeighborhood ? `محله ${currentNeighborhood.nameFa} · ` : ''}${coordinate.latitude.toFixed(4)}°, ${coordinate.longitude.toFixed(4)}°`;

  const balanceChip = (
    <Chip icon="cash" tone="brass" label="موجودی" value={player?.cash ?? 0} />
  );

  const renderBuildingCard = (b: BuildingDef, custom?: boolean, keyId?: string) => {
    const cfg = BUILDING_CONFIG[b.type];
    const affordable = (player?.cash ?? 0) >= (cfg?.cost ?? 0);
    const isSelected = selectedType?.type === b.type;
    return (
      <TouchableScale
        key={keyId ?? b.type}
        style={[
          styles.buildingCard,
          custom && styles.customCard,
          isSelected && styles.buildingCardSelected,
          !affordable && styles.buildingCardDisabled,
        ]}
        onPress={() => affordable && handleTapBuilding(b)}
        activeOpacity={affordable ? 0.8 : 1}
        accessibilityRole="button"
        accessibilityLabel={b.label}
        accessibilityState={{ selected: isSelected, disabled: !affordable }}
      >
        {isSelected && (
          <LinearGradient
            colors={c.gradient.brandSoft}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <IconPlate name={b.icon} tone={b.tone} size="md" />
        <Text variant="caption" weight="semibold" color={affordable ? 'primary' : 'muted'} numberOfLines={1}>
          {b.label}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="cash" size={11} color={affordable ? c.brass[400] : c.text.muted} />
          <Text variant="label" color={affordable ? 'secondary' : 'muted'} style={tabular}>
            {(cfg?.cost ?? 0).toLocaleString('fa-IR')}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="flash" size={11} color={c.terracotta} />
          <Text variant="label" color="secondary" style={tabular}>
            +{(cfg?.power ?? 0).toLocaleString('fa-IR')}
          </Text>
        </View>
      </TouchableScale>
    );
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={handleClose}
        title="ساخت و ساز"
        subtitle={subtitle}
        maxHeight={0.88}
        footer={
          success || (step === 'gather' && activeSession) ? undefined : (
            <View style={styles.footerRow}>
              {balanceChip}
              {step === 'type' ? (
                <Button
                  label="ساخت"
                  onPress={handleConfirmType}
                  disabled={!selectedType}
                  style={styles.footerBtn}
                />
              ) : (
                <Button
                  label={
                    selectedMode === 'fast'
                      ? 'احداث سریع'
                      : selectedMode === 'advanced'
                        ? 'شروع تهیه مصالح'
                        : 'روش ساخت را انتخاب کنید'
                  }
                  onPress={handleConfirmMode}
                  disabled={!selectedMode || building}
                  loading={building}
                  style={styles.footerBtn}
                />
              )}
            </View>
          )
        }
      >
        {success ? (
          <View style={styles.successBox}>
            <IconPlate name="checkmark-circle" tone="jade" size="lg" bordered={false} />
            <Text variant="heading" weight="bold" color="primary">ساخت موفق!</Text>
            <Text variant="body" color="secondary" center>
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
            {/* Step 1 — Type Selection */}
            {step === 'type' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
              >
                {CATEGORIES.map((cat) => {
                  const catBuildings = BUILDING_CATALOG.filter((b) => b.category === cat);
                  return (
                    <View key={cat} style={styles.catSection}>
                      <SectionTitle title={CATEGORY_LABELS[cat]} />
                      <View style={styles.buildingGrid}>
                        {catBuildings.map((b) => renderBuildingCard(b))}
                      </View>
                    </View>
                  );
                })}

                {approvedCustomTypes.length > 0 && (
                  <View style={styles.catSection}>
                    <SectionTitle title="اختصاصی محله" />
                    <View style={styles.buildingGrid}>
                      {approvedCustomTypes.map((c) =>
                        renderBuildingCard(
                          { type: c.code, icon: 'business', tone: 'brass', label: c.nameFa, category: 'commercial' },
                          true,
                          c.id,
                        ),
                      )}
                    </View>
                  </View>
                )}

                <TouchableScale
                  style={styles.proposeBanner}
                  onPress={() => { GameAudio.playTap(); setShowProposeModal(true); }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="پیشنهاد نوع سازه جدید"
                >
                  <IconPlate name="bulb" tone="brass" size="sm" />
                  <View style={styles.proposeTexts}>
                    <Text variant="body" weight="semibold" color="primary">پیشنهاد نوع سازه جدید</Text>
                    <Text variant="caption" color="secondary">طرح سازه دلخواه خود را ثبت کنید</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={c.text.secondary} />
                </TouchableScale>
              </ScrollView>
            )}

            {/* Step 2 — Mode Selection */}
            {step === 'mode' && selectedType && (
              <View style={styles.modeContainer}>
                <TouchableScale
                  style={styles.backBtn}
                  onPress={handleBackToType}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="بازگشت"
                >
                  <Ionicons name="chevron-back" size={14} color={c.text.secondary} />
                  <Text variant="caption" color="secondary">بازگشت به انتخاب سازه</Text>
                </TouchableScale>

                <SectionTitle
                  kicker="روش ساخت"
                  title={selectedType.label}
                  trailing={
                    <IconPlate name={selectedType.icon} tone={selectedType.tone} size="xs" bordered={false} />
                  }
                />

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
              </View>
            )}
          </>
        )}
      </Sheet>

      <ProposeBuildingModal visible={showProposeModal} onClose={() => setShowProposeModal(false)} />
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    footerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    footerBtn: {
      minWidth: 148,
      minHeight: 44,
    },
    scrollArea: { maxHeight: SCREEN_H * 0.56 },
    scrollContent: { paddingBottom: Spacing.sm },
    catSection: { marginBottom: Spacing.lg, gap: Spacing.sm + 2 },
    buildingGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: Spacing.sm,
    },
    buildingCard: {
      width: '48.5%',
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.ink[700],
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: Spacing.xs,
      overflow: 'hidden',
    },
    customCard: {
      borderColor: c.border.brand,
      backgroundColor: c.ink[600],
    },
    buildingCardSelected: {
      borderColor: c.brass[400],
    },
    buildingCardDisabled: { opacity: 0.35 },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    proposeBanner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.default,
      backgroundColor: c.ink[700],
      padding: Spacing.md,
      minHeight: 56,
    },
    proposeTexts: {
      flex: 1,
      gap: 1,
    },
    modeContainer: {
      gap: Spacing.md,
      paddingBottom: Spacing.xs,
    },
    backBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: Spacing.xs,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.sm,
      paddingHorizontal: Spacing.md,
      minHeight: 44,
    },
    successBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
      gap: Spacing.md,
    },
  });
