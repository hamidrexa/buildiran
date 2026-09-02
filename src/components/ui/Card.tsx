/**
 * BuildIran — Glass Card Component
 * Dark glass-morphism card with subtle border.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radii, Shadows } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padded?: boolean;
}

export const Card: React.FC<Props> = ({
  children,
  style,
  elevated = false,
  padded = true,
}) => {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.lg,
  },
  elevated: {
    ...Shadows.md,
    borderColor: Colors.border.brand,
  },
});

export default Card;
