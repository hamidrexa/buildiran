/**
 * BuildIran — Design System «Gentleman Neon» (v2)
 * ────────────────────────────────────────────────────────────────
 * THE DESK OF A MASTER ARCHITECT, AFTER DARK.
 * Refined ink & ivory, brass metal, one electric mint for live signals.
 * Two palettes — Midnight (dark) and Porcelain (light) — behind `useTheme()`.
 *
 * Rules:
 *   1. Brass is the hero accent. Neon mint is the live signal. Never compete.
 *   2. Neon = 1.5px glowing lines + soft glows on SMALL elements only
 *      (active tab indicator, focus rings, claimable badges, live stats).
 *   3. Depth comes from layering, never from colored glow (brass CTA excepted).
 *   4. Numbers first: extrabold, tabular, fa-IR.
 *   5. Icons = Ionicons in IconPlates. Emoji never in UI chrome.
 *
 * COLOR rule for screens: colors come from `const { colors } = useTheme()`.
 * `Colors` below is the Midnight palette kept as a legacy fallback so
 * un-migrated files still render correctly in the signature dark mode.
 * GEOMETRY & MOTION (Spacing/Radii/Shadows/Motion) are mode-independent.
 */

import { PALETTES, Midnight, Porcelain } from './palettes';
import { ThemeProvider, useTheme } from './ThemeProvider';
import {
  Typography,
  Spacing,
  Radii,
  Shadows,
  NeonGlow,
  Motion,
  AnimationDurations,
} from './tokens';

export {
  Typography,
  Spacing,
  Radii,
  Shadows,
  NeonGlow,
  Motion,
  AnimationDurations,
};

export { PALETTES, Midnight, Porcelain, ThemeProvider, useTheme };
export type { Palette, ThemeMode } from './palettes';

/**
 * Legacy fallback: the Midnight palette as a static object.
 * New/converted code must use `useTheme().colors` instead.
 */
export const Colors = Midnight;

const Theme = {
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  NeonGlow,
  AnimationDurations,
  Motion,
  PALETTES,
};

export default Theme;
