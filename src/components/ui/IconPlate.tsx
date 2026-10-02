/**
 * BuildIran — IconPlate (theme-reactive)
 * Tinted rounded-square plate holding an Ionicon glyph.
 * The systematic replacement for emoji-as-icon across the game.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

type IconName = keyof typeof Ionicons.glyphMap;
type PlateSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
type Tone = 'brass' | 'neon' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta' | 'neutral' | 'inverse';

interface Props {
  name: IconName;
  size?: PlateSize;
  tone?: Tone;
  style?: ViewStyle;
  bordered?: boolean;
}

const SIZE_MAP: Record<PlateSize, { box: number; icon: number; radius: number }> = {
  xxs: { box: 22, icon: 12, radius: 6 },
  xs: { box: 28, icon: 15, radius: 8 },
  sm: { box: 34, icon: 17, radius: 10 },
  md: { box: 42, icon: 21, radius: 12 },
  lg: { box: 54, icon: 27, radius: 16 },
};

/** Resolve a tone to its palette color — shared with Chip and other plates. */
export const toneOf = (c: Palette, tone: Tone): string => {
  switch (tone) {
    case 'brass': return c.brass[400];
    case 'neon': return c.neon[400];
    case 'jade': return c.jade;
    case 'crimson': return c.crimson;
    case 'steel': return c.steel;
    case 'ember': return c.ember;
    case 'terracotta': return c.terracotta;
    case 'neutral': return c.text.secondary;
    case 'inverse': return c.text.inverse;
  }
};

export const IconPlate: React.FC<Props> = ({
  name,
  size = 'sm',
  tone = 'brass',
  style,
  bordered = true,
}) => {
  const { colors: c } = useTheme();
  const s = SIZE_MAP[size];
  const color = toneOf(c, tone);

  return (
    <View
      style={[
        {
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          backgroundColor: `${color}22`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: bordered ? 1 : 0,
          borderColor: `${color}3D`,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={s.icon} color={color} />
    </View>
  );
};

export default IconPlate;
