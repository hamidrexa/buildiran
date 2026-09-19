/**
 * BuildIran — MissionCompletionToast
 * Animated toast notification that slides in when a mission is completed.
 * It listens to the `recentlyCompleted` array in `useMissionStore`.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { useMissionStore } from '@/store/useMissionStore';
import { GameAudio } from '@/lib/audio';
import fa from '@/i18n/fa';
import type { MissionSlot } from '@/types/missions.types';

export function MissionCompletionToast() {
  const insets = useSafeAreaInsets();
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

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14).stiffness(100)}
      exiting={FadeOutUp}
      style={[styles.container, { top: insets.top + 16 }]}
    >
      <LinearGradient
        colors={[Colors.brand.primary, Colors.brand.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{def.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text variant="caption" weight="bold" color="inverse" style={{ opacity: 0.8 }}>
            {fa.missions.completionTitle}
          </Text>
          <Text variant="body" weight="extrabold" color="inverse">
            {def.titleFa}
          </Text>
          <Text variant="label" weight="medium" color="inverse" style={{ marginTop: 2, opacity: 0.9 }}>
            {fa.missions.completionSub}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    ...Shadows.lg,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
});
