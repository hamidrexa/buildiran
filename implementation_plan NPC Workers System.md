# NPC Workers System — BuildIran

A comprehensive NPC workforce system. Players own and manage NPC workers who are assigned to businesses, earn XP, level up through institutional training, and passively grow the player's `activity` score even while offline.

---

## Background

The existing system has:
- `assets` table — buildings on the map (businesses, houses, etc.)
- `profiles` table — 4-factor stats: `power`, `wealth`, `activity`, `popularity`
- `INSTITUTION_DEFINITIONS` — businesses like gym, university, hospital that already grant skill boosts
- `game_events` — append-only audit log

The NPC system hooks deeply into this existing economy: workers train at existing institution types, housing extends the existing `assets` table with new building types, and activity accrual leverages the existing `incrementActivity` pattern.

---

## User Review Required

> [!IMPORTANT]
> **New building types added to `assets.type`**: `main_house` and `resident_house`. These extend `StandardBuildingType` and fit naturally with the existing `house`/`villa` types but are semantically distinct (personal home vs NPC dormitory).

> [!IMPORTANT]
> **Activity accrual while offline**: A `pg_cron` job (runs every 15 minutes) ticks `activity += active_npc_count * 0.25` for all players who have working NPCs. This keeps the offline progression loop consistent with the existing `daily_power_drip` cron pattern.

> [!WARNING]
> **Cross-player NPC assignment requires an approval flow** — a pending/approved/rejected state on `npc_assignments`. Business owners must explicitly accept another player's NPCs.

---

## Open Questions

> [!NOTE]
> **Resident house capacity formula** I propose:
> `capacity = (tier^2) * area_factor` where:
> - tier 1 (basic) = 4 slots, tier 2 = 9, tier 3 = 16, tier 4 = 25
> - area_factor: small=1x, medium=1.5x, large=2x (rounded down)
> This is stored as `max_capacity` on the `assets` row for `resident_house` type buildings, computed at build time.

> [!NOTE]
> **NPC hiring cost** I propose: base cost = 500 cash, scales by `npc_class` multiplier (worker×1, foreman×3, engineer×5, doctor×8, specialist×6, physician×10).

---

## Proposed Changes

### Database Migration (`npc_workers_migration.sql`) [NEW]

#### Tables

**`npc_classes`** — lookup table for class definitions
```
id, code (worker/foreman/engineer/doctor/specialist/physician), name_fa, base_hiring_cost, max_level, activity_contribution
```

**`npcs`** — one row per NPC owned by a player
```
id UUID, owner_id → profiles, name_fa TEXT, class TEXT (CHECK), level INTEGER (1–10),
experience INTEGER, specialty TEXT[], current_business_asset_id → assets (NULL if idle),
home_asset_id → assets (must be resident_house), is_working BOOLEAN, hired_at, last_worked_at
```

**`npc_assignments`** — cross-player NPC loan to a business
```
id UUID, npc_id → npcs, business_asset_id → assets, requester_id → profiles,
business_owner_id → profiles, status (pending/approved/rejected/revoked),
requested_at, responded_at
```

**`npc_training_sessions`** — record of NPC attending an institution
```
id UUID, npc_id → npcs, institution_asset_id → assets, institution_type TEXT,
xp_gained INTEGER, specialty_learned TEXT (NULL if no new specialty), started_at, completed_at
```

#### Profile & Asset changes
- `profiles`: add `active_npc_count INTEGER DEFAULT 0` — cached count of actively working NPCs (updated by trigger)
- `assets`: add `max_capacity INTEGER DEFAULT 0` for `resident_house` type; `current_worker_count INTEGER DEFAULT 0`
- New building types in assets.type CHECK: `main_house`, `resident_house`

#### RPCs (Security Definer)

