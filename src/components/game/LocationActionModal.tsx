/**
 * BuildIran — Location Action Modal — «Gentleman Neon» (v2)
 * Triggered when a player taps any coordinate on the map.
 * Rendered with the shared Sheet primitive: title «عملیات نقشه», coordinate
 * subtitle (forced LTR) and two big option rows with press springs:
 *   1. «ساختن ملک» (Build Property): Zooms to max level and displays 5m setback circle
 *   2. «ارزیابی محله» (Neighborhood Assessment): Inspects district metrics, governance, and development
 * Locked districts render in muted tones. Public props and the
 * district-lock / audio logic are unchanged.
 */

import { IconPlate } from '@/components/ui/IconPlate';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Motion, Radii, Spacing, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GameAudio } from '@/lib/audio';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import type { LatLng } from '@/types/game.types';
import { findDistrictByCoordinate, formatCoordinate } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface LocationActionModalProps {
  visible: boolean;
  coordinate: LatLng | null;
  onSelectBuild: () => void;
  onSelectEvaluate: () => void;
  onClose: () => void;
}

/**
 * Wraps a Latin fragment (coordinate) in LTR embedding controls so it renders
 * correctly inside the RTL sheet subtitle.
 */
const ltr = (s: string) => `\u202A${s}\u202C`;

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

export const LocationActionModal: React.FC<LocationActionModalProps> = ({
  visible,
  coordinate,
  onSelectBuild,
  onSelectEvaluate,
  onClose,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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
    <Sheet
      visible={visible}
      onClose={onClose}
      title="عملیات نقشه"
      subtitle={ltr(formatCoordinate(coordinate, 4))}
      maxHeight={0.75}
    >
      {/* District context */}
      <View style={styles.districtRow}>
        <IconPlate name="location" tone="steel" size="sm" />
        <View style={styles.flex1}>
          <Text variant="body" weight="medium" numberOfLines={1}>
            {districtDisplayName ? `محله ${districtDisplayName}` : 'نقطه انتخابی روی نقشه'}
          </Text>
          {areaDisplayName ? (
            <Text variant="caption" color="muted" numberOfLines={1}>
              {areaDisplayName}
            </Text>
          ) : null}
        </View>
        <View style={[styles.statusChip, isLocked ? styles.statusChipLocked : styles.statusChipActive]}>
          <Text
            style={[
              styles.statusChipText,
              isLocked ? styles.statusChipTextLocked : styles.statusChipTextActive,
            ]}
          >
            {isLocked ? 'قفل‌شده' : 'فعال'}
          </Text>
        </View>
      </View>

      {/* Informative Locked Banner */}
      {isLocked && (
        <View style={styles.lockedBanner}>
          <Ionicons name="information-circle-outline" size={16} color={c.brass[400]} />
          <Text variant="caption" color="secondary" style={styles.flex1}>
            جهت تمرکز بازیکنان این محله قفل است. ساخت‌وساز غیرفعال است اما امکان ارزیابی شاخص‌ها وجود دارد.
          </Text>
        </View>
      )}

      {/* Option rows */}
      <View style={styles.options}>
        {/* Choice 1: ساختن ملک */}
        <TouchableScale
          style={[styles.optionRow, isLocked && styles.optionRowLocked]}
          onPress={handleBuildPress}
          activeOpacity={isLocked ? 0.7 : 0.82}
          accessibilityRole="button"
          accessibilityLabel="ساختن ملک"
        >
          <IconPlate name="construct" tone={isLocked ? 'neutral' : 'brass'} size="lg" />
          <View style={styles.optionTexts}>
            <View style={styles.optionTitleRow}>
              <Text
                variant="subtitle"
                weight="semibold"
                color={isLocked ? 'secondary' : 'primary'}
              >
                ساختن ملک
              </Text>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {isLocked ? 'غیرفعال در این فاز' : 'حریم ۵ متر'}
                </Text>
              </View>
            </View>
            <Text variant="caption" color="secondary" numberOfLines={2}>
              {isLocked
                ? 'امکان ساخت ملک تا زمان آزادسازی این منطقه در فازهای بعدی بازی غیرفعال است.'
                : 'بزرگنمایی حداکثری نقشه روی زمین و استعلام خودکار حریم ۵ متری از خیابان‌ها جهت احداث'}
            </Text>
          </View>
          <Ionicons
            name={isLocked ? 'lock-closed' : 'chevron-back'}
            size={18}
            color={isLocked ? c.text.muted : c.text.secondary}
          />
        </TouchableScale>

        {/* Choice 2: ارزیابی محله */}
        <TouchableScale
          style={styles.optionRow}
          onPress={() => {
            GameAudio.playTap();
            onSelectEvaluate();
          }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="ارزیابی محله"
        >
          <IconPlate name="analytics" tone="steel" size="lg" />
          <View style={styles.optionTexts}>
            <View style={styles.optionTitleRow}>
              <Text variant="subtitle" weight="semibold" color="primary">
                ارزیابی محله
              </Text>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>تحلیل منطقه</Text>
              </View>
            </View>
            <Text variant="caption" color="secondary" numberOfLines={2}>
              مشاهده تراکم سازه‌ها، رونق اقتصادی، شاخص توسعه و وضعیت ویرایشگران محله
            </Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={c.text.secondary} />
        </TouchableScale>
      </View>

      {/* Dismiss / Cancel */}
      <TouchableScale style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
        <Text variant="caption" color="muted">انصراف و بازگشت به نقشه</Text>
      </TouchableScale>
    </Sheet>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    flex1: {
      flex: 1,
    },

    districtRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    statusChip: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    statusChipActive: {
      backgroundColor: `${c.jade}1A`,
      borderColor: `${c.jade}3D`,
    },
    statusChipLocked: {
      backgroundColor: c.ink[500],
      borderColor: c.border.default,
    },
    statusChipText: {
      fontSize: Typography.sizes.xs,
    },
    statusChipTextActive: {
      color: c.jade,
    },
    statusChipTextLocked: {
      color: c.text.secondary,
    },

    lockedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: `${c.brass[400]}14`,
      borderWidth: 1,
      borderColor: `${c.brass[400]}3D`,
      borderRadius: Radii.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      marginBottom: Spacing.md,
    },

    options: {
      gap: Spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.lg,
      padding: Spacing.md,
    },
    optionRowLocked: {
      opacity: 0.55,
    },
    optionTexts: {
      flex: 1,
      gap: 2,
    },
    optionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    metaChip: {
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    metaChipText: {
      fontSize: Typography.sizes.xs,
      color: c.text.secondary,
    },

    dismissBtn: {
      alignSelf: 'center',
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
  });
