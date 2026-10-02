/**
 * BuildIran — Theme Palettes «Gentleman Neon» (v2)
 * ────────────────────────────────────────────────────────────────
 * Two full palettes — «Midnight» (dark, default) and «Porcelain» (light).
 * Identity: refined ink/ivory base, brass metal, and ONE electric mint
 * neon reserved for live signals (active states, focus, claimables).
 * Neon is a garnish, never a sauce.
 *
 * Both palettes share the SAME token shape, so screens are mode-agnostic:
 * every color arrives from `useTheme().colors`. Geometry/motion live in
 * theme/index.ts and never change per mode.
 */

export interface Palette {
  mode: 'dark' | 'light';

  ink: { 950: string; 900: string; 800: string; 700: string; 600: string; 500: string };
  brass: { 200: string; 300: string; 400: string; 500: string; 600: string; 700: string };
  /** Electric mint — live/active/claimable only. Garnish, never a sauce. */
  neon: { 300: string; 400: string; 500: string; glow: string };

  ivory: string;
  steel: string;
  jade: string;
  crimson: string;
  terracotta: string;
  ember: string;

  brand: { primary: string; secondary: string; accent: string };
  bg: { primary: string; secondary: string; tertiary: string; overlay: string };
  map: {
    ownedTile: string; enemyTile: string; availableTile: string; selectedTile: string;
  };
  border: { subtle: string; default: string; strong: string; brand: string; neon: string };
  text: { primary: string; secondary: string; muted: string; inverse: string; brand: string };
  semantic: { success: string; warning: string; error: string; info: string };
  stat: { power: string; wealth: string; activity: string; popularity: string };
  tier: Record<number, string>;
  medal: Record<number, string>;
  gradient: {
    brand: readonly [string, string];
    brandVertical: readonly [string, string];
    brandSoft: readonly [string, string];
    dark: readonly [string, string];
    card: readonly [string, string];
    cardSheen: readonly [string, string];
    overlay: readonly [string, string];
    sheet: readonly [string, string];
    neonSoft: readonly [string, string];
  };
  /** Maplibre style for this mode */
  mapStyle: object | string;
}

// ─── Midnight (dark, the signature mode) ─────────────────────────────────────

export const Midnight: Palette = {
  mode: 'dark',

  ink: {
    950: '#060709',
    900: '#0A0C11',
    800: '#10131A',
    700: '#151923',
    600: '#1C212C',
    500: '#252B39',
  },

  brass: {
    200: '#F6E3B4',
    300: '#EFD08A',
    400: '#E2B64F',
    500: '#C99A33',
    600: '#A67C24',
    700: '#7C5D1B',
  },

  neon: {
    300: '#7CF5CE',
    400: '#46E5AC',
    500: '#1FC98D',
    glow: 'rgba(70, 229, 172, 0.30)',
  },

  ivory: '#F2EFE6',
  steel: '#8FB0CC',
  jade: '#4CBB8F',
  crimson: '#E05A4E',
  terracotta: '#D9694F',
  ember: '#E88D3C',

  brand: { primary: '#E2B64F', secondary: '#C99A33', accent: '#F0CE7A' },
  bg: {
    primary: '#0A0C11',
    secondary: '#10131A',
    tertiary: '#1C212C',
    overlay: 'rgba(5, 6, 9, 0.82)',
  },
  map: {
    ownedTile: 'rgba(226, 182, 79, 0.32)',
    enemyTile: 'rgba(224, 90, 78, 0.30)',
    availableTile: 'rgba(70, 229, 172, 0.24)',
    selectedTile: 'rgba(240, 206, 122, 0.55)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.07)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
    brand: 'rgba(226, 182, 79, 0.35)',
    neon: 'rgba(70, 229, 172, 0.45)',
  },
  text: {
    primary: '#F2EFE6',
    secondary: '#A9AFBC',
    muted: '#6B7280',
    inverse: '#16110A',
    brand: '#E2B64F',
  },
  semantic: { success: '#4CBB8F', warning: '#E2B64F', error: '#E05A4E', info: '#8FB0CC' },
  stat: { power: '#D9694F', wealth: '#E2B64F', activity: '#E88D3C', popularity: '#4CBB8F' },
  tier: {
    1: '#8A93A6', 2: '#7FA3C0', 3: '#4CBB8F', 4: '#E2B64F', 5: '#E05A4E', 6: '#F0CE7A',
  },
  medal: { 1: '#F0CE7A', 2: '#C4CBD6', 3: '#C98A5E' },
  gradient: {
    brand: ['#E9C766', '#C99A33'],
    brandVertical: ['#EFD08A', '#B98A24'],
    brandSoft: ['rgba(226,182,79,0.16)', 'rgba(226,182,79,0.04)'],
    dark: ['#151923', '#0A0C11'],
    card: ['#1B2029', '#11141B'],
    cardSheen: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.015)'],
    overlay: ['rgba(5,6,9,0)', 'rgba(5,6,9,0.96)'],
    sheet: ['#161A24', '#0D1017'],
    neonSoft: ['rgba(70,229,172,0.14)', 'rgba(70,229,172,0.03)'],
  },
  mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

