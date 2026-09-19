/**
 * BuildIran — Mission / Quest System Types (v6)
 * Client-side mirrors of mission_definitions + player_mission_slots DB rows.
 */

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type MissionCategory =
  | 'daily'
  | 'weekly'
  | 'achievement'
  | 'story'
  | 'event'
  | 'location';

export type MissionStatus =
  | 'active'      // in progress
  | 'completed'   // all objectives done — reward not yet claimed
  | 'claimed'     // reward granted
  | 'expired'     // daily/weekly period ended without completion
  | 'locked';     // story chain step N+1 hidden until step N claimed

// ─── Objective ────────────────────────────────────────────────────────────────

export type ObjectiveType =
  | 'build_type'
  | 'build_in_neighborhood'
  | 'build_count_any'
  | 'upgrade_building'
  | 'list_asset_for_sale'
  | 'sell_asset'
  | 'earn_from_sale'
  | 'use_service'
  | 'provide_service'
  | 'earn_from_services'
  | 'hire_npc'
  | 'assign_npc'
  | 'train_npc'
  | 'reach_power'
  | 'reach_tier'
  | 'explore_neighborhood'   // viewport-based: map center enters neighborhood radius
  | 'visit_neighborhood_gps'; // GPS-based: device location enters neighborhood radius

export interface MissionObjective {
  type: ObjectiveType;
  /** How many times the action must occur */
  target_value: number;
  /** Optional filters: building_type, neighborhood_id, institution_type, min_price … */
  filter?: Record<string, string | number>;
}

// ─── Reward ───────────────────────────────────────────────────────────────────

export interface MissionReward {
  cash?: number;
  power?: number;
  popularity?: number;
  activity?: number;
}

// ─── Definition (mission_definitions table row) ───────────────────────────────

export interface MissionDefinition {
  id: string;
  category: MissionCategory;
  /** Story / chain identifier, e.g. "citizen_start" */
  chainCode: string | null;
  /** 1-based step within the chain */
  chainStep: number | null;
  titleFa: string;
  descriptionFa: string;
  objectives: MissionObjective[];
  rewards: MissionReward;
  /** min/max power tier; neighborhood_id for location missions */
  filters: Record<string, string | number> | null;
  /** ISO — for event / seasonal missions */
  validFrom: string | null;
  validUntil: string | null;
  /** Emoji used as the mission icon */
  icon: string;
  sortOrder: number;
}

// ─── Slot (player_mission_slots table row + joined definition) ─────────────────

export interface MissionSlot {
  id: string;
  playerId: string;
  missionDefId: string;
  /**
   * "daily:2026-09-19" | "weekly:2026-W38" | "always" | "event:<id>"
   * Tehran timezone (Asia/Tehran), week starts Saturday.
   */
  periodKey: string;
  /** Keyed by objective index (string "0", "1", …) → current count */
  progress: Record<string, number>;
  status: MissionStatus;
  completedAt: string | null;
  claimedAt: string | null;
  unlockedAt: string;
  /** Joined definition — populated by get_player_missions RPC */
  definition?: MissionDefinition;
}

// ─── RPC response shapes ──────────────────────────────────────────────────────

export interface ClaimMissionResult {
  success: boolean;
  rewards?: MissionReward;
  /** ID of the newly unlocked next chain slot, if any */
  nextSlotId?: string;
  error?: string;
}

export interface EnsureMissionsResult {
  success: boolean;
  slotsCreated: number;
}
