/**
 * BuildIran — ProgressBar (theme-reactive)
 * Animated hairline-track fill. The quiet workhorse for XP, stats, missions.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Radii } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export type Tone = 'brass' | 'neon' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta';

interface Props {
  percent: number; // 0–100
  height?: number;
  tone?: Tone;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  sheen?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  percent,
  height = 6,
  tone = 'brass',
  delay = 0,
  style,
  sheen = true,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const width = useSharedValue(0);
  const clamped = Math.min(Math.max(percent, 0), 100);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [clamped, delay, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
  }));

  const color = toneColor(c, tone);

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
        {sheen ? (
          <LinearGradient
            colors={[color, `${color}B8`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
        )}
      </Animated.View>
    </View>
  );
};

export const toneColor = (c: ReturnType<typeof useTheme>['colors'], tone: Tone): string => {
  switch (tone) {
    case 'brass': return c.brass[400];
    case 'neon': return c.neon[400];
    case 'jade': return c.jade;
    case 'crimson': return c.crimson;
    case 'steel': return c.steel;
    case 'ember': return c.ember;
    case 'terracotta': return c.terracotta;
  }
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    track: {
      backgroundColor: c.ink[500],
      borderRadius: Radii.full,
      overflow: 'hidden',
      width: '100%',
    },
    fill: {
      height: '100%',
      overflow: 'hidden',
    },
  });

export default ProgressBar;
