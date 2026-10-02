# BuildIran — Design System v2 «Gentleman Neon» (جوهر و برنج، نئون)

**Read this before touching any screen.** Single source of truth for redesign v2. If a screen deviates, the screen is wrong — not the spec.

**What changed in v2:**
1. **Dual theme** — Midnight (dark) + Porcelain (light) behind `useTheme()`. Every screen must be mode-agnostic.
2. **Neon garnish** — one electric mint (`colors.neon`) reserved for LIVE signals. Minimal, thin, glowing.
3. **Motion spec** — important transitions are springs, not timings.
4. **Mobile-first UX** — thumb-zone actions, 44pt targets, floating dock, tighter blocks.

---

## 1. Concept

The desk of a master architect, after dark. Refined ink & ivory, brass metal, one electric mint where the city is alive. A gentleman wears a watch with a faint lume dot — not a light-up jacket. That's our neon.

### The neon rules (memorize)
- **Brass = the hero.** Primary actions, territory, wealth. Unchanged from v1.
- **Neon mint = the live signal, used ONLY on:**
  - active tab indicator line (the floating dock),
  - input focus rings (`Input` already does this),
  - claimable/ready badges (`Badge` default tone),
  - "available / can act now" affordances (claimable mission CTA = `Button variant="neon"`, live stat pulses),
  - the selected building-zone ring on the map.
- **Never neon:** large fills, card backgrounds, text blocks, borders of passive cards, gradients on chrome. If an element isn't telling the player "you can act NOW", it doesn't glow.
- Button gains a `variant="neon"` — use it for the ONE claimable/ready action when it exists (e.g., «دریافت» on claimable missions, «پاداش محله» pill). Otherwise primary stays brass.

### Forbidden
- ❌ Purple/pink/blue accents, `#6C63FF`, `#A78BFA`, `#EC4899`, `#FFD700`, `#34D399`, `#EF4444` as literals
- ❌ Emoji as UI icons (Ionicons + IconPlate only)
- ❌ Static `Colors.*` in converted screens — colors come from `useTheme().colors`
- ❌ Neon on anything passive (see rules above)

---

## 2. Theme architecture

```ts
import { useTheme } from '@/theme/ThemeProvider';
import { Typography, Spacing, Radii, Shadows, Motion } from '@/theme';

const MyScreen = () => {
  const { colors: c, isDark, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  ...
};

const makeStyles = (c: Palette) => StyleSheet.create({ ... });
```

