/**
 * BuildIran — Premium Button Component
 * Gold gradient primary button with press animation.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, Radii, Typography } from '@/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  icon,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.text.inverse : Colors.text.primary}
            size="small"
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              weight="semibold"
              color={variant === 'primary' ? 'inverse' : variant === 'ghost' ? 'brand' : 'primary'}
              style={[
                styles.label,
                size === 'sm' && styles.labelSm,
                size === 'lg' && styles.labelLg,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  // Variants
  primary: {
    backgroundColor: Colors.brand.primary,
  },
  secondary: {
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.brand,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  danger: {
    backgroundColor: Colors.semantic.error,
  },
  // Sizes
  size_sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  size_md: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  // States
  disabled: {
    opacity: 0.45,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  // Labels
  label: {
    textAlign: 'center',
    writingDirection: 'rtl',
    fontSize: Typography.sizes.md,
  },
  labelSm: {
    fontSize: Typography.sizes.sm,
  },
  labelLg: {
    fontSize: Typography.sizes.lg,
  },
  iconContainer: {
    marginStart: Spacing.xs,
  },
});

export default Button;
