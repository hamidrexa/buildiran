/**
 * BuildIran — NPC Workers Zustand Store (v4)
 * Single source of truth (client cache) for the player's NPCs, assignment
 * requests, and training history. All mutations go through Supabase RPCs;
 * this store is the optimistic mirror.
 */

import { supabase } from '@/lib/supabase';
import { GameAudio } from '@/lib/audio';
import type { Npc, NpcAssignment, NpcClass, NpcTrainingSession } from '@/types/game.types';
import { create } from 'zustand';

// ─── DB Row → Type Mappers ────────────────────────────────────────────────────

export function dbRowToNpc(row: Record<string, any>): Npc {
  return {
    id: row.id,
    ownerId: row.owner_id,
    nameFa: row.name_fa,
    class: row.class as NpcClass,
    level: row.level ?? 1,
    experience: row.experience ?? 0,
    specialties: row.specialties ?? [],
    currentBusinessAssetId: row.current_business_asset_id ?? null,
    homeAssetId: row.home_asset_id ?? null,
    isWorking: row.is_working ?? false,
    hiredAt: row.hired_at,
    lastWorkedAt: row.last_worked_at ?? null,
  };
}

export function dbRowToAssignment(row: Record<string, any>): NpcAssignment {
  return {
    id: row.id,
    npcId: row.npc_id,
    businessAssetId: row.business_asset_id,
    requesterId: row.requester_id,
    businessOwnerId: row.business_owner_id,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at ?? null,
    requesterUsername: row.requester?.username ?? undefined,
    businessAssetType: row.business_asset?.type ?? undefined,
  };
}

// ─── Store State ──────────────────────────────────────────────────────────────

interface NpcState {
  /** Player's own NPCs, keyed by NPC id */
  npcs: Record<string, Npc>;
  /** Active/pending assignments for the player's NPCs */
  assignments: NpcAssignment[];
  /** Pending NPC requests coming INTO the player's businesses */
  pendingRequests: NpcAssignment[];
  /** Recent training sessions (last 20) */
  trainingSessions: NpcTrainingSession[];
  isLoading: boolean;
  error: string | null;

  fetchMyNpcs: (userId: string) => Promise<void>;
  fetchAssignments: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  fetchTrainingSessions: (userId: string) => Promise<void>;

  hireNpc: (params: {
    npcClass: NpcClass;
    nameFa: string;
    homeAssetId: string | null;
  }) => Promise<Npc | null>;

  assignNpcToBusiness: (
    npcId: string,
    businessAssetId: string,
  ) => Promise<{ success: boolean; status?: string; error?: string }>;

  respondToRequest: (assignmentId: string, accept: boolean) => Promise<boolean>;

  trainNpc: (
    npcId: string,
    institutionAssetId: string,
  ) => Promise<{
    success: boolean;
    xpGained?: number;
    newLevel?: number;
    leveledUp?: boolean;
    specialtyLearned?: string | null;
    error?: string;
  }>;

  revokeAssignment: (assignmentId: string) => Promise<boolean>;
  subscribeToNpcs: (userId: string) => () => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNpcStore = create<NpcState>()((set, get) => ({
  npcs: {},
  assignments: [],
  pendingRequests: [],
  trainingSessions: [],
  isLoading: false,
  error: null,

  fetchMyNpcs: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('owner_id', userId)
        .order('hired_at', { ascending: false });
      if (error) throw error;
      const map: Record<string, Npc> = {};
      (data ?? []).forEach((row) => { map[row.id] = dbRowToNpc(row); });
      set({ npcs: map });
    } catch (err) {
      console.warn('[NpcStore] fetchMyNpcs:', err);
      set({ error: 'خطا در بارگذاری کارگران' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAssignments: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('npc_assignments')
        .select(`
          *,
          requester:profiles!npc_assignments_requester_id_fkey(username),
          business_asset:assets!npc_assignments_business_asset_id_fkey(type)
        `)
        .or(`requester_id.eq.${userId},business_owner_id.eq.${userId}`)
        .in('status', ['pending', 'approved'])
        .order('requested_at', { ascending: false });
      if (error) throw error;
      set({ assignments: (data ?? []).map(dbRowToAssignment) });
    } catch (err) {
      console.warn('[NpcStore] fetchAssignments:', err);
    }
  },

  fetchPendingRequests: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('npc_assignments')
        .select(`
          *,
          requester:profiles!npc_assignments_requester_id_fkey(username),
          business_asset:assets!npc_assignments_business_asset_id_fkey(type)
        `)
        .eq('business_owner_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      set({ pendingRequests: (data ?? []).map(dbRowToAssignment) });
    } catch (err) {
      console.warn('[NpcStore] fetchPendingRequests:', err);
    }
  },

  fetchTrainingSessions: async (userId) => {
    try {
      // Fetch training sessions for NPCs owned by this player
      const { data: npcData } = await supabase
        .from('npcs')
        .select('id')
        .eq('owner_id', userId);
      if (!npcData?.length) return;
      const npcIds = npcData.map((n) => n.id);
      const { data, error } = await supabase
        .from('npc_training_sessions')
        .select('*')
        .in('npc_id', npcIds)
        .order('completed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const sessions: NpcTrainingSession[] = (data ?? []).map((row) => ({
        id: row.id,
        npcId: row.npc_id,
        institutionAssetId: row.institution_asset_id,
        institutionType: row.institution_type,
        xpGained: row.xp_gained ?? 0,
        specialtyLearned: row.specialty_learned ?? null,
        cashCost: row.cash_cost ?? 0,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      }));
      set({ trainingSessions: sessions });
    } catch (err) {
      console.warn('[NpcStore] fetchTrainingSessions:', err);
    }
  },