- `colors` — full palette (same token shape as v1 `Colors`, plus `neon` and per-mode `mapStyle`).
- `isDark` — resolved boolean. `preference` / `setPreference('dark'|'light'|'system')` — persist user choice (used by the profile's theme switcher row).
- `Palette` type from `@/theme/palettes`.
- **Pattern:** colors → `makeStyles(c)` in `useMemo`; geometry-only styles may stay module-level. Every converted screen imports NOTHING color-static.
- **Light mode contrast:** in Porcelain, `brass[400]` is deepened for AA; `text.inverse` is near-white (for text ON brass/dark fills); hairlines are dark-alpha. Trust the tokens — never hardcode `#fff`/`#000`.
- Legacy `Colors` export still exists (Midnight) only for un-migrated stragglers; do NOT use it in files you touch.

### Glass recipe (HUD/map chrome)
- Dark: `rgba(10, 12, 16, 0.88)`; Light: `rgba(255, 255, 255, 0.92)` — use `c.isDark` ternary.
- Border: `c.border.subtle`, radius `Radii.lg`, `Shadows.md`. No colored shadows.

---

## 3. Primitives — `src/components/ui/` (all theme-reactive now)

Same set as v1 — `Text, Button, Card, IconPlate, Chip, Input, ProgressBar, StatBar, SegmentedTabs, SectionTitle, EmptyState, Sheet, Badge, LoadingScreen` — plus:

- `Button variant="neon"` (electric mint CTA with soft glow).
- `ProgressBar tone="neon"`, `IconPlate tone="neon"`, `Chip tone="neon"`.
- `Sheet` — improved entrance spring (`Motion.entrance`, damping 18 / stiffness 210), no hook-order traps.
- IconPlate/Chip export `toneOf(c, tone)` helper for custom tinted plates.

---

## 4. Motion spec — «important transitions»

The player should *feel* weight and response. Springs for anything the player causes; timings for ambient.

| Moment | Spec |
|---|---|
| Press (every touchable) | scale 1 → 0.97 → 1, spring `Motion.press` |
| Sheet entrance | translateY 60→0 + opacity, spring `Motion.entrance`; backdrop fades `Motion.durations.normal` |
| Sheet exit | spring with damping 24 (heavier, quicker settle) |
| Tab switch | icon scale pop spring `Motion.tab` (damping 14, stiffness 260); neon indicator present/absent — no slide needed |
| List/card entrance | `FadeInDown` staggered `Motion.stagger(i)` (50ms step), duration `Motion.durations.slow` |
| Stat/XP bars | width spring via `ProgressBar` (900ms cubic-out, 80ms stagger between bars) |
| Screen header | single `FadeInDown` on mount, no per-element jitter |
| Theme switch | root cross-fade 280ms (already in ThemeProvider) |
| Mission claimable CTA | subtle glow pulse allowed (opacity 0.75↔1, 1200ms) — the ONLY looping animation besides the loading ring |
| Numbers | `toLocaleString('fa-IR')` + `tabular-nums`; no count-up unless trivially safe |

Rules: max ONE looping animation per screen. Entrance animations never block interaction (>600ms total). No layout animations on Android (use transform/opacity only).

---

## 5. UX arrangement — mobile-first

- **Thumb zone:** primary actions live at the bottom (Sheet footers, bottom action rows). Destructive/secondary stay away from the thumb arc.
- **Touch targets:** minimum 44×44. Icon plates are visual; wrap them in Pressables with padding if smaller.
- **Floating dock** (done in v2): the tab bar is a floating pill — screens need `paddingBottom: insets.bottom + 110` on scroll content.
- **One scroll, one axis:** no horizontal scroll columns on phones; grids wrap to 2 columns max at 390pt.
- **Card anatomy (fixed):** header row (IconPlate + title + badge) → meta caption → data row (tabular numerals) → action row. Gaps 8/12/16. Card padding 16 (12 inside dense lists).
- **Section rhythm:** `SectionTitle` (kicker + title + rule) between content groups; 24px above, 16px below.
- **Header block per screen:** kicker + title + one-line secondary + (optional) chip row — never taller than ~160pt before content starts.
- **Sheets:** handle visible, title row, body scrollable, footer sticky with the primary action. `maxHeight` ≤ 0.9.
- **RTL:** default right-aligned; coordinates/numbers-LTR runs use `writingDirection: 'ltr'`; nav chevrons point `chevron-back`.

### Iconography map (unchanged from v1)
power `flash` terracotta · wealth `cash` brass · activity `flame` ember · popularity `star` jade · missions `flag` · buildings by type (residential `home` steel, commercial `storefront` brass, industrial `construct` ember, civic jade, military `shield` crimson) · buy `cart` · upgrade `trending-up` · sell `pricetag` · location `location`.

---

## 6. Screen specs (v2 deltas)

### Auth (login/register/forgot)
- v1 layout stands (arch mark, dot-grid, cornerTicks card). Deltas: mode-aware canvas (`c.bg.primary`), dot color `c.border.strong` at low opacity, focus rings now neon (free via Input). Keep one brass primary; Google secondary; guest ghost.

### Map HUD
- Merge chrome density: one glass row (neighborhood pill start + action plates end) + stats panel. StatBars use stat tones; the «پاداش محله» pill becomes `Button variant="neon" size="sm"` when claimable; editor pill stays brass-bordered secondary. Tile panel statuses: available=neon jade family, owned=brass, enemy=crimson.
- Map style follows the theme: map screen passes `colors.mapStyle` to GameMap (dark-matter GL for Midnight, voyager GL for Porcelain).

### Assets / Marketplace / Profile / Leaderboard
- v1 structure stands; convert to `useTheme`, apply card anatomy + motion spec. Profile gains a **theme row** in the account tab: IconPlate `moon`/`sunny`, label «تم روشن/تیره», switch or segmented dark/light/system (three chips) wired to `setPreference`.
- Leaderboard podium stays; medal tones now mode-aware tokens.

### Missions / Build flow / Detail & Institution / Neighborhood family
- v1 structure stands; convert to `useTheme`. Claimable mission CTA = `Button variant="neon" size="sm"`; claimed stays muted. Build affordability = brass; insufficient = ghost disabled. Selected building card = brass border + brandSoft.

---

## 7. Code style for the v2 sweep
- Convert imports: drop `Colors` from `@/theme` usage; add `useTheme` from `@/theme/ThemeProvider`.
- `StyleSheet.create` at module scope ONLY for geometry; colors go through `makeStyles(c)`.
- Keep every public prop/contract. UI only — never touch stores/Supabase/audio/i18n logic.
- Keep `GameAudio` + haptics exactly where they are.
- Run `npx tsc --noEmit 2>&1 | grep <your-files>` at the end; fix ALL errors in YOUR files only.
