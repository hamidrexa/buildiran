/**
 * BuildIran — Design System Tokens
 * Dark game aesthetic with gold/amber accents, RTL-ready
 */

export const Colors = {
  // Primary brand
  brand: {
    primary: '#D4A017',      // Gold — main CTA, highlights
    secondary: '#C0820A',    // Darker gold — pressed/hover
    accent: '#F5C842',       // Bright gold — badges, XP
  },

  // Game map overlay colors
  map: {
    ownedTile: 'rgba(212, 160, 23, 0.35)',    // Player's territory
    enemyTile: 'rgba(200, 50, 50, 0.30)',      // Opponent's territory
    availableTile: 'rgba(60, 180, 100, 0.25)', // Can be claimed
    selectedTile: 'rgba(212, 160, 23, 0.60)',  // Current selection
  },

  // Backgrounds
  bg: {
    primary: '#0D0F14',    // Deepest dark
    secondary: '#161921',  // Cards, panels
    tertiary: '#1E222E',   // Elevated surfaces
    overlay: 'rgba(13, 15, 20, 0.85)', // Map overlays
  },

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.12)',
    strong: 'rgba(255,255,255,0.20)',
    brand: 'rgba(212, 160, 23, 0.40)',
  },

  // Text
  text: {
    primary: '#F0F2F8',
    secondary: '#8B93A8',
    muted: '#555D73',
    inverse: '#0D0F14',
    brand: '#D4A017',
  },

  // Semantic
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Gradients (as arrays for LinearGradient)
  gradient: {
    brand: ['#D4A017', '#C0820A'] as const,
    dark: ['#0D0F14', '#161921'] as const,
    card: ['#1E222E', '#161921'] as const,
    overlay: ['rgba(13,15,20,0)', 'rgba(13,15,20,0.95)'] as const,
  },
} as const;

export const Typography = {
  // Font families — Vazirmatn for Persian, Inter as fallback
  fonts: {
    persian: 'Vazirmatn',
    latin: 'Inter',
    mono: 'SpaceMono',
  },

  // Font sizes (sp)
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 38,
  },

  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const AnimationDurations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

const Theme = {
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  AnimationDurations,
};

export default Theme;