| Function | Description |
|---|---|
| `hire_npc(p_class, p_name_fa, p_home_asset_id)` | Validates player has main_house, deducts cash, inserts NPC row |
| `assign_npc_to_business(p_npc_id, p_business_asset_id)` | Creates pending `npc_assignments` row; fires if same owner, auto-approves |
| `respond_to_npc_request(p_assignment_id, p_accept)` | Business owner approves/rejects |
| `train_npc(p_npc_id, p_institution_asset_id)` | Charges client cost, awards XP + possible specialty to NPC |
| `tick_npc_activity()` | pg_cron: activity += working NPC count × 0.25, update `active_npc_count` |
| `build_resident_house(p_asset_id)` | Computes and sets `max_capacity` after build |

#### Triggers
- After INSERT/UPDATE on `npcs` where `is_working` changes → update `profiles.active_npc_count`
- After INSERT/UPDATE on `npc_assignments` where status = 'approved' → set `npcs.is_working = true`

#### RLS
- `npcs`: owner can CRUD own NPCs; all can SELECT (for assignment requests)
- `npc_assignments`: requester inserts; business owner updates status; both can read
- `npc_training_sessions`: owner of NPC can insert; all can read

---

### TypeScript Types (`src/types/game.types.ts`) [MODIFY]

Add:
- `NpcClass` union type: `'worker' | 'foreman' | 'engineer' | 'doctor' | 'specialist' | 'physician'`
- `NpcAssignmentStatus`: `'pending' | 'approved' | 'rejected' | 'revoked'`
- `Npc` interface (mirrors DB row with camelCase)
- `NpcAssignment` interface
- `NpcTrainingSession` interface
- Extend `StandardBuildingType` with `'main_house' | 'resident_house'`
- Extend `GameEventType` with `'npc_hired' | 'npc_assigned' | 'npc_trained' | 'npc_leveled_up'`

---

### Constants (`src/lib/constants.ts`) [MODIFY]

Add:
- `NPC_CLASS_CONFIG` — `Record<NpcClass, { nameFa, hiringCost, maxLevel, activityContribution, emoji }>`
- `NPC_TRAINING_INSTITUTIONS` — map of `InstitutionType → { xpPerSession, specialtyPossible }` (e.g. gym → strength specialty, university → tech specialty, hospital → medical specialty)
- `NPC_LEVEL_XP_TABLE` — XP required per level [100, 300, 600, 1200, 2500, 5000, 10000, 20000, 50000, 100000]
- `RESIDENT_HOUSE_CONFIG` — tier/area capacity formula
- `MAIN_HOUSE_CONFIG` — build cost for main_house
- Building configs for `main_house` (cost: 1500, value: 2500, power: 3) and `resident_house` (cost: 2000, value: 3500, power: 2)
- Activity events: `npc_worked: 1`, `npc_trained: 3`, `npc_leveled_up: 10`

---

### NPC Store (`src/store/useNpcStore.ts`) [NEW]

Zustand store managing:
```typescript
interface NpcState {
  npcs: Record<string, Npc>;           // player's NPCs
  assignments: NpcAssignment[];         // pending/active assignments
  pendingRequests: NpcAssignment[];     // requests to MY businesses
  isLoading: boolean;

  // Actions
  fetchMyNpcs(userId: string): Promise<void>;
  fetchAssignments(userId: string): Promise<void>;
  fetchPendingRequests(userId: string): Promise<void>;  // for business owner
  hireNpc(params): Promise<Npc | null>;
  assignNpcToBusiness(npcId, businessAssetId): Promise<boolean>;
  respondToRequest(assignmentId, accept: boolean): Promise<boolean>;
  trainNpc(npcId, institutionAssetId): Promise<{ success, xpGained, specialtyLearned? }>;
  revokeAssignment(assignmentId): Promise<boolean>;
  subscribeToNpcs(): () => void;
}
```
- `dbRowToNpc()` mapper consistent with schema
- Realtime subscription on `npcs` and `npc_assignments` tables
- On `hireNpc`: validates player has a `main_house`, calls `hire_npc` RPC, plays `GameAudio.playBuy()`
- On `trainNpc`: calls `train_npc` RPC, plays `GameAudio.playLevelup()` on XP gain
- On `assignNpcToBusiness`: calls `assign_npc_to_business`, plays `GameAudio.playTap()`

---

### i18n (`src/i18n/fa.ts`) [MODIFY]

