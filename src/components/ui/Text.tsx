/**
 * BuildIran — RTL-Aware Text Component (theme-reactive)
 * Vazirmatn everywhere, palette-aware colors, warm hierarchy.
 */

import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type TextVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label';

type TextWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
type TextColor = 'primary' | 'secondary' | 'muted' | 'brand' | 'inverse' | 'error' | 'success' | 'info' | 'neon';

interface Props extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  center?: boolean;
}

const variantStyles: Record<TextVariant, object> = {
  display: {
    fontSize: Typography.sizes['4xl'],
    lineHeight: Typography.sizes['4xl'] * Typography.lineHeights.tight,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: Typography.sizes['3xl'],
    lineHeight: Typography.sizes['3xl'] * Typography.lineHeights.tight,
    letterSpacing: -0.4,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    lineHeight: Typography.sizes['2xl'] * Typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    lineHeight: Typography.sizes.xl * Typography.lineHeights.tight,
  },
  body: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed,
  },
  caption: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  label: {
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
    letterSpacing: 0.8,
  },
};

// Exact family names as loaded in app/_layout.tsx — do not rename.
const weightToFontFamily: Record<TextWeight, string> = {
  light: 'Vazirmatn-Light',
  regular: 'Vazirmatn',
  medium: 'VazirmatnMedium',
  semibold: 'Vazirmatn-SemiBold',
  bold: 'VazirmatnBold',
  extrabold: 'Vazirmatn-ExtraBold',
  black: 'Vazirmatn-Black',
};

export const Text: React.FC<Props> = ({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  center = false,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();

  const colorMap: Record<TextColor, string> = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    brand: colors.text.brand,
    inverse: colors.text.inverse,
    error: colors.semantic.error,
    success: colors.semantic.success,
    info: colors.semantic.info,
    neon: colors.neon[400],
  };

  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        { fontFamily: weightToFontFamily[weight], color: colorMap[color] },
        center && styles.center,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  center: {
    textAlign: 'center',
  },
});

export default Text;
