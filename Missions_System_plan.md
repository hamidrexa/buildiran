# Missions / Quests System — BuildIran

## Background

BuildIran is an Expo/React Native + Supabase strategy game (RTL Persian). We're adding a full, data-driven missions system across 6 categories, 8 story chains, a server-authoritative progress engine, lazy daily/weekly generation per power tier, and a complete UI surface that fits the dark glassmorphism aesthetic.

---

## User Review Required

> [!IMPORTANT]
> **Server-authoritative progress only.** All progress is updated by PostgreSQL triggers fired on authoritative tables (`assets`, `asset_listings`, `service_transactions`, `npcs`, `npc_assignments`, `profiles`). The client never directly increments mission progress. This removes the game_events spoofing attack surface entirely.

> [!IMPORTANT]
> **SECURITY DEFINER claim RPC.** Reward grants happen only inside `claim_mission_reward` — a row-locked, idempotent, SECURITY DEFINER function. Double-tapping claim is safe.

> [!WARNING]
> **No cron per player.** Daily/weekly missions are **lazily generated** when the player opens the app (`ensure_player_missions` RPC). They are identical for all players in the same power tier and in the same Tehran period. This avoids fan-out crons.

> [!CAUTION]
> **Breaking change on game_events RLS** — the plan tightens RLS on `game_events` so clients can no longer insert rows. If any screen currently relies on client-inserted game_events for display-only purposes, those must be ported to read from mission progress instead.

---

## Open Questions

> [!NOTE]
> **Neighborhood-scoped missions**: For "build 1 café in neighborhood X" objectives, we need the player's built asset to carry `neighborhood_id`. Currently `assets.neighborhood_id` exists (nullable). This plan assumes it is populated correctly by the build RPC. Confirm?

> [!NOTE]
> **Event / Seasonal category**: The plan creates the full data model and UI card, but seeding live seasonal events is left to manual DB inserts. The client automatically shows them when `valid_from ≤ now ≤ valid_until`. Is that acceptable?

> [!NOTE]
> **Location-based missions — player GPS**: "Explore neighborhood X" objectives check if the player's map viewport center has entered the neighborhood bounding radius at least once. We track this via a dedicated `rpc: record_neighborhood_visit` call from the client-side `useViewportTracker` hook (which already runs). Is checking viewport center sufficient, or do you want GPS permission required?

---

## Architecture Overview

```
mission_definitions      ← JSONB data rows (objectives[], rewards{}, filters{})
    ↓ seeded once
player_mission_slots     ← one row per (player, period_key, mission_def) — lazy generated
    ↓ progress column (JSONB)
authoritative triggers   ← on assets, asset_listings, service_transactions, npcs, profiles
    ↓ call advance_mission_progress()
claim_mission_reward()   ← SECURITY DEFINER, idempotent, grants rewards + unlocks next chain step
```

---

## Proposed Changes

### SQL Migration: `missions_migration.sql` [NEW]

Idempotent; runs after `npc_workers_migration.sql` + `neighborhood_power_economy_migration.sql`.

#### Tables

| Table | Purpose |
|-------|---------|
| `mission_definitions` | All mission templates. JSONB `objectives`, `rewards`, `filters`. |
| `player_mission_slots` | One slot per player × mission × period. Holds `progress` JSONB, `status`, claimed_at. |
| `mission_neighborhood_visits` | Tracks "visited neighborhood X" for location-based objectives. |

**`mission_definitions` columns:**
- `id UUID PK`
- `category TEXT` — `daily | weekly | achievement | story | event | location`
- `chain_code TEXT` — for story chains (e.g. `citizen_start`)
- `chain_step INTEGER` — 1-based; step N+1 hidden until step N claimed
- `title_fa TEXT`
- `description_fa TEXT`
- `objectives JSONB` — array of `{ type, target_value, filter? }`
- `rewards JSONB` — `{ cash?, power?, popularity?, activity? }`
- `filters JSONB` — `{ min_tier?, max_tier?, neighborhood_id? }`
- `valid_from TIMESTAMPTZ` — for events
- `valid_until TIMESTAMPTZ` — for events
- `icon TEXT` — emoji
- `sort_order INTEGER`