Add `npcs` section:
```typescript
npcs: {
  title: 'کارگران',
  hire: 'استخدام کارگر',
  train: 'آموزش',
  assign: 'تخصیص به کسب‌وکار',
  approve: 'تأیید درخواست',
  reject: 'رد درخواست',
  revoke: 'لغو تخصیص',
  classes: { worker: 'کارگر', foreman: 'سرکارگر', engineer: 'مهندس', doctor: 'پزشک', specialist: 'متخصص', physician: 'طبیب' },
  level: 'سطح',
  xp: 'تجربه',
  specialties: 'تخصص‌ها',
  isWorking: 'در حال کار',
  idle: 'بیکار',
  pendingRequests: 'درخواست‌های در انتظار',
  housing: 'مسکن کارگران',
  mainHouse: 'خانه اصلی',
  residentHouse: 'خانه مسکونی کارگران',
  capacity: 'ظرفیت',
  noNpcs: 'هنوز کارگری استخدام نکرده‌اید',
  hireFirst: 'ابتدا خانه اصلی بسازید',
}
```

---

### Workers Screen (`src/app/(game)/workers.tsx`) [NEW]

A full tab screen with 3 internal tabs:
1. **کارگران (My NPCs)** — list of owned NPCs with class, level, XP bar, specialty badges, working status, and action buttons (Assign / Train / Remove)
2. **درخواست‌ها (Requests)** — pending cross-player assignment requests to my businesses; Approve / Reject
3. **مسکن (Housing)** — resident house capacity overview; button to build resident house

Design: dark card grid per NPC, color-coded by class, animated XP progress bar, emoji indicators, consistent with existing screen aesthetics (dark background `#0D0F14`, gold accents `#D4A017`).

---

### Tab Layout (`src/app/(game)/_layout.tsx`) [MODIFY]

Add a 6th tab: **کارگران** with `Ionicons name="people"` icon, pointing to the new `workers` screen.

---

### Building configs additions (`src/store/useAssetStore.ts`) [MODIFY]

Add to `BUILDING_CONFIG`:
```typescript
main_house:     { cost: 1500, value: 2500, power: 3, incomeRate: 10, dailyPowerDrip: 1, institutionType: null },
resident_house: { cost: 2000, value: 3500, power: 2, incomeRate: 5,  dailyPowerDrip: 1, institutionType: null },
```
Add to `BUILDING_LABEL` / `BUILDING_EMOJI` maps in `assets.tsx`.

---

### HUD update (`src/components/game/HUD.tsx`) [MODIFY]

Add NPC activity count to the HUD stats row — show `👷 active_npc_count` to give players live feedback.

---

### AssetDetailModal (`src/components/game/AssetDetailModal.tsx`) [MODIFY]

Add a "Workers" section in the asset detail view: shows current assigned workers, capacity, and a button to request NPC assignment from other players.

---

## Architecture Notes

- **Supabase is the source of truth** — all NPC state mutations go through RPC functions or direct inserts with RLS. Local Zustand state is the mirror.
- **`active_npc_count`** on `profiles` is maintained by a DB trigger (not client-side) to prevent cheating.
- **Activity accrual while offline** uses `pg_cron` (same pattern as `daily_power_drip`) — no client polling needed.
- **Cross-player assignment** requires business owner approval before the NPC `is_working` flag flips — prevents unsolicited NPC spamming.
- **Resident houses require a Main House** — enforced at the RPC level and client-side guard in the build flow.

---

## Verification Plan

### SQL
- Run migration, verify all tables/RPCs/triggers exist
- Test `hire_npc` with no main_house (expect error)
- Test `assign_npc_to_business` cross-player flow (pending → approved)
- Test `train_npc` XP accumulation and level-up

### Client
- Build and launch `npm run dev` (web) — verify Workers tab renders
- Hire an NPC, check Supabase `npcs` table has row
- Assign to own business — should auto-approve
- Train at university — XP should increment, specialty may appear
- Check `profiles.active_npc_count` increments

### Offline Activity
- Confirm `tick_npc_activity` pg_cron SQL increments `activity` correctly when NPCs are working

