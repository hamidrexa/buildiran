/**
 * BuildIran — StatBar (theme-reactive)
 * Animated labeled stat bar (icon + track + tabular numeral).
 * Used by the HUD panel and the profile's four-factor grid.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { ProgressBar, type Tone as BarTone, toneColor } from './ProgressBar';

type IconName = keyof typeof Ionicons.glyphMap;
type StatTone = BarTone | 'power' | 'wealth' | 'activity' | 'popularity';

interface Props {
  icon: IconName;
  label: string;
  value: number;
  maxValue: number;
  tone?: StatTone;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const StatBar: React.FC<Props> = ({
  icon,
  label,
  value,
  maxValue,
  tone = 'brass',
  delay = 0,
  style,
  compact = false,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  const resolved: BarTone =
    tone === 'power' ? 'terracotta'
    : tone === 'wealth' ? 'brass'
    : tone === 'activity' ? 'ember'
    : tone === 'popularity' ? 'jade'
    : tone;

  const color = toneColor(c, resolved);

  return (
    <View style={[styles.row, style]}>
      <Ionicons name={icon} size={compact ? 13 : 15} color={color} />
      {!compact && (
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <ProgressBar percent={pct} tone={resolved} delay={delay} height={compact ? 4 : 6} style={styles.bar} sheen={false} />
      <Text variant="caption" weight="semibold" style={[styles.value, { color }]}>
        {value.toLocaleString('fa-IR')}
      </Text>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    label: {
      width: 52,
      textAlign: 'right',
    },
    bar: {
      flex: 1,
    },
    value: {
      fontSize: Typography.sizes.xs + 1,
      fontVariant: ['tabular-nums'],
      minWidth: 34,
      textAlign: 'left',
    },
  });

export default StatBar;
