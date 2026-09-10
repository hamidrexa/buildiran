/**
 * BuildIran — Building Placement HUD (5-Meter Setback Verification Bar)
 * Displayed when user enters building placement mode at maximum map zoom.
 * Shows real-time street proximity status and validation feedback.
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import type { StreetProximityResult } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BuildingPlacementHUDProps {
  isChecking: boolean;
  proximityResult: StreetProximityResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
}

export const BuildingPlacementHUD: React.FC<BuildingPlacementHUDProps> = ({
  isChecking,
  proximityResult,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();

  const isValid = proximityResult?.isValid ?? false;
  const ruleMeters = proximityResult?.ruleDistanceMeters ?? 20;

  const statusColor = isChecking
    ? '#F59E0B'
    : isValid
      ? '#10B981'
      : '#EF4444';

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      style={[styles.container, { bottom: insets.bottom + 12 }]}
    >
      <LinearGradient
        colors={['rgba(13, 21, 51, 0.96)', 'rgba(8, 12, 26, 0.98)']}
        style={styles.inner}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Status Header Bar */}
        <View style={styles.header}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
            {isChecking ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Text style={{ fontSize: 18 }}>{isValid ? '✅' : '🚫'}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text variant="body" weight="bold" color="primary">
                {isChecking
                  ? 'در حال استعلام حریم معابر...'
                  : isValid
                    ? 'موقعیت زمین مجاز است'
                    : 'خطای حریم معابر (ساخت غیرمجاز)'}
              </Text>
              <View style={[styles.badge, { borderColor: statusColor, backgroundColor: `${statusColor}18` }]}>
                <Text variant="caption" weight="bold" style={{ color: statusColor }}>
                  حریم {ruleMeters.toLocaleString('fa-IR')} متر
                </Text>
              </View>
            </View>

            <Text variant="caption" color="secondary" numberOfLines={2} style={styles.descText}>
              {isChecking
                ? `در حال استعلام حریم ${ruleMeters.toLocaleString('fa-IR')} متری از معابر و فضاهای عمومی...`
                : proximityResult?.message ?? ''}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              GameAudio.playTap();
              onCancel();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            <Text variant="caption" weight="semibold" color="secondary">
              لغو
            </Text>
          </TouchableOpacity>

          {!isChecking && !isValid && onRetry && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                GameAudio.playTap();
                onRetry();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#F59E0B" />
              <Text variant="caption" weight="semibold" style={{ color: '#FCD34D' }}>
                تلاش مجدد
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (!isValid || isChecking) && styles.confirmBtnDisabled]}
            disabled={!isValid || isChecking}
            onPress={() => {
              GameAudio.playTap();
              onConfirm();
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isValid && !isChecking ? ['#10B981', '#059669'] : ['#374151', '#1F2937']}
              style={styles.confirmBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text variant="body" weight="bold" color="inverse">
                {isValid ? '🏗️ تأیید و انتخاب سازه' : `🚫 حریم غیرمجاز (کمتر از ${ruleMeters.toLocaleString('fa-IR')} متر)`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99,
  },
  inner: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.4)',
    shadowColor: '#000',
    shadowRadius: 14,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  descText: {
    lineHeight: 18,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
