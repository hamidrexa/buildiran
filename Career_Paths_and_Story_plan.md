# Career Paths & Story Missions — Implementation Plan

This document analyzes the 8 story paths requested and proposes a comprehensive design for the missions, as well as the UI/UX for selecting a path and tailoring the game experience.

## User Review Required

> [!IMPORTANT]
> **Path Exclusivity vs. Focus**: Do you want players to be locked into ONE path at a time (they can switch, but only one is active), OR can they progress all stories simultaneously, but the "Chosen Theme" is just a UI focus preference?
> *Recommendation*: Allow players to progress all chains simultaneously in the background, but let them **"Focus"** on one path in their Profile. The Focused Path changes their UI theme and highlights relevant map elements.

> [!WARNING]
> **Database Changes**: We will need to add a `career_path` column to the `profiles` table to store their selected theme.

## 1. UI/UX: The "Chosen Path" Theme

When a player selects a story path (Career), the game UI will adapt to align with that archetype.

### Features Aligning with the Story:
1. **HUD Accent Color**: The main HUD gradients and badges will shift to match the path's color (e.g., Gold for Real Estate, Green for Industrialist, Blue for Trader).
2. **Map Highlights**: Buildings relevant to the chosen path will have a subtle pulsing glow or marker on the map. (e.g., if you are an Employee, businesses looking for NPCs will be highlighted).
3. **Build Menu Sorting**: The Build Menu will reorder to show buildings relevant to the chosen path at the top.
4. **Path Dashboard**: A new "Career" tab in the Profile screen where players can see their Path level, switch paths, and view their current active story mission for that path.

## 2. Story Mission Designs

Here is the proposed step-by-step mission design for each of the 8 stories. These will be inserted into `mission_definitions` via a new SQL migration.

### 1. Citizen Start (Onboarding)
*Theme Color: Brand Gold*
- **Step 1: The Foundation** - Build your first House. (Reward: Cash)
- **Step 2: Enter the Market** - List an asset for sale. (Reward: Power)
- **Step 3: City Life** - Use a commercial service (Cafe/Shop). (Reward: Popularity)
- **Step 4: Community** - Join a Neighborhood Council (NCC). (Reward: Cash + Power)

### 2. Trader (Trading & Brokerage)
*Theme Color: Azure Blue*
- **Step 1: First Flip** - Buy a property from another player. (Requires new objective `buy_asset`).
- **Step 2: Market Maker** - Sell 3 assets on the marketplace.
- **Step 3: High Roller** - Earn 50,000 Cash from marketplace sales.
- **Step 4: Real Estate Mogul** - Own assets in 3 different neighborhoods.

### 3. Industrialist / Supplier
*Theme Color: Emerald Green*
- **Step 1: Roots of Industry** - Build a Farm.
- **Step 2: Heavy Machinery** - Build a Factory.
- **Step 3: Supply Chain** - Supply a warehouse 5 times (using `farm_supply` or `factory_supply`).
- **Step 4: Industrial Empire** - Reach 150 Power using industrial buildings.

### 4. Product Maker / Producer
*Theme Color: Rust Orange*
- **Step 1: Master Builder** - Complete a building using **Advanced Build Mode**.
- **Step 2: Material Sourcing** - Buy 10 materials from player-run shops.
- **Step 3: Subsidy Independence** - Build a Commercial building without using state subsidies.
- **Step 4: Production Line** - Own 5 commercial or industrial assets.

### 5. Business & Services
*Theme Color: Magenta/Pink*
- **Step 1: Open for Business** - Build a Shop or Cafe.
- **Step 2: Customer Service** - Have 10 players use your services.
- **Step 3: Expansion** - Build a Restaurant or Gym.
- **Step 4: Franchise** - Earn 20,000 Cash purely from service transactions.

### 6. Employee Path (NPC Management)
*Theme Color: Indigo*
- **Step 1: First Hire** - Hire an NPC Worker.
- **Step 2: Skill Building** - Train an NPC in a University or Library.
- **Step 3: Management** - Assign an NPC to work in a business.
- **Step 4: Expert Staff** - Level up an NPC to Level 5.

### 7. Becoming Famous
*Theme Color: Bright Yellow / Star*
- **Step 1: Public Benefactor** - Build a Park.
- **Step 2: Rising Star** - Reach 100 Popularity.
- **Step 3: Civic Duty** - Build a Hospital or University.
- **Step 4: The Mayor** - Get elected as the Chair of a Neighborhood Council.

### 8. Real Estate & Construction
*Theme Color: Silver / Slate*
- **Step 1: Luxury Living** - Build a Villa.
- **Step 2: Sky High** - Build a Tower.
- **Step 3: Neighborhood Developer** - Build 10 assets in a single neighborhood.
- **Step 4: Amenity King** - Help a neighborhood reach Amenity Tier 4.

---

## 3. Implementation Steps

1. **SQL Migration (`story_missions_migration.sql`)**:
   - Add `career_path` to `profiles`.
   - Insert all the mission definitions for the 8 chains.
   - Add new objective types if needed (e.g., `buy_asset`, `reach_popularity`).

2. **Zustand & Types (`usePlayerStore.ts`)**:
   - Add `careerPath` to the player type.
   - Add a `setCareerPath` action.

3. **UI Updates (`HUD.tsx`, `BuildModal.tsx`, `GameMap.tsx`)**:
   - Dynamic colors in HUD based on `player.careerPath`.
   - "Career Path" selection modal.
   - Filter/sort the Build Modal based on the active path.

## Open Questions

1. Do the proposed story steps align with your vision for the game's balance?
2. Should selecting a career path grant a permanent passive buff (e.g., Traders pay less tax, Builders get 10% cheaper materials), or is it purely for UI/UX focus and mission tracking?
