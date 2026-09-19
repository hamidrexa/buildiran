/**
 * BuildIran — MissionsPanel
 * Full-screen bottom sheet or modal for viewing and claiming missions.
 * Tabs: Daily, Weekly, Achievements, Story, Events, Location.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Colors, Radii, Spacing } from '@/theme';
import { useMissionStore } from '@/store/useMissionStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { MissionCategory } from '@/types/missions.types';
import fa from '@/i18n/fa';
import { MissionCard } from './MissionCard';
import { GameAudio } from '@/lib/audio';

const { height: SCREEN_H } = Dimensions.get('window');

interface MissionsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const TABS: { key: MissionCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'daily', icon: 'today' },
  { key: 'weekly', icon: 'calendar' },
  { key: 'story', icon: 'book' },
  { key: 'achievement', icon: 'trophy' },
  { key: 'event', icon: 'star' },
  { key: 'location', icon: 'map' },
];

export function MissionsPanel({ visible, onClose }: MissionsPanelProps) {
  const player = usePlayerStore((s) => s.player);
  const { slots, isLoading, refresh, claimReward } = useMissionStore();
  const [activeTab, setActiveTab] = useState<MissionCategory>('daily');
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Filter and sort slots for current tab
  const tabSlots = useMemo(() => {
    const arr = Object.values(slots).filter(
      (s) => s.definition?.category === activeTab
    );

    // Sort: claimable first, then active, then locked, then claimed, then expired
    const statusWeight: Record<string, number> = {
      completed: 1,
      active: 2,
      locked: 3,
      claimed: 4,
      expired: 5,
    };

    arr.sort((a, b) => {
      const wA = statusWeight[a.status] ?? 99;
      const wB = statusWeight[b.status] ?? 99;
      if (wA !== wB) return wA - wB;
      // Secondary sort: sortOrder from definition
      const oA = a.definition?.sortOrder ?? 0;
      const oB = b.definition?.sortOrder ?? 0;
      return oA - oB;
    });

    return arr;
  }, [slots, activeTab]);

  const handleClaim = async (slotId: string) => {
    setClaimingIds((prev) => new Set(prev).add(slotId));
    await claimReward(slotId);
    setClaimingIds((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
  };

  const onRefresh = async () => {
    if (!player) return;
    setRefreshing(true);
    await refresh(player.id);
    setRefreshing(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        
        <Animated.View entering={SlideInDown.springify()} style={styles.container}>
          <LinearGradient
            colors={[Colors.bg.tertiary, Colors.bg.secondary]}
            style={styles.gradientBg}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Text variant="title" weight="bold" color="primary">
                  {fa.missions.badge} {fa.missions.title}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  // Has un-claimed completed mission in this category?
                  const hasClaimable = Object.values(slots).some(
                    (s) => s.definition?.category === tab.key && s.status === 'completed'
                  );
                  
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => {
                        setActiveTab(tab.key);
                        GameAudio.playTap();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isActive ? tab.icon : (`${tab.icon}-outline` as any)}
                        size={18}
                        color={isActive ? Colors.brand.primary : Colors.text.secondary}
                      />
                      <Text
                        variant="body"
                        weight={isActive ? 'bold' : 'medium'}
                        color={isActive ? 'brand' : 'secondary'}
                      >
                        {(fa.missions.tabs as any)[tab.key]}
                      </Text>
                      {hasClaimable && <View style={styles.tabBadgeDot} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* List */}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.brand.primary}
                  colors={[Colors.brand.primary]}
                />
              }
            >
              {isLoading && !refreshing && tabSlots.length === 0 ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={Colors.brand.primary} />
                  <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
                    {fa.missions.loading}
                  </Text>
                </View>
              ) : tabSlots.length === 0 ? (
                <View style={styles.centerBox}>
                  <Ionicons name="leaf-outline" size={48} color={Colors.text.muted} />
                  <Text variant="body" color="muted" style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                    {fa.missions.empty}
                  </Text>
                  {activeTab === 'daily' && (
                    <Text variant="caption" color="muted" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
                      {fa.missions.emptyDaily}
                    </Text>
                  )}
                  {activeTab === 'weekly' && (
                    <Text variant="caption" color="muted" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
                      {fa.missions.emptyWeekly}
                    </Text>
                  )}
                </View>
              ) : (
                tabSlots.map((slot, i) => (
                  <MissionCard
                    key={slot.id}
                    slot={slot}
                    index={i}
                    onClaim={handleClaim}
                    isClaiming={claimingIds.has(slot.id)}
                  />
                ))
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    height: SCREEN_H * 0.85,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    overflow: 'hidden',
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    flex: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radii.full,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(212,160,23,0.1)',
    borderColor: 'rgba(212,160,23,0.3)',
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.error,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
});
