/**
 * BuildIran — Neighborhood Evaluation Modal (ارزیابی محله)
 * Detailed district assessment when player taps «ارزیابی محله».
 * Analyzes location metrics, land value, development index, and editor governance.
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { useAssetStore } from '@/store/useAssetStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { LatLng, Neighborhood } from '@/types/game.types';
import { haversineDistance } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { height: SCREEN_H } = Dimensions.get('window');

interface NeighborhoodEvaluationModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  onProceedToBuild: () => void;
  onOpenEditorPanel?: () => void;
  onClose: () => void;
}

export const NeighborhoodEvaluationModal: React.FC<NeighborhoodEvaluationModalProps> = ({
  visible,
  coordinate,
  onProceedToBuild,
  onOpenEditorPanel,
  onClose,
}) => {
  const player = usePlayerStore((s) => s.player);
  const neighborhoods = useNeighborhoodStore((s) => s.neighborhoods);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const approvedCustomTypes = useNeighborhoodStore((s) => s.approvedCustomTypes);
  const assetsMap = useAssetStore((s) => s.assets);

  // Find nearest neighborhood if current one is distant
  const activeNeighborhood: Neighborhood | null = useMemo(() => {
    if (!coordinate) return currentNeighborhood;
    if (neighborhoods.length === 0) return currentNeighborhood;

    let closest = neighborhoods[0];
    let minDist = Infinity;
    for (const n of neighborhoods) {
      const dist = haversineDistance(coordinate, {
        latitude: n.centerLat,
        longitude: n.centerLng,
      });
      if (dist < minDist) {
        minDist = dist;
        closest = n;
      }
    }
    return closest;
  }, [coordinate, neighborhoods, currentNeighborhood]);

  const distanceKm = useMemo(() => {
    if (!coordinate || !activeNeighborhood) return 0;
    const d = haversineDistance(coordinate, {
      latitude: activeNeighborhood.centerLat,
      longitude: activeNeighborhood.centerLng,
    });
    return Math.round(d * 10) / 10;
  }, [coordinate, activeNeighborhood]);

  // Compute building density in this neighborhood
  const districtBuildingsCount = useMemo(() => {
    if (!activeNeighborhood) return 0;
    const list = Object.values(assetsMap);
    return list.filter((a) => {
      const d = haversineDistance(
        { latitude: a.latitude, longitude: a.longitude },
        { latitude: activeNeighborhood.centerLat, longitude: activeNeighborhood.centerLng }
      );
      return d <= (activeNeighborhood.radiusKm || 5);
    }).length;
  }, [assetsMap, activeNeighborhood]);

  if (!coordinate || !activeNeighborhood) return null;

  const isEditor = player ? player.power >= activeNeighborhood.minEditorPower : false;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <LinearGradient
            colors={['#0E172F', '#060B1A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 26 }}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text variant="heading" weight="bold" color="primary">
                  گزارش ارزیابی محله «{activeNeighborhood.nameFa}»
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                شهر {activeNeighborhood.city} • فاصله تا هسته مرکزی: {distanceKm.toLocaleString('fa-IR')} کیلومتر
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Description Banner */}
            {activeNeighborhood.descriptionFa && (
              <View style={styles.descBox}>
                <Text variant="body" color="primary" style={styles.descText}>
                  {activeNeighborhood.descriptionFa}
                </Text>
              </View>
            )}

            {/* 4-Metric Grid */}
            <Text variant="title" weight="semibold" color="primary" style={styles.sectionTitle}>
              شاخص‌های توسعه و پتانسیل سرمایه‌گذاری:
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>📈</Text>
                <Text variant="caption" color="secondary">شاخص رونق اقتصادی</Text>
                <Text variant="heading" weight="bold" color="primary">۸۶ / ۱۰۰</Text>
                <Text variant="caption" style={{ color: '#34D399' }}>رشد پرشتاب</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🛡️</Text>
                <Text variant="caption" color="secondary">امنیت سرمایه‌گذاری</Text>
                <Text variant="heading" weight="bold" color="primary">۹۲٪</Text>
                <Text variant="caption" style={{ color: '#60A5FA' }}>قلمرو باثبات</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🏢</Text>
                <Text variant="caption" color="secondary">تراکم سازه‌ها</Text>
                <Text variant="heading" weight="bold" color="primary">
                  {districtBuildingsCount.toLocaleString('fa-IR')} سازه
                </Text>
                <Text variant="caption" color="muted">احداث‌شده توسط بازیکنان</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🏛️</Text>
                <Text variant="caption" color="secondary">پاداش قدرت حاکمیتی</Text>
                <Text variant="heading" weight="bold" color="primary">
                  +{activeNeighborhood.minEditorPower}
                </Text>
                <Text variant="caption" style={{ color: '#F59E0B' }}>حداقل قدرت ویرایشگر</Text>
              </View>
            </View>

            {/* Governance / Editor Status */}
            <View style={styles.editorBox}>
              <View style={styles.editorHeaderRow}>
                <Text style={{ fontSize: 22 }}>🎖️</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="bold" color="primary">
                    وضعیت ویرایشگری و نظارت محله
                  </Text>
                  <Text variant="caption" color="secondary">
                    {isEditor
                      ? 'شما به عنوان ویرایشگر واجد شرایط این محله دارای حق رأی هستید.'
                      : `نیاز به حداقل ${activeNeighborhood.minEditorPower} امتیاز قدرت نفوذ (قدرت فعلی شما: ${player?.power ?? 0})`}
                  </Text>
                </View>
                {isEditor && onOpenEditorPanel && (
                  <TouchableOpacity
                    style={styles.editorActionBtn}
                    onPress={() => {
                      onClose();
                      onOpenEditorPanel();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text variant="caption" weight="bold" color="inverse">پنل بازبینی</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Neighborhood Custom Approved Buildings */}
            {approvedCustomTypes.length > 0 && (
              <View style={styles.customSection}>
                <Text variant="title" weight="semibold" color="primary" style={styles.sectionTitle}>
                  سازه‌های اختصاصی تأییدشده در این منطقه:
                </Text>
                <View style={styles.customBadgesRow}>
                  {approvedCustomTypes.map((c) => (
                    <View key={c.id} style={styles.customBadge}>
                      <Text style={{ fontSize: 16 }}>{c.emoji || '🏛️'}</Text>
                      <Text variant="caption" weight="bold" color="primary">{c.nameFa}</Text>
                      <Text variant="caption" style={{ color: '#FFD700' }}>💰 {c.baseCost.toLocaleString('fa-IR')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.buildBtn}
              onPress={() => {
                GameAudio.playTap();
                onProceedToBuild();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6']}
                style={styles.buildBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text variant="body" weight="bold" color="inverse">
                  🏗️ احداث ملک در این موقعیت (بررسی حریم ۵ متری)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    overflow: 'hidden',
    paddingBottom: 20,
    maxHeight: SCREEN_H * 0.82,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  descBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  descText: {
    lineHeight: 22,
    fontSize: 12,
  },
  sectionTitle: {
    marginBottom: 4,
    marginTop: 2,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
    alignItems: 'flex-start',
  },
  metricEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  editorBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  editorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editorActionBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  customSection: {
    gap: 8,
  },
  customBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.25)',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  buildBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buildBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
