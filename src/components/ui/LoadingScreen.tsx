/**
 * BuildIran — Loading Screen (theme-reactive)
 * Persian Shahriyar shield lockup on the ink canvas.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PersianBrandLockup } from '@/components/brand/BrandLogos';
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
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, markStyle]}>
        <PersianBrandLockup width={210} />
      </Animated.View>

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
      backgroundColor: c.ink[950],
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xl,
    },
    logo: {
      width: 210,
      height: 302,
      alignItems: 'center',
      justifyContent: 'center',
    },
    message: {
      marginTop: Spacing.lg,
    },
  });

export default LoadingScreen;
