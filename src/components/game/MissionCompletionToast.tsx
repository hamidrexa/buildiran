/**
 * BuildIran — MissionCompletionToast (Gentleman Neon, v2)
 * Top-center glass toast (mode-aware per the §2 glass recipe): jade
 * checkmark plate, mission title and reward chips. Spring entrance from
 * the top, auto-dismiss after 4s. Listens to the `recentlyCompleted`
 * queue in `useMissionStore`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { IconPlate } from '@/components/ui/IconPlate';
import { Chip } from '@/components/ui/Chip';
import { Motion, Radii, Shadows, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { useMissionStore } from '@/store/useMissionStore';
import { GameAudio } from '@/lib/audio';
import fa from '@/i18n/fa';
import type { MissionSlot } from '@/types/missions.types';

export function MissionCompletionToast() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { recentlyCompleted, slots, clearRecentlyCompleted } = useMissionStore();
  const [currentSlot, setCurrentSlot] = useState<MissionSlot | null>(null);

  useEffect(() => {
    if (recentlyCompleted.length > 0 && !currentSlot) {
      // Pick the first one
      const slotId = recentlyCompleted[0];
      const slot = slots[slotId];
      if (slot && slot.definition) {
        setCurrentSlot(slot);
        GameAudio.playLevelUp?.(); // or some triumphant sound

        // Auto-dismiss after 4 seconds
        const timer = setTimeout(() => {
          handleDismiss();
        }, 4000);
        return () => clearTimeout(timer);
      } else {
        // Fallback: clear it if invalid
        clearRecentlyCompleted();
      }
    }
  }, [recentlyCompleted, currentSlot, slots, clearRecentlyCompleted]);

  const handleDismiss = () => {
    setCurrentSlot(null);
    clearRecentlyCompleted(); // Simple queue handling: clear all for now
  };

  if (!currentSlot || !currentSlot.definition) return null;

  const def = currentSlot.definition;
  const rewards = def.rewards;
  const hasRewards =
    (rewards.cash ?? 0) > 0 ||
    (rewards.power ?? 0) > 0 ||
    (rewards.popularity ?? 0) > 0 ||
    (rewards.activity ?? 0) > 0;

  return (
    <Animated.View
      entering={SlideInUp.springify()
        .damping(Motion.entrance.damping)
        .stiffness(Motion.entrance.stiffness)}
      exiting={FadeOutUp}
      pointerEvents="none"
      style={[styles.container, { top: insets.top + Spacing.md }]}
    >
      <View style={styles.toast}>
        <IconPlate name="checkmark-circle" size="md" tone="jade" />
        <View style={styles.content}>
          <Text variant="label" weight="medium" color="success">
            {fa.missions.completionTitle}
          </Text>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {def.titleFa}
          </Text>
          {hasRewards && (
            <View style={styles.rewardRow}>
              {(rewards.cash ?? 0) > 0 && (
                <Chip icon="cash" tone="brass" value={rewards.cash} label="تومان" />
              )}
              {(rewards.power ?? 0) > 0 && (
                <Chip icon="flash" tone="brass" value={rewards.power} label="قدرت" />
              )}
              {(rewards.popularity ?? 0) > 0 && (
                <Chip icon="sparkles" tone="jade" value={rewards.popularity} label="محبوبیت" />
              )}
              {(rewards.activity ?? 0) > 0 && (
                <Chip icon="flame" tone="ember" value={rewards.activity} label="فعالیت" />
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 999,
      elevation: 16,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      width: '92%',
      maxWidth: 420,
      // Glass recipe (§2) — HUD-grade surface, mode-aware
      backgroundColor:
        c.mode === 'dark' ? 'rgba(10, 12, 16, 0.88)' : 'rgba(255, 255, 255, 0.92)',
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      ...Shadows.md,
    },
    content: {
      flex: 1,
      gap: Spacing.xs,
    },
    rewardRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.xxs,
    },
  });

export default MissionCompletionToast;
