/**
 * BuildIran — Building Placement HUD (5-Meter Setback Verification) — «Gentleman Neon» (v2)
 * Displayed when the user enters building placement mode at maximum map zoom.
 * Top instruction bar on mode-aware glass (state plate: sync/checkmark/alert)
 * with the setback rule and live distance-to-street as tabular fa-IR numerals,
 * plus a bottom confirm/cancel action row (one primary brass button + ghost
 * cancel). Props and the placement-validation flow are unchanged.
 */

import { Button } from '@/components/ui/Button';
import { IconPlate } from '@/components/ui/IconPlate';
import { Text } from '@/components/ui/Text';
import { Motion, Radii, Shadows, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GameAudio } from '@/lib/audio';
import type { StreetProximityResult } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BuildingPlacementHUDProps {
  isChecking: boolean;
  proximityResult: StreetProximityResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
}

const STATE_VISUALS = {
  checking: { icon: 'sync' as const, tone: 'steel' as const },
  valid: { icon: 'checkmark-circle' as const, tone: 'jade' as const },
  invalid: { icon: 'alert-circle' as const, tone: 'crimson' as const },
};

export const BuildingPlacementHUD: React.FC<BuildingPlacementHUDProps> = ({
  isChecking,
  proximityResult,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const isValid = proximityResult?.isValid ?? false;
  const ruleMeters = proximityResult?.ruleDistanceMeters ?? 20;
  const distanceMeters = proximityResult?.distanceMeters;

  const stateVisual = STATE_VISUALS[isChecking ? 'checking' : isValid ? 'valid' : 'invalid'];

  return (
    <>
      {/* Instruction bar (top) */}
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        style={[styles.topBar, { top: insets.top + Spacing.md }]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.headerRow}>
            <IconPlate name={stateVisual.icon} tone={stateVisual.tone} size="md" />
            <View style={styles.headerTexts}>
              <Text variant="body" weight="semibold" numberOfLines={1}>
                {isChecking
                  ? 'در حال استعلام حریم معابر...'
                  : isValid
                    ? 'موقعیت زمین مجاز است'
                    : 'خطای حریم معابر (ساخت غیرمجاز)'}
              </Text>
              <Text variant="caption" color="secondary" numberOfLines={2} style={styles.descText}>
                {isChecking
                  ? `در حال استعلام حریم ${ruleMeters.toLocaleString('fa-IR')} متری از معابر و فضاهای عمومی...`
                  : proximityResult?.message ?? ''}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text variant="caption" color="secondary">حریم</Text>
              <Text variant="caption" weight="bold" style={styles.tabular}>
                {ruleMeters.toLocaleString('fa-IR')}
              </Text>
              <Text variant="caption" color="secondary">متر</Text>
            </View>
            {proximityResult && (
              <View style={styles.metaChip}>
                <Text variant="caption" color="secondary">فاصله تا معبر</Text>
                <Text variant="caption" weight="bold" style={styles.tabular}>
                  {distanceMeters?.toLocaleString('fa-IR') ?? '—'}
                </Text>
                <Text variant="caption" color="secondary">متر</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Action row (bottom) */}
      <Animated.View
        entering={FadeInDown.delay(Motion.stagger(1)).springify().damping(18)}
        style={[styles.actionBar, { bottom: insets.bottom + Spacing.md }]}
      >
        <View style={styles.actionBarInner}>
          <Button
            label="انصراف"
            variant="ghost"
            onPress={() => {
              GameAudio.playTap();
              onCancel();
            }}
          />

          {!isChecking && !isValid && onRetry && (
            <Button
              label="تلاش مجدد"
              variant="secondary"
              size="sm"
              icon={<Ionicons name="refresh" size={14} color={c.brass[400]} />}
              onPress={() => {
                GameAudio.playTap();
                onRetry();
              }}
            />
          )}

          <Button
            label="تایید و انتخاب محل"
            variant="primary"
            disabled={!isValid || isChecking}
            onPress={() => {
              GameAudio.playTap();
              onConfirm();
            }}
            style={styles.confirmBtn}
          />
        </View>
      </Animated.View>
    </>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) => {
  const glass = {
    backgroundColor:
      c.mode === 'dark' ? 'rgba(10, 12, 16, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: c.border.subtle,
    borderRadius: Radii.lg,
  };

  return StyleSheet.create({
    topBar: {
      position: 'absolute',
      left: 14,
      right: 14,
      zIndex: 99,
    },
    topBarInner: {
      ...glass,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadows.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    headerTexts: {
      flex: 1,
      gap: 2,
    },
    descText: {
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs,
      alignSelf: 'flex-start',
    },
    tabular: {
      fontVariant: ['tabular-nums'],
    },

    actionBar: {
      position: 'absolute',
      left: 14,
      right: 14,
      zIndex: 99,
    },
    actionBarInner: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.sm + 2,
      ...Shadows.md,
    },
    confirmBtn: {
      flex: 1,
    },
  });
};
