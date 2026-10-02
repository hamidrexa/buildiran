/**
 * BuildIran — Ink Card (theme-reactive)
 * Layered surface with hairline border, optional top sheen, optional
 * blueprint corner-ticks (brass) — max one or two hero cards per screen.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radii, Shadows } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padded?: boolean;
  sheen?: boolean;
  cornerTicks?: boolean;
}

export const Card: React.FC<Props> = ({
  children,
  style,
  elevated = false,
  padded = true,
  sheen = true,
  cornerTicks = false,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {sheen && (
        <LinearGradient
          colors={c.gradient.cardSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {cornerTicks && (
        <>
          <View style={[styles.tick, styles.tickTopEnd]} />
          <View style={[styles.tick, styles.tickBottomStart]} />
        </>
      )}
      <View style={[padded && styles.padded, styles.content]}>
        {children}
      </View>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      overflow: 'hidden',
    },
    padded: {
      padding: Spacing.lg,
    },
    content: {},
    elevated: {
      ...Shadows.md,
      borderColor: c.border.default,
    },
    tick: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderColor: c.brass[400],
      zIndex: 1,
    },
    tickTopEnd: {
      top: 8,
      left: 8,
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderTopStartRadius: 2,
    },
    tickBottomStart: {
      bottom: 8,
      right: 8,
      borderBottomWidth: 1.5,
      borderRightWidth: 1.5,
      borderBottomEndRadius: 2,
    },
  });

export default Card;
