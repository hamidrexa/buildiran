/**
 * BuildIran — Chip (theme-reactive)
 * Compact pill for resources, stats and meta info: icon + value.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'brass' | 'neon' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta' | 'neutral';

interface Props {
  icon?: IconName;
  label?: string;
  value?: string | number;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<Props> = ({ icon, label, value, tone = 'brass', style }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const color = toneColor(c, tone);

  return (
    <View style={[styles.chip, style]}>
      {icon && <Ionicons name={icon} size={13} color={color} />}
      {value !== undefined && (
        <Text style={styles.value} weight="semibold" color="primary">
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </Text>
      )}
      {label && (
        <Text style={styles.label} variant="caption" color="secondary">
          {label}
        </Text>
      )}
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
    default: return c.text.secondary;
  }
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs + 2,
      alignSelf: 'flex-start',
    },
    value: {
      fontSize: Typography.sizes.sm,
      fontVariant: ['tabular-nums'],
    },
    label: {
      fontSize: Typography.sizes.xs,
    },
  });

export default Chip;
