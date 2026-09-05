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
import { formatCoordinate } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
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

  if (!coordinate) return null;

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
            <View style={styles.iconCircle}>
              <Text variant="heading">📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading" weight="bold" color="primary">
                انتخاب عملیات موقعیت
              </Text>
              <Text variant="caption" color="secondary">
                {currentNeighborhood ? `محله ${currentNeighborhood.nameFa} (${currentNeighborhood.city}) • ` : ''}
                {formatCoordinate(coordinate, 4)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Choice Cards */}
          <View style={styles.actionsContainer}>
            {/* Choice 1: ساختن ملک */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                GameAudio.playTap();
                onSelectBuild();
              }}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['rgba(108, 99, 255, 0.22)', 'rgba(139, 92, 246, 0.08)']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(108,99,255,0.25)', borderColor: '#6C63FF' }]}>
                  <Text style={styles.cardEmoji}>🏗️</Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text variant="title" weight="bold" color="primary">
                      ۱. ساختن ملک
                    </Text>
                    <View style={styles.badgeRule}>
                      <Text style={styles.badgeRuleText}>حریم ۵ متر</Text>
                    </View>
                  </View>
                  <Text variant="caption" color="secondary" style={styles.cardDesc}>
                    بزرگنمایی حداکثری نقشه روی زمین و استعلام خودکار حریم ۵ متری از خیابان‌ها جهت احداث
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#A78BFA" />
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
                <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245,158,11,0.25)', borderColor: '#F59E0B' }]}>
                  <Text style={styles.cardEmoji}>📊</Text>
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text variant="title" weight="bold" color="primary">
                      ۲. ارزیابی محله
                    </Text>
                    <View style={[styles.badgeRule, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#F59E0B' }]}>
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
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.35)',
    overflow: 'hidden',
    paddingBottom: 28,
    maxHeight: SCREEN_H * 0.6,
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