// ─── Porcelain (light) ───────────────────────────────────────────────────────

export const Porcelain: Palette = {
  mode: 'light',

  // Inverted ink scale: 900 = canvas … 500 = deepest inset
  ink: {
    950: '#E9E6DD',
    900: '#F4F2EC',
    800: '#FBFAF6',
    700: '#FFFFFF',
    600: '#F1EEE6',
    500: '#E3DFD4',
  },

  brass: {
    200: '#F3E2B8',
    300: '#E5C173',
    400: '#C79A33',   // deepened for AA contrast on light
    500: '#A87E22',
    600: '#8A681C',
    700: '#6E5318',
  },

  neon: {
    300: '#39C893',
    400: '#0FA97A',   // darkened mint for contrast on light
    500: '#0B8A63',
    glow: 'rgba(15, 169, 122, 0.22)',
  },

  ivory: '#1B1E27',     // "ivory" slot = primary text (dark on light)
  steel: '#4E7396',
  jade: '#1E8F66',
  crimson: '#C43F35',
  terracotta: '#B34F3B',
  ember: '#B26314',

  brand: { primary: '#C79A33', secondary: '#A87E22', accent: '#E5C173' },
  bg: {
    primary: '#F4F2EC',
    secondary: '#FBFAF6',
    tertiary: '#FFFFFF',
    overlay: 'rgba(20, 22, 28, 0.45)',
  },
  map: {
    ownedTile: 'rgba(199, 154, 51, 0.30)',
    enemyTile: 'rgba(196, 63, 53, 0.26)',
    availableTile: 'rgba(15, 169, 122, 0.22)',
    selectedTile: 'rgba(168, 126, 34, 0.45)',
  },
  border: {
    subtle: 'rgba(24, 28, 38, 0.07)',
    default: 'rgba(24, 28, 38, 0.12)',
    strong: 'rgba(24, 28, 38, 0.22)',
    brand: 'rgba(168, 126, 34, 0.40)',
    neon: 'rgba(15, 169, 122, 0.45)',
  },
  text: {
    primary: '#1B1E27',
    secondary: '#5A6170',
    muted: '#9298A5',
    inverse: '#FDFCF8',     // text on brass/dark fills
    brand: '#8A681C',
  },
  semantic: { success: '#1E8F66', warning: '#A87E22', error: '#C43F35', info: '#4E7396' },
  stat: { power: '#B34F3B', wealth: '#A87E22', activity: '#B26314', popularity: '#1E8F66' },
  tier: {
    1: '#6E7686', 2: '#4E7396', 3: '#1E8F66', 4: '#A87E22', 5: '#C43F35', 6: '#8A681C',
  },
  medal: { 1: '#A87E22', 2: '#7C8698', 3: '#A96A44' },
  gradient: {
    brand: ['#D9AF4E', '#A87E22'],
    brandVertical: ['#E5C173', '#9A7420'],
    brandSoft: ['rgba(199,154,51,0.16)', 'rgba(199,154,51,0.05)'],
    dark: ['#FFFFFF', '#F1EEE6'],
    card: ['#FFFFFF', '#FBFAF6'],
    cardSheen: ['rgba(24,28,38,0.025)', 'rgba(24,28,38,0)'],
    overlay: ['rgba(20,22,28,0)', 'rgba(20,22,28,0.55)'],
    sheet: ['#FFFFFF', '#F7F5EF'],
    neonSoft: ['rgba(15,169,122,0.12)', 'rgba(15,169,122,0.03)'],
  },
  mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

export const PALETTES = { dark: Midnight, light: Porcelain } as const;
export type ThemeMode = 'dark' | 'light' | 'system';
