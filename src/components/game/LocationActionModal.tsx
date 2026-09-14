/**
 * BuildIran — Location Action Modal
 * Triggered when a player taps any coordinate on the map.
 * Offers two primary actions:
 *   1. «ساختن ملک» (Build Property): Zooms to max level and displays 5m setback circle
 *   2. «ارزیابی محله» (Neighborhood Assessment): Inspects district metrics, governance, and development
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import type { LatLng } from '@/types/game.types';
import { findDistrictByCoordinate, formatCoordinate } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { height: SCREEN_H } = Dimensions.get('window');

interface LocationActionModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  onSelectBuild: () => void;
  onSelectEvaluate: () => void;
  onClose: () => void;
}

export const LocationActionModal: React.FC<LocationActionModalProps> = ({
  visible,
  coordinate,
  onSelectBuild,
  onSelectEvaluate,
  onClose,
}) => {
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const isDistrictLocked = useNeighborhoodStore((s) => s.isDistrictLocked);

  const detectedDistrict = useMemo(() => {
    if (!coordinate) return null;
    return findDistrictByCoordinate(coordinate);
  }, [coordinate]);

  const districtDisplayName = detectedDistrict?.name ?? currentNeighborhood?.nameFa ?? '';
  const areaDisplayName = detectedDistrict?.areaName ?? currentNeighborhood?.areaName ?? 'تهران';

  const isLocked = useMemo(() => {
    if (!districtDisplayName) return false;
    return isDistrictLocked(districtDisplayName, detectedDistrict?.areaNumber);
  }, [districtDisplayName, detectedDistrict, isDistrictLocked]);

  if (!coordinate) return null;

  const handleBuildPress = () => {
    if (isLocked) {
      GameAudio.playError();
      Alert.alert(
        'محله قفل است',
        `محله «${districtDisplayName}» در این مرحله جهت تمرکز و تعامل بازیکنان قفل است.\n\nفعالیت در این محله در فازهای بعدی بازی بازگشایی خواهد شد. برای ساخت‌وساز و سرمایه‌گذاری به محله‌های فعال مانند «میدان ولیعصر» مراجعه فرمایید.`,
        [{ text: 'متوجه شدم', style: 'default' }]
      );
      return;
    }
    GameAudio.playTap();
    onSelectBuild();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
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
            <View style={[styles.iconCircle, isLocked && styles.iconCircleLocked]}>
              <Text variant="heading">{isLocked ? '🔒' : '📍'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text variant="heading" weight="bold" color="primary">
                  {districtDisplayName ? `محله ${districtDisplayName}` : 'انتخاب عملیات موقعیت'}
                </Text>
                <View style={[styles.statusBadge, isLocked ? styles.badgeLocked : styles.badgeActive]}>
                  <Text style={[styles.statusBadgeText, isLocked ? styles.textLocked : styles.textActive]}>
                    {isLocked ? 'قفل‌شده' : 'فعال'}
                  </Text>
                </View>
              </View>
              <Text variant="caption" color="secondary">
                {areaDisplayName ? `${areaDisplayName} • ` : ''}
                {formatCoordinate(coordinate, 4)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Informative Locked Banner */}
          {isLocked && (
            <View style={styles.lockedBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
              <Text style={styles.lockedBannerText}>
                جهت تمرکز بازیکنان این محله قفل است. ساخت‌وساز غیرفعال است اما امکان ارزیابی شاخص‌ها وجود دارد.
              </Text>
            </View>
          )}

          {/* Choice Cards */}
          <View style={styles.actionsContainer}>
            {/* Choice 1: ساختن ملک */}
            <TouchableOpacity
              style={[styles.card, isLocked && styles.cardLocked]}
              onPress={handleBuildPress}
              activeOpacity={isLocked ? 0.7 : 0.82}
            >
              <LinearGradient
                colors={
                  isLocked
                    ? ['rgba(100, 116, 139, 0.16)', 'rgba(71, 85, 105, 0.08)']
                    : ['rgba(108, 99, 255, 0.22)', 'rgba(139, 92, 246, 0.08)']
                }
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.cardIconBox,
                    isLocked
                      ? { backgroundColor: 'rgba(100, 116, 139, 0.2)', borderColor: '#64748B' }
                      : { backgroundColor: 'rgba(108, 99, 255, 0.25)', borderColor: '#6C63FF' },
                  ]}
                >
                  <Text style={styles.cardEmoji}>{isLocked ? '🔒' : '🏗️'}</Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      variant="title"
                      weight="bold"
                      color={isLocked ? 'secondary' : 'primary'}
                    >
                      ۱. ساختن ملک
                    </Text>
                    <View style={isLocked ? styles.badgeLockedMini : styles.badgeRule}>
                      <Text style={isLocked ? styles.badgeLockedMiniText : styles.badgeRuleText}>
                        {isLocked ? 'غیرفعال در این فاز' : 'حریم ۵ متر'}
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" color="secondary" style={styles.cardDesc}>
                    {isLocked
                      ? 'امکان ساخت ملک تا زمان آزادسازی این منطقه در فازهای بعدی بازی غیرفعال است.'
                      : 'بزرگنمایی حداکثری نقشه روی زمین و استعلام خودکار حریم ۵ متری از خیابان‌ها جهت احداث'}
                  </Text>
                </View>
                <Ionicons
                  name={isLocked ? 'lock-closed' : 'chevron-forward'}
                  size={20}
                  color={isLocked ? '#64748B' : '#A78BFA'}
                />
              </LinearGradient>
            </TouchableOpacity>

            {/* Choice 2: ارزیابی محله */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                GameAudio.playTap();
                onSelectEvaluate();
              }}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.06)']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: '#F59E0B' }]}>
                  <Text style={styles.cardEmoji}>📊</Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text variant="title" weight="bold" color="primary">
                      ۲. ارزیابی محله
                    </Text>
                    <View style={[styles.badgeRule, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
                      <Text style={[styles.badgeRuleText, { color: '#FCD34D' }]}>تحلیل منطقه</Text>
                    </View>
                  </View>
                  <Text variant="caption" color="secondary" style={styles.cardDesc}>
                    مشاهده تراکم سازه‌ها، رونق اقتصادی، شاخص توسعه و وضعیت ویرایشگران محله
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#F59E0B" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Dismiss / Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text variant="body" color="muted">انصراف و بازگشت به نقشه</Text>
          </TouchableOpacity>
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
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.35)',
    overflow: 'hidden',
    paddingBottom: 28,
    maxHeight: SCREEN_H * 0.68,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  badgeLocked: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: '#64748B',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textActive: {
    color: '#60A5FA',
  },
  textLocked: {
    color: '#94A3B8',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  lockedBannerText: {
    flex: 1,
    color: '#FCD34D',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  iconCircleLocked: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardLocked: {
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTextContainer: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRule: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeRuleText: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeLockedMini: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLockedMiniText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  cardDesc: {
    lineHeight: 18,
    fontSize: 11,
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
