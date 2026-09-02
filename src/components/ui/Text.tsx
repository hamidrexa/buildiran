/**
 * BuildIran — RTL-Aware Text Component
 * Always renders Vazirmatn (Persian) font with proper RTL direction.
 */

import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/theme';

type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption' | 'label';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
type TextColor = 'primary' | 'secondary' | 'muted' | 'brand' | 'inverse';

interface Props extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  center?: boolean;
}

const variantStyles: Record<TextVariant, object> = {
  display: { fontSize: Typography.sizes['4xl'], lineHeight: Typography.sizes['4xl'] * Typography.lineHeights.tight },
  heading: { fontSize: Typography.sizes['3xl'], lineHeight: Typography.sizes['3xl'] * Typography.lineHeights.tight },
  title: { fontSize: Typography.sizes['2xl'], lineHeight: Typography.sizes['2xl'] * Typography.lineHeights.normal },
  body: { fontSize: Typography.sizes.md, lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed },
  caption: { fontSize: Typography.sizes.sm, lineHeight: Typography.sizes.sm * Typography.lineHeights.normal },
  label: { fontSize: Typography.sizes.xs, lineHeight: Typography.sizes.xs * Typography.lineHeights.normal, letterSpacing: 0.5 },
};

const colorMap: Record<TextColor, string> = {
  primary: Colors.text.primary,
  secondary: Colors.text.secondary,
  muted: Colors.text.muted,
  brand: Colors.text.brand,
  inverse: Colors.text.inverse,
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
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        { fontWeight: Typography.weights[weight] },
        { color: colorMap[color] },
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
    fontFamily: Typography.fonts.persian,
    writingDirection: 'rtl',
    textAlign: 'right',
    color: Colors.text.primary,
  },
  center: {
    textAlign: 'center',
  },
});

export default Text;
