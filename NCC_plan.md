# Neighborhood Community Center (NCC) Implementation Plan

This document outlines the technical implementation for the Neighborhood Community Center (NCC) system. It addresses database schema updates, business logic through Supabase RPCs, state management via Zustand, and the UI/UX presentation.

## User Review Required

> [!IMPORTANT]
> **Data Modeling for Members**: The requirement states "a new column for foreignkey to members and chair of council of NCC... for speedy reach". In PostgreSQL, we can use an array column `council_member_ids UUID[]` directly on the `neighborhoods` table, or we can use a separate relational table `neighborhood_council_members` and a `council_chair_id` column. A separate relational table is much better for things like storing votes for the chairman, join dates, and ensuring data consistency. 
> *My recommendation is to use a separate table for the members to allow storing extra metadata (like who they voted for as chair), while keeping `council_chair_id` on the `neighborhoods` table for quick access.*

## Open Questions

> [!WARNING]
> 1. **Chairman Selection Mechanism**: You mentioned "the chairman is selected by members". How should this work? Should members actively vote for a chairman via a new UI button, or should the chairman be automatically selected based on the highest power/popularity among the 5 members?
> 2. **Application Cost**: You mentioned that "every request to NCC council member have cost (player should pay before request)". What is the standard cost for this? (e.g., 10,000 Cash, or should it depend on the neighborhood?)
> 3. **Neighborhood Area Calculation**: I will calculate the area as $A = \pi \times r^2$ based on the existing `radius_km` of the neighborhood and store it in a new column `area_sqkm`. Is this correct?

---

## Proposed Changes

### Database Schema (Supabase)

We will introduce a new migration file: `ncc_council_migration.sql`.

#### [NEW] `ncc_council_migration.sql`
- **Alter `neighborhoods` table:**
  - `area_sqkm DOUBLE PRECISION` (Calculated using `pi * radius_km^2`)
  - `council_member_capacity INTEGER DEFAULT 5`
  - `min_council_popularity INTEGER DEFAULT 50` (variable threshold)
  - `council_chair_id UUID REFERENCES public.profiles(id)`
- **Create `neighborhood_council_members` table:**
  - `neighborhood_id TEXT REFERENCES public.neighborhoods(id)`
  - `player_id UUID REFERENCES public.profiles(id)`
  - `voted_for_chair_id UUID REFERENCES public.profiles(id)` (if we go with active voting)
  - `joined_at TIMESTAMPTZ`
  - PRIMARY KEY: `(neighborhood_id, player_id)`
- **Supabase RPC `request_council_membership(p_neighborhood_id TEXT)`:**
  1. Deduct the application fee from the player's cash.
  2. **Cleanup Phase:** Iterate through current members of the neighborhood. Check if they still have a residential building (type `house`, `villa`, `main_house`, `resident_house`) in the neighborhood. Remove any members who no longer meet this criteria.
  3. **Evaluation Phase:** Check if the applicant meets the `min_council_popularity` and owns a residential building in the neighborhood.
  4. If eligible and there are fewer than `council_member_capacity` members, add the player.
  5. If full, find the current member with the **lowest power**. If the applicant has **more power** than the lowest power member, remove the lowest member and add the applicant. Otherwise, reject the application.
  6. **Chairman re-evaluation:** If the chairman is removed, reset `council_chair_id`.

---

### State Management (Zustand)

#### [MODIFY] `src/store/useNeighborhoodStore.ts`
- Add state variables to track council members for the current neighborhood.
- Add actions to fetch council members, fetch the chairman, and submit a council application.
- Expose the `request_council_membership` function to components.

#### [MODIFY] `src/types/game.types.ts`
- Update `Neighborhood` interface to include `areaSqkm`, `councilMemberCapacity`, `minCouncilPopularity`, and `councilChairId`.
- Add new interface `CouncilMember`.

---

### UI/UX Design

To explain the logic clearly and provide a premium, engaging experience:

#### [NEW] `src/components/game/NCCDashboardModal.tsx`
This will be a dedicated modal accessible when tapping on the NCC marker on the map.
- **Header:** Premium glassmorphism design showing the Neighborhood Name, Area (`area_sqkm`), and the total population/player count.
- **Chairman Banner:** A prominent banner showing the current Chairman, their Avatar, and their Power/Popularity stats. If there is no chairman, it shows an "Awaiting Election" placeholder.
- **Council Members Roster:** A sleek, horizontal scroll view or list of the 5 council slots. 
  - Filled slots show the member's details and their power.
  - The member with the lowest power has a subtle highlight (e.g., an "At Risk" badge) so potential applicants know who they would be replacing.
- **Application Section:**
  - Clear breakdown of eligibility requirements:
    1. 🏘️ Own a home in the neighborhood (Checkmark/Cross)
    2. 🌟 Minimum Popularity of `min_council_popularity` (Progress Bar)
    3. ⚔️ Power greater than the lowest current member (if full).
  - A prominent "Apply for Council" button showing the required Cash cost.
  - Micro-animations (success checkmarks, smooth expanding lists) to make the evaluation logic clear.

#### [MODIFY] `src/components/map/GameMap.tsx` & `src/components/game/BuildingMarker.tsx`
- Ensure the NCC location (`community_center_lat`, `community_center_lot`) is rendered on the map with a unique, standout 3D icon (e.g., a glowing town hall icon) to distinguish it from regular buildings.
- Tapping the icon opens the `NCCDashboardModal`.

## Verification Plan

### Automated/Database Tests
- Run the migration script locally and verify tables and columns are created.
- Test the `request_council_membership` RPC via Supabase dashboard with mock users:
  1. Test successful join (empty slots).
  2. Test rejection due to lack of home or popularity.
  3. Test successful replacement of lowest power member.
  4. Test lazy cleanup (member loses home, applicant applies -> member is removed).

### Manual Verification
- Open the web app, navigate to a neighborhood, and open the NCC modal.
- Verify UI accurately reflects eligibility status.
- Apply for the council and verify the DB state and UI updates correctly.
- Verify that standard game audio plays on success/failure.
