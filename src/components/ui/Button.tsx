/**
 * BuildIran — Brass Button (theme-reactive)
 * Primary = brass gradient + soft glow (the one hero action).
 * Neon = electric mint variant for live/claimable actions. Secondary = plate.
 */

import React, { useCallback, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radii, Typography, Motion, Shadows } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'neon' | 'secondary' | 'ghost' | 'danger';
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
  iconPosition?: 'start' | 'end';
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
  iconPosition = 'start',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, Motion.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Motion.press);
  }, [scale]);

  const isDisabled = disabled || loading;
  const labelColor =
    variant === 'primary' || variant === 'danger' || variant === 'neon'
      ? 'inverse'
      : variant === 'ghost'
        ? 'secondary'
        : 'brand';

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
      {variant === 'primary' && (
        <LinearGradient
          colors={colors.gradient.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {variant === 'neon' && (
        <LinearGradient
          colors={[colors.neon[400], colors.neon[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'primary' || variant === 'danger' || variant === 'neon'
                ? colors.text.inverse
                : colors.text.brand
            }
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'start' && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              weight="semibold"
              color={labelColor}
              style={[
                styles.label,
                size === 'sm' && styles.labelSm,
                size === 'lg' && styles.labelLg,
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'end' && <View style={styles.iconContainer}>{icon}</View>}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
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
      ...Shadows.md,
      shadowColor: c.brass[500],
      shadowOpacity: 0.35,
    },
    neon: {
      ...Shadows.md,
      shadowColor: c.neon[400],
      shadowOpacity: 0.45,
    },
    secondary: {
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.brand,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.border.default,
    },
    danger: {
      backgroundColor: c.crimson,
    },
    // Sizes
    size_sm: {
      paddingVertical: Spacing.xs + 2,
      paddingHorizontal: Spacing.md + 2,
      borderRadius: Radii.sm,
    },
    size_md: {
      paddingVertical: Spacing.sm + 4,
      paddingHorizontal: Spacing.xl,
    },
    size_lg: {
      paddingVertical: Spacing.md + 3,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: Radii.lg,
    },
    // States
    disabled: {
      opacity: 0.4,
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
      marginHorizontal: Spacing.xxs,
    },
  });

export default Button;