**`player_mission_slots` columns:**
- `id UUID PK`
- `player_id UUID FK profiles`
- `mission_def_id UUID FK mission_definitions`
- `period_key TEXT` — `"daily:2026-09-19"` / `"weekly:2026-W38"` / `"always"` / event ID
- `progress JSONB` — `{ "0": 3, "1": 1 }` indexed by objective position
- `status TEXT` — `active | completed | claimed | expired`
- `completed_at TIMESTAMPTZ`
- `claimed_at TIMESTAMPTZ`
- `unlocked_at TIMESTAMPTZ DEFAULT now()`
- `UNIQUE(player_id, mission_def_id, period_key)`

#### RPCs

| RPC | Purpose |
|-----|---------|
| `ensure_player_missions(p_player_id)` | Lazy-generate daily/weekly/story/achievement slots for the player. Called on app open. |
| `advance_mission_progress(p_player_id, p_objective_type, p_filter, p_increment)` | Called by triggers. Finds matching active slots and increments progress. |
| `claim_mission_reward(p_slot_id)` | SECURITY DEFINER. Atomic reward grant + chain unlock + idempotency guard. |
| `record_neighborhood_visit(p_neighborhood_id)` | Called by client viewport tracker. Fires `advance_mission_progress` for `explore_neighborhood` objectives. |
| `get_player_missions(p_player_id)` | Returns all active + completed (claimable) slots joined with definition metadata. Used on first load; Realtime handles updates. |

#### Triggers (on authoritative tables)

| Table | Event | Objective types advanced |
|-------|-------|--------------------------|
| `assets` | INSERT | `build_type`, `build_in_neighborhood`, `build_count_any` |
| `assets` | UPDATE level | `upgrade_building` |
| `asset_listings` | INSERT | `list_asset_for_sale` |
| `asset_listings` | UPDATE status=sold | `sell_asset`, `earn_from_sale` |
| `service_transactions` | INSERT | `use_service`, `provide_service`, `earn_from_services` |
| `npcs` | INSERT | `hire_npc` |
| `npc_assignments` | UPDATE status=approved | `assign_npc` |
| `npc_training_sessions` | INSERT | `train_npc` |
| `profiles` | UPDATE power | `reach_power`, `reach_tier` |

#### Objective Types (JSONB `type` field values)

```
build_type                 filter: { building_type }
build_in_neighborhood      filter: { building_type?, neighborhood_id }
build_count_any            (no filter)
upgrade_building           filter: { building_type? }
list_asset_for_sale
sell_asset
earn_from_sale             filter: { min_price? }
use_service                filter: { institution_type? }
provide_service            filter: { institution_type? }
earn_from_services
hire_npc
assign_npc
train_npc
reach_power                target_value: power threshold
reach_tier                 target_value: tier number
explore_neighborhood       filter: { neighborhood_id }
```

#### Seed Missions (inline in migration)

**Story chain: `citizen_start` (Citizen Onboarding)**
1. Step 1 — بساز اولین خانه‌ات (`build_type: house`, ×1) → reward: 500 cash
2. Step 2 — اولین ملکت را بفروش (`list_asset_for_sale`, ×1) → reward: 200 cash + 3 power
3. Step 3 — از یک خدمات استفاده کن (`use_service`, ×1) → reward: 5 power + 100 cash
4. Step 4 — به قدرت ۲۰ برس (`reach_power`, target=20) → reward: 10 power + 500 cash

**Achievement examples:**
- سازنده نخستین (`build_type: house`, ×1) — unlocked for all
- تاجر بزرگ (`sell_asset`, ×5) — unlocked for all
- قهرمان محله (`build_in_neighborhood`, ×10 any neighborhood)

**Daily examples (tier 1):**
- ۲ سرویس امروز (`use_service`, ×2) → 50 cash + 2 power
- یک بنا بساز (`build_count_any`, ×1) → 100 cash + 3 power

**Weekly examples (tier 1):**
- ۵ معامله این هفته (`sell_asset` OR `use_service`, ×5) → 500 cash + 10 power