  hireNpc: async ({ npcClass, nameFa, homeAssetId }) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('hire_npc', {
        p_class: npcClass,
        p_name_fa: nameFa,
        p_home_asset_id: homeAssetId,
      });
      if (error) throw error;
      if (!data?.success) {
        set({ error: data?.error ?? 'hire_failed' });
        GameAudio.playError();
        return null;
      }
      const { data: npcRow } = await supabase
        .from('npcs').select('*').eq('id', data.npc_id).single();
      if (!npcRow) return null;
      const npc = dbRowToNpc(npcRow);
      set((state) => ({ npcs: { ...state.npcs, [npc.id]: npc } }));
      GameAudio.playBuy();
      return npc;
    } catch (err) {
      console.warn('[NpcStore] hireNpc:', err);
      set({ error: err instanceof Error ? err.message : 'hire_failed' });
      GameAudio.playError();
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  assignNpcToBusiness: async (npcId, businessAssetId) => {
    try {
      const { data, error } = await supabase.rpc('assign_npc_to_business', {
        p_npc_id: npcId,
        p_business_asset_id: businessAssetId,
      });
      if (error) throw error;
      if (!data?.success) {
        GameAudio.playError();
        return { success: false, error: data?.error };
      }
      // Auto-approved (same owner)
      if (data.status === 'approved') {
        set((state) => ({
          npcs: {
            ...state.npcs,
            [npcId]: {
              ...state.npcs[npcId],
              isWorking: true,
              currentBusinessAssetId: businessAssetId,
            },
          },
        }));
      }
      GameAudio.playTap();
      return { success: true, status: data.status };
    } catch (err) {
      console.warn('[NpcStore] assignNpcToBusiness:', err);
      GameAudio.playError();
      return { success: false, error: 'network_error' };
    }
  },

  respondToRequest: async (assignmentId, accept) => {
    try {
      const { data, error } = await supabase.rpc('respond_to_npc_request', {
        p_assignment_id: assignmentId,
        p_accept: accept,
      });
      if (error) throw error;
      if (!data?.success) { GameAudio.playError(); return false; }
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== assignmentId),
      }));
      GameAudio.playTap();
      return true;
    } catch (err) {
      console.warn('[NpcStore] respondToRequest:', err);
      GameAudio.playError();
      return false;
    }
  },

  trainNpc: async (npcId, institutionAssetId) => {
    try {
      const { data, error } = await supabase.rpc('train_npc', {
        p_npc_id: npcId,
        p_institution_asset_id: institutionAssetId,
      });
      if (error) throw error;
      if (!data?.success) { GameAudio.playError(); return { success: false, error: data?.error }; }
      set((state) => {
        const npc = state.npcs[npcId];
        if (!npc) return {};
        return {
          npcs: {
            ...state.npcs,
            [npcId]: { ...npc, experience: data.new_xp, level: data.new_level },
          },
        };
      });
      if (data.leveled_up) {
        GameAudio.playLevelUp();
      } else {
        GameAudio.playTap();
      }
      return {
        success: true,
        xpGained: data.xp_gained,
        newLevel: data.new_level,
        leveledUp: data.leveled_up,
        specialtyLearned: data.specialty_learned ?? null,
      };
    } catch (err) {
      console.warn('[NpcStore] trainNpc:', err);
      GameAudio.playError();
      return { success: false, error: 'network_error' };
    }
  },

  revokeAssignment: async (assignmentId) => {
    try {
      const { data, error } = await supabase.rpc('revoke_npc_assignment', {
        p_assignment_id: assignmentId,
      });
      if (error) throw error;
      if (!data?.success) { GameAudio.playError(); return false; }
      const assignment = get().assignments.find((a) => a.id === assignmentId);
      if (assignment) {
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== assignmentId),
          npcs: {
            ...state.npcs,
            [assignment.npcId]: state.npcs[assignment.npcId]
              ? { ...state.npcs[assignment.npcId], isWorking: false, currentBusinessAssetId: null }
              : state.npcs[assignment.npcId],
          },
        }));
      }
      GameAudio.playTap();
      return true;
    } catch (err) {
      console.warn('[NpcStore] revokeAssignment:', err);
      GameAudio.playError();
      return false;
    }
  },

  subscribeToNpcs: (userId) => {
    const channel = supabase
      .channel(`npc-workers:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'npcs', filter: `owner_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const npc = dbRowToNpc(payload.new as Record<string, any>);
            set((state) => ({ npcs: { ...state.npcs, [npc.id]: npc } }));
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as any)?.id;
            if (id) {
              set((state) => {
                const next = { ...state.npcs };
                delete next[id];
                return { npcs: next };
              });
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'npc_assignments',
          filter: `business_owner_id=eq.${userId}`,
        },
        (payload) => {
          const asgn = dbRowToAssignment(payload.new as Record<string, any>);
          if (asgn.status === 'pending') {
            set((state) => ({ pendingRequests: [asgn, ...state.pendingRequests] }));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  clearError: () => set({ error: null }),
}));
