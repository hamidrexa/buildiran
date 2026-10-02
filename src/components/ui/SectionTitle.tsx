/**
 * BuildIran — SectionTitle (theme-reactive)
 * Kicker (small brass overline) + title + optional hairline rule.
 * The typographic rhythm that organizes every screen.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  kicker?: string;
  title?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rule?: boolean;
}

export const SectionTitle: React.FC<Props> = ({ kicker, title, trailing, style, rule = true }) => {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.texts}>
          {kicker ? <Text variant="label" color="brand" style={styles.kicker}>{kicker}</Text> : null}
          {title ? <Text variant="subtitle" weight="bold">{title}</Text> : null}
        </View>
        {trailing}
      </View>
      {rule && <View style={[styles.rule, { backgroundColor: c.border.subtle }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md - 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  texts: {
    gap: 1,
  },
  kicker: {
    marginBottom: 2,
  },
  rule: {
    height: 1,
  },
});

export default SectionTitle;
