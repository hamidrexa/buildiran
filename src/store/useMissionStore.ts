/**
 * BuildIran — Mission Store (v6)
 * Zustand client cache for player_mission_slots.
 * Supabase is the source of truth — this store is a mirror + optimistic layer.
 *
 * Init flow (called on app open):
 *   1. Call `ensure_player_missions` RPC — lazy-generates daily/weekly/story slots
 *   2. Call `get_player_missions` RPC — fetches all active/completed slots
 *   3. Subscribe to Realtime on player_mission_slots filtered by player_id
 *
 * Realtime updates: trigger fires advance_mission_progress → DB row updated →
 *   Realtime pushes UPDATE event → store merges it → badge + progress bar refresh.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { GameAudio } from '@/lib/audio';
import type {
  MissionSlot,
  MissionDefinition,
  MissionReward,
  ClaimMissionResult,
} from '@/types/missions.types';

// ─── DB Row Mappers ────────────────────────────────────────────────────────────

function dbRowToDefinition(row: Record<string, any>): MissionDefinition {
  return {
    id: row.id,
    category: row.category,
    chainCode: row.chain_code ?? null,
    chainStep: row.chain_step ?? null,
    titleFa: row.title_fa,
    descriptionFa: row.description_fa,
    objectives: row.objectives ?? [],
    rewards: row.rewards ?? {},
    filters: row.filters ?? null,
    validFrom: row.valid_from ?? null,
    validUntil: row.valid_until ?? null,
    icon: row.icon ?? '🎯',
    sortOrder: row.sort_order ?? 0,
  };
}

function dbRowToSlot(row: Record<string, any>): MissionSlot {
  return {
    id: row.id,
    playerId: row.player_id,
    missionDefId: row.mission_def_id,
    periodKey: row.period_key,
    progress: row.progress ?? {},
    status: row.status,
    completedAt: row.completed_at ?? null,
    claimedAt: row.claimed_at ?? null,
    unlockedAt: row.unlocked_at,
    definition: row.definition ? dbRowToDefinition(row.definition) : undefined,
  };
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MissionState {
  /** All player mission slots keyed by slot ID */
  slots: Record<string, MissionSlot>;
  isLoading: boolean;
  error: string | null;
  /** IDs of slots that just became claimable (for toast) */
  recentlyCompleted: string[];

  // ─── Computed ──────────────────────────────────────────────────────────────
  /** Count of slots in status=completed (reward not yet claimed) */
  claimableCount: number;

  // ─── Actions ───────────────────────────────────────────────────────────────
  /** Bootstrap: ensure + fetch + subscribe. Call once after player loads. */
  init: (playerId: string) => Promise<void>;
  /** Claim reward for a completed slot. Returns RPC result. */
  claimReward: (slotId: string) => Promise<ClaimMissionResult>;
  /** Record a neighborhood visit (viewport or GPS). Advances explore objectives. */
  recordNeighborhoodVisit: (neighborhoodId: string) => Promise<void>;
  /** Clear the recentlyCompleted queue after toast is shown. */
  clearRecentlyCompleted: () => void;
  /** Cleanup Realtime subscription */
  unsubscribe: () => void;
  /** Force-refresh all slots (pull-to-refresh) */
  refresh: (playerId: string) => Promise<void>;
}

// ─── Realtime Channel Ref ─────────────────────────────────────────────────────

