/**
 * BuildIran — Loading Screen (theme-reactive)
 * Ink canvas, brass hairline ring, the architect's arch mark and wordmark.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = ({
  message = 'در حال آماده‌سازی شهر...',
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1400, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [rotation, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.mark, markStyle]}>
          {/* The arch — BuildIran's mark */}
          <View style={[styles.leg, styles.legStart]} />
          <View style={[styles.leg, styles.legEnd]} />
          <View style={styles.arch} />
        </Animated.View>
      </View>

      <View style={styles.wordmark}>
        <Text variant="title" weight="bold" color="primary" center>
          بیلد ایران
        </Text>
        <Text variant="label" color="muted" center style={styles.wordmarkSub}>
          BUILD IRAN
        </Text>
      </View>

      <Text variant="caption" color="muted" center style={styles.message}>
        {message}
      </Text>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xl,
    },
    ringWrapper: {
      width: 84,
      height: 84,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1.5,
      borderColor: c.brass[600],
      borderTopColor: 'transparent',
      borderLeftColor: 'transparent',
    },
    mark: {
      width: 40,
      height: 44,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    leg: {
      position: 'absolute',
      bottom: 0,
      width: 6,
      height: 26,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      backgroundColor: c.brass[400],
    },
    legStart: {
      start: 4,
      transform: [{ skewY: '-6deg' }],
    },
    legEnd: {
      end: 4,
      transform: [{ skewY: '6deg' }],
    },
    arch: {
      position: 'absolute',
      top: 2,
      alignSelf: 'center',
      width: 22,
      height: 18,
      borderTopLeftRadius: 11,
      borderTopRightRadius: 11,
      borderWidth: 4,
      borderBottomWidth: 0,
      borderColor: c.brass[300],
    },
    wordmark: {
      alignItems: 'center',
      gap: 2,
    },
    wordmarkSub: {
      letterSpacing: 2,
    },
    message: {
      marginTop: Spacing.lg,
    },
  });

export default LoadingScreen;
