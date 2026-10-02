/**
 * BuildIran — CareerSelectionModal (Gentleman Neon, v2)
 * «مسیر حرفه‌ای» bottom sheet: career option cards with career-color-tinted
 * IconPlates (Ionicons mapped from the legacy emoji), buff pills, brass
 * selection state (brass = selection; neon stays reserved for live actions)
 * and a single brass primary confirm action in the sheet footer.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { GameAudio } from '@/lib/audio';
import { CAREER_PATHS, type CareerPathId } from '@/lib/careers';
import { usePlayerStore } from '@/store/usePlayerStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** career.icon carries legacy emoji — mapped to Ionicons for UI chrome. */
const CAREER_ICON: Record<CareerPathId | 'default', IconName> = {
  citizen: 'person',
  trader: 'swap-horizontal',
  industrialist: 'construct',
  producer: 'layers',
  business: 'storefront',
  employee: 'people',
  famous: 'star',
  real_estate: 'business',
  default: 'briefcase',
};

export const CareerSelectionModal: React.FC<Props> = ({ visible, onClose }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const player = usePlayerStore((s) => s.player);
  const setCareerPath = usePlayerStore((s) => s.setCareerPath);
  const [selectedId, setSelectedId] = useState<CareerPathId>('citizen');

  useEffect(() => {
    if (visible) setSelectedId(player?.careerPath ?? 'citizen');
  }, [visible, player?.careerPath]);

  if (!visible || !player) return null;

  const handleSelect = (pathId: CareerPathId) => {
    setSelectedId(pathId);
  };

  const handleConfirm = (pathId: CareerPathId) => {
    GameAudio.playTap?.();
    setCareerPath(pathId);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="مسیر حرفه‌ای"
      subtitle="یک مسیر شغلی انتخاب کنید تا بوف‌های اختصاصی دریافت کنید و ماموریت‌های داستانی مربوط به آن را دنبال کنید. شما می‌توانید هر زمان که خواستید مسیر خود را تغییر دهید."
      footer={
        <Button
          label="تایید مسیر"
          variant="primary"
          fullWidth
          onPress={() => handleConfirm(selectedId)}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.values(CAREER_PATHS).map((career, i) => {
          const selected = selectedId === career.id;
          const icon = CAREER_ICON[career.id] ?? CAREER_ICON.default;

          return (
            <Animated.View
              key={career.id}
              entering={FadeInDown.delay(Motion.stagger(i)).springify()}
            >
              <CareerOption
                career={career}
                icon={icon}
                selected={selected}
                onSelect={handleSelect}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
};

// ─── Career option card (press spring per Motion §4) ──────────────────────────

interface CareerOptionProps {
  career: (typeof CAREER_PATHS)[CareerPathId];
  icon: IconName;
  selected: boolean;
  onSelect: (pathId: CareerPathId) => void;
}

const CareerOption: React.FC<CareerOptionProps> = ({
  career,
  icon,
  selected,
  onSelect,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onSelect(career.id)}
      onPressIn={() => {
        scale.value = withSpring(0.97, Motion.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.press);
      }}
      style={[animatedStyle, styles.careerCard, selected && styles.careerSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={career.nameFa}
    >
      {/* Career-color tinted plate (IconPlate pattern) */}
      <View
        style={[
          styles.plate,
          {
            backgroundColor: `${career.color}22`,
            borderColor: `${career.color}3D`,
          },
        ]}
      >
        <Ionicons name={icon} size={21} color={career.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {career.nameFa}
          </Text>
          {selected && (
            <Ionicons name="checkmark-circle" size={16} color={c.brass[400]} />
          )}
        </View>
        <Text variant="caption" color="secondary">
          {career.descriptionFa}
        </Text>
        <View
          style={[
            styles.buffPill,
            {
              backgroundColor: `${career.color}14`,
              borderColor: `${career.color}2E`,
            },
          ]}
        >
          <Ionicons name="flash" size={12} color={career.color} />
          <Text variant="caption" color="secondary" style={styles.buffText}>
            {career.buffFa}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      gap: Spacing.sm,
      paddingTop: Spacing.xs,
    },
    careerCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      backgroundColor: c.ink[700],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.lg,
      padding: Spacing.md,
    },
    careerSelected: {
      borderColor: c.brass[400],
      backgroundColor: c.gradient.brandSoft[0],
    },
    plate: {
      width: 42,
      height: 42,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBody: {
      flex: 1,
      gap: Spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    buffPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: Radii.sm,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs,
      marginTop: Spacing.xxs,
    },
    buffText: {
      flexShrink: 1,
    },
  });

export default CareerSelectionModal;
