/**
 * BuildIran — Loading Screen
 * Full-screen branded loader with animated gold ring.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/theme';
import { Text } from './Text';

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = ({
  message = 'در حال بارگذاری...',
}) => {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [rotation, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Spinning ring */}
      <View style={styles.ringWrapper}>
        <Animated.View style={[styles.ring, ringStyle]} />
        {/* Logo center */}
        <Animated.View style={[styles.logoCircle, logoStyle]}>
          <Text variant="heading" weight="bold" color="brand" center>
            ب
          </Text>
        </Animated.View>
      </View>

      <Text
        variant="caption"
        color="secondary"
        center
        style={styles.message}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  ringWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.brand.primary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.brand,
  },
  message: {
    marginTop: Spacing.md,
  },
});

export default LoadingScreen;
