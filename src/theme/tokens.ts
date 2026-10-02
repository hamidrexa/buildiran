/**
 * BuildIran — Mode-independent design tokens
 * Typography, geometry, depth and motion. Colors live in palettes.ts
 * (this file never changes between dark and light).
 */

export const Typography = {
  fonts: {
    persian: 'Vazirmatn',
    latin: 'Vazirmatn',
    mono: 'SpaceMono',
  },
  // Exact family names as loaded in app/_layout.tsx — do not rename.
  fontFamilies: {
    light: 'Vazirmatn-Light',
    regular: 'Vazirmatn',
    medium: 'VazirmatnMedium',
    semibold: 'Vazirmatn-SemiBold',
    bold: 'VazirmatnBold',
    extrabold: 'Vazirmatn-ExtraBold',
    black: 'Vazirmatn-Black',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

/** Neutral elevation — mode-independent. Neon glow colors come from the palette. */
export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

/** Neon glow recipe — pair with a palette neon color at call-site. */
export const NeonGlow = (color: string, strength = 1) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.35 * strength,
  shadowRadius: 12,
  elevation: 0,
});

export const Motion = {
  durations: {
    fast: 140,
    normal: 220,
    slow: 380,
    reveal: 600,
    /** Important transitions — sheets, tab switches, theme swap */
    transition: 320,
  },
  /** Standard press spring */
  press: { damping: 18, stiffness: 320 },
  /** Entrance spring for sheets & modals (important transitions) */
  entrance: { damping: 18, stiffness: 210 },
  /** Tab/icon micro-spring */
  tab: { damping: 14, stiffness: 260 },
  /** Stagger helper for list entrances */
  stagger: (index: number, step = 50) => index * step,
} as const;

export const AnimationDurations = Motion.durations;
