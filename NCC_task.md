# NCC (Neighbourhood Community Center) Feature — Task List

## Phase 1: Database / Schema
- [x] Design relational `neighborhood_council_members` table (separate table, FK to profiles & neighborhoods)
- [x] Write `ncc_council_migration.sql` — full schema migration with:
  - `area_sqkm`, `council_member_capacity`, `min_council_popularity`, `council_chair_id`, `last_chair_selection_at` columns on `neighborhoods`
  - `neighborhood_council_members` table with RLS
  - `request_council_membership` RPC (fee deduction, lazy cleanup, power-based replacement)
  - `trigger_chair_selection` RPC (7-day cooldown, highest-power wins)

## Phase 2: Area Calculation
- [x] Create `scripts/generate_area_sql.js` — reads `Tehran Districts.geojson`, outputs `update_neighborhood_areas.sql`
- [x] Verify script generates SQL for 369 neighborhoods
- [ ] **Manual step (user):** Run `ncc_council_migration.sql` in Supabase SQL editor
- [ ] **Manual step (user):** Run `update_neighborhood_areas.sql` in Supabase SQL editor (PostGIS required)

## Phase 3: TypeScript Types
- [x] Add `CouncilMember` interface to `src/types/game.types.ts`
- [x] Add NCC fields to `Neighborhood` interface (`areaSqkm`, `councilMemberCapacity`, `minCouncilPopularity`, `councilChairId`, `lastChairSelectionAt`)
- [x] Add `onPressNCC` to `GameMapProps` in `src/types/map.types.ts`
- [x] Add `'error'` color to `TextColor` in `src/components/ui/Text.tsx`

## Phase 4: State Management (Zustand)
- [x] Add `councilMembers: CouncilMember[]` to `NeighborhoodState`
- [x] Map NCC DB columns in `fetchNeighborhoods`
- [x] Implement `fetchCouncilMembers(neighborhoodId)` — joins profiles table
- [x] Implement `requestCouncilMembership(neighborhoodId)` — calls RPC
- [x] Implement `triggerChairSelection(neighborhoodId)` — calls RPC
- [x] Call `fetchCouncilMembers` on `setCurrentNeighborhood`

## Phase 5: Map Integration
- [x] `GameMap.web.tsx` — add `neighborhoodId` to district feature properties
- [x] `GameMap.web.tsx` — NCC markers are now clickable (call `onPressNCC`)
- [x] `GameMap.native.tsx` — add `neighborhoodId` to district feature properties
- [x] `GameMap.native.tsx` — NCC markers wrapped in `TouchableOpacity` (call `onPressNCC`)

## Phase 6: UI — NCCDashboardModal
- [x] Create `src/components/game/NCCDashboardModal.tsx` with:
  - Chairman banner (gold-themed)
  - Council members list (with "at risk" indicator for lowest-power member)
  - Eligibility checklist for non-members
  - Apply button (50,000 تومان fee, alerts for each failure reason)
  - Election button for members (7-day cooldown, disabled when inactive)
  - Area display (km²)

## Phase 7: Wire-up in Game Screen
- [x] Import `NCCDashboardModal` in `src/app/(game)/index.tsx`
- [x] Add `nccModalVisible` + `selectedNccNeighborhoodId` state
- [x] Add `handlePressNCC` callback (skipped during placement mode)
- [x] Pass `onPressNCC` to `<GameMap />`
- [x] Render `<NCCDashboardModal />` in the game screen JSX

## Phase 8: TypeScript & Build Verification
- [x] Fix `TextColor` missing `'error'` variant (added to Text.tsx)
- [/] Final `tsc --noEmit` check in progress…

## Notes
- Application fee constant: **50,000 Cash** (hardcoded in both RPC and modal)
- Council capacity: **5 members** (default, stored in `neighborhoods.council_member_capacity`)
- Election trigger: manual by any council member, 7-day cooldown enforced by RPC
- Chair selection: purely power-based (highest `power` stat among current members)
- Area calc: requires PostGIS; script maps `area_number + name` → neighborhood `id`
