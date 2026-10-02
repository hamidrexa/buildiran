/**
 * BuildIran — SegmentedTabs (theme-reactive)
 * Ink pill track with a brass active segment. For switching concerns in-place.
 */

import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Radii, Spacing, Typography, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Item<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  items: Item<T>[];
  value: T;
  onChange: (key: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedTabs<T extends string>({ items, value, onChange, style }: Props<T>) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {items.map((item) => (
        <Segment
          key={item.key}
          label={item.label}
          active={item.key === value}
          onPress={() => onChange(item.key)}
          styles={styles}
        />
      ))}
    </View>
  );
}

const Segment = React.memo(function Segment({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, Motion.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.press);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={styles.segmentTouch}
    >
      <Animated.View style={[styles.segment, active && styles.segmentActive, animStyle]}>
        <Text
          style={styles.label}
          weight={active ? 'semibold' : 'medium'}
          color={active ? 'inverse' : 'secondary'}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: c.ink[600],
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: 3,
      gap: 3,
    },
    segmentTouch: {
      flex: 1,
    },
    segment: {
      paddingVertical: Spacing.sm - 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.full,
    },
    segmentActive: {
      backgroundColor: c.brass[500],
    },
    label: {
      fontSize: Typography.sizes.sm,
    },
  });

export default SegmentedTabs;