**Location-based examples:**
- کاوشگر محله (`explore_neighborhood`, filter: neighborhood_id=X)
- سازنده محله ولنجک (`build_in_neighborhood`, filter: neighborhood_id=Y, building_type=cafe`)

---

### TypeScript Types: `src/types/missions.types.ts` [NEW]

```ts
export type MissionCategory = 'daily' | 'weekly' | 'achievement' | 'story' | 'event' | 'location';
export type MissionStatus = 'active' | 'completed' | 'claimed' | 'expired' | 'locked';

export interface MissionDefinition { ... }
export interface MissionSlot { ... }        // player_mission_slots row + joined definition
export interface MissionObjective { ... }   // JSONB objective shape
export interface MissionReward { ... }      // JSONB reward shape
```

---

### Zustand Store: `src/store/useMissionStore.ts` [NEW]

State:
- `slots: Record<string, MissionSlot>` — keyed by slot ID
- `isLoading: boolean`
- `claimableCount: number` — computed from slots (status=completed)

Actions:
- `init(playerId)` — calls `ensure_player_missions` RPC + `get_player_missions` + subscribes to Realtime on `player_mission_slots` filtered by `player_id`
- `claimReward(slotId)` — calls `claim_mission_reward` RPC, optimistic update, plays `GameAudio.playApprove()`
- `recordVisit(neighborhoodId)` — calls `record_neighborhood_visit` RPC
- Realtime handler: `UPDATE` on `player_mission_slots` → merge into state, trigger badge refresh + completion toast

---

### UI Components

#### `src/components/game/MissionsPanel.tsx` [NEW]
Full-screen bottom sheet (modal) with:
- Tab bar: روزانه / هفتگی / داستان / دستاوردها / رویدادها / مکان‌محور
- Per-tab: scrollable list of `MissionCard` components
- Story chain rendered as a vertical timeline; locked steps shown as dimmed with lock icon
- Pull-to-refresh calls `init()` again

#### `src/components/game/MissionCard.tsx` [NEW]
- Glassmorphism card with mission icon, title, description
- Progress bar (current / target) per objective
- Reward chips (cash 💰 / power ⚔️ / popularity ⭐)
- "دریافت جایزه" button when status=completed, disabled when claimed/expired
- Shimmer/pulse animation on claimable cards
- Category badge (color-coded pill)

#### `src/components/game/MissionCompletionToast.tsx` [NEW]
- Animated overlay: slides in from top, auto-dismisses after 3s
- Shows mission icon, title, reward summary
- Calls `GameAudio.playLevelup()` on show

#### HUD Badge — modify `src/components/game/HUD.tsx` [MODIFY]
- Add a 🎯 missions button in the sub-bar
- Shows a red badge counter when `claimableCount > 0`
- Tapping opens `MissionsPanel`

---

### i18n: `src/i18n/fa.ts` [MODIFY]
Add `missions` namespace:
```ts
missions: {
  title: 'مأموریت‌ها',
  tabs: { daily, weekly, story, achievement, event, location },
  status: { active, completed, claimed, expired, locked },
  claimReward: 'دریافت جایزه',
  // ...
}
```

---

### App Integration: `src/app/(game)/index.tsx` [MODIFY]
- Import `useMissionStore` and call `init(player.id)` inside the existing `useEffect` after player is loaded
- Render `<MissionsPanel>` and `<MissionCompletionToast>` alongside existing modals

---

## What's Skipped / Deferred

| Feature | Reason |
|---------|--------|
| Full-screen story chain cinematics | Out of scope for v1 |
| Push notifications on mission completion | Requires Expo Notifications setup |
| Admin UI for seeding missions | Manual SQL for now |
| `trader` / `industrialist` full story chains | Only `citizen_start` is seeded; other chain definitions are stubbed |
| Seasonal event scheduling automation | Events seeded manually via SQL INSERT |
| GPS-gated location missions (require device GPS, not just viewport) | Viewport center used instead |

---

## Verification Plan

### Automated
- Manual SQL `SELECT` checks in Supabase SQL editor to confirm trigger fires and progress advances
- Test `claim_mission_reward` twice on same slot — second call must return `already_claimed`
- Test daily period key generation in Asia/Tehran timezone

### Manual
- Build a `house` → verify citizen_start step 1 completes
- Claim reward → verify cash/power updated in profiles
- Open missions panel → verify correct tabs, correct progress bars
- Claimable badge count visible on HUD
- Completion toast appears and auto-dismisses
- Test on Android, iOS, and Web