let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _visitedNeighborhoods = new Set<string>(); // deduplicate within session

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMissionStore = create<MissionState>((set, get) => ({
  slots: {},
  isLoading: false,
  error: null,
  recentlyCompleted: [],
  claimableCount: 0,

  // ─── init ─────────────────────────────────────────────────────────────────

  init: async (playerId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Lazy-generate missing daily/weekly/story slots for this player
      await supabase.rpc('ensure_player_missions');

      // 2. Fetch all active + completed slots (joined with definition)
      const { data, error } = await supabase.rpc('get_player_missions');
      if (error) throw error;

      const rows = (data as any[]) ?? [];
      const slotMap: Record<string, MissionSlot> = {};
      for (const row of rows) {
        const slot = dbRowToSlot(row);
        slotMap[slot.id] = slot;
      }

      const claimableCount = Object.values(slotMap).filter(
        (s) => s.status === 'completed'
      ).length;

      set({ slots: slotMap, claimableCount, isLoading: false });

      // 3. Subscribe to Realtime updates on this player's slots
      if (_realtimeChannel) {
        supabase.removeChannel(_realtimeChannel);
      }

      _realtimeChannel = supabase
        .channel(`missions:${playerId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'player_mission_slots',
            filter: `player_id=eq.${playerId}`,
          },
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload as any;

            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              // Re-fetch definition for this slot since Realtime doesn't JOIN
              supabase
                .rpc('get_mission_slot', { p_slot_id: newRow.id })
                .then(({ data: slotData }) => {
                  if (!slotData) return;
                  const updated = dbRowToSlot(slotData as any);
                  const prev = get().slots[updated.id];

                  set((state) => {
                    const next = { ...state.slots, [updated.id]: updated };
                    const claimableCount = Object.values(next).filter(
                      (s) => s.status === 'completed'
                    ).length;

                    // Queue toast if this slot just became completed
                    const justCompleted =
                      prev?.status === 'active' && updated.status === 'completed';

                    return {
                      slots: next,
                      claimableCount,
                      recentlyCompleted: justCompleted
                        ? [...state.recentlyCompleted, updated.id]
                        : state.recentlyCompleted,
                    };
                  });
                });
            } else if (eventType === 'DELETE') {
              const id = oldRow?.id;
              if (!id) return;
              set((state) => {
                const next = { ...state.slots };
                delete next[id];
                const claimableCount = Object.values(next).filter(
                  (s) => s.status === 'completed'
                ).length;
                return { slots: next, claimableCount };
              });
            }
          }
        )
        .subscribe();
    } catch (err: any) {
      console.warn('[MissionStore] init error:', err?.message ?? err);
      set({ isLoading: false, error: err?.message ?? 'خطای ناشناخته' });
    }
  },

  // ─── claimReward ──────────────────────────────────────────────────────────

  claimReward: async (slotId: string): Promise<ClaimMissionResult> => {
    // Optimistic: mark as claimed immediately
    set((state) => {
      const slot = state.slots[slotId];
      if (!slot) return {};
      const next = {
        ...state.slots,
        [slotId]: { ...slot, status: 'claimed' as const, claimedAt: new Date().toISOString() },
      };
      const claimableCount = Object.values(next).filter(
        (s) => s.status === 'completed'
      ).length;
      return { slots: next, claimableCount };
    });

    try {
      const { data, error } = await supabase.rpc('claim_mission_reward', {
        p_slot_id: slotId,
      });
      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        GameAudio.playApprove();
      } else {
        // Rollback optimistic update
        set((state) => {
          const slot = state.slots[slotId];
          if (!slot) return {};
          const next = {
            ...state.slots,
            [slotId]: { ...slot, status: 'completed' as const, claimedAt: null },
          };
          const claimableCount = Object.values(next).filter(
            (s) => s.status === 'completed'
          ).length;
          return { slots: next, claimableCount };
        });
        GameAudio.playError?.();
      }

      return {
        success: result?.success ?? false,
        rewards: result?.rewards,
        nextSlotId: result?.next_slot_id,
        error: result?.error,
      };
    } catch (err: any) {
      console.warn('[MissionStore] claimReward error:', err?.message ?? err);
      // Rollback
      set((state) => {
        const slot = state.slots[slotId];
        if (!slot) return {};
        const next = {
          ...state.slots,
          [slotId]: { ...slot, status: 'completed' as const, claimedAt: null },
        };
        const claimableCount = Object.values(next).filter(
          (s) => s.status === 'completed'
        ).length;
        return { slots: next, claimableCount };
      });
      return { success: false, error: err?.message ?? 'network_error' };
    }
  },

  // ─── recordNeighborhoodVisit ──────────────────────────────────────────────

  recordNeighborhoodVisit: async (neighborhoodId: string) => {
    // Deduplicate: only call once per neighborhood per session
    if (_visitedNeighborhoods.has(neighborhoodId)) return;
    _visitedNeighborhoods.add(neighborhoodId);

    try {
      await supabase.rpc('record_neighborhood_visit', {
        p_neighborhood_id: neighborhoodId,
      });
    } catch (err) {
      console.warn('[MissionStore] recordNeighborhoodVisit error:', err);
    }
  },

  // ─── clearRecentlyCompleted ───────────────────────────────────────────────

  clearRecentlyCompleted: () => set({ recentlyCompleted: [] }),

  // ─── unsubscribe ──────────────────────────────────────────────────────────

  unsubscribe: () => {
    if (_realtimeChannel) {
      supabase.removeChannel(_realtimeChannel);
      _realtimeChannel = null;
    }
  },

  // ─── refresh ──────────────────────────────────────────────────────────────

  refresh: async (playerId: string) => {
    set({ isLoading: true });
    try {
      await supabase.rpc('ensure_player_missions');
      const { data, error } = await supabase.rpc('get_player_missions');
      if (error) throw error;

      const rows = (data as any[]) ?? [];
      const slotMap: Record<string, MissionSlot> = {};
      for (const row of rows) {
        const slot = dbRowToSlot(row);
        slotMap[slot.id] = slot;
      }
      const claimableCount = Object.values(slotMap).filter(
        (s) => s.status === 'completed'
      ).length;
      set({ slots: slotMap, claimableCount, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.message ?? 'خطا' });
    }
  },
}));
