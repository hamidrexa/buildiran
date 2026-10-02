/**
 * BuildIran — Badge (theme-reactive)
 * Small count/status dot for icon buttons and tabs. Claimables glow neon.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type Tone = 'crimson' | 'brass' | 'jade' | 'steel' | 'neon';

interface Props {
  count?: number;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<Props> = ({ count = 0, tone = 'neon', style }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  if (count <= 0) return null;
  const shown = count > 99 ? '99+' : count.toLocaleString('fa-IR');

  const bg =
    tone === 'neon' ? c.neon[400]
    : tone === 'brass' ? c.brass[400]
    : tone === 'jade' ? c.jade
    : tone === 'steel' ? c.steel
    : c.crimson;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={styles.text} weight="bold" color="inverse">
        {shown}
      </Text>
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    badge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.bg.primary,
    },
    text: {
      fontSize: Typography.sizes.xs,
      lineHeight: 12,
    },
  });

export default Badge;
