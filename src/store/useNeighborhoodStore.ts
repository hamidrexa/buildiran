/**
 * BuildIran — Zustand Neighborhood & Editor Store
 * Manages neighborhoods, neighborhood editor privileges, custom building proposals,
 * and review workflows.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  Neighborhood,
  CustomBuildingType,
  ProposalStatus,
  BuildingCategory,
  CouncilMember,
} from '@/types/game.types';

// Default Iranian neighborhoods fallback if Supabase table is not yet seeded
export const DEFAULT_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: 'tehran_dist_6_میدان ولیعصر',
    city: 'تهران',
    nameFa: 'میدان ولیعصر',
    descriptionFa: 'محله میدان ولیعصر واقع در منطقه ۶ شهر تهران',
    centerLat: 35.7118,
    centerLng: 51.4069,
    radiusKm: 2.0,
    minEditorPower: 100,
    areaNumber: 6,
    areaName: 'منطقه ۶ شهر تهران',
    isLocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tehran_vanak',
    city: 'تهران',
    nameFa: 'ونک',
    descriptionFa: 'منطقه تجاری و نوآوری شمال پایتخت',
    centerLat: 35.7575,
    centerLng: 51.4099,
    radiusKm: 4.0,
    minEditorPower: 150,
    areaNumber: 3,
    areaName: 'منطقه ۳ شهر تهران',
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tehran_tajrish',
    city: 'تهران',
    nameFa: 'تجریش',
    descriptionFa: 'مرکز تاریخی و مذهبی با ارزش املاک بالا',
    centerLat: 35.8055,
    centerLng: 51.4312,
    radiusKm: 4.5,
    minEditorPower: 200,
    areaNumber: 1,
    areaName: 'منطقه ۱ شهر تهران',
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tehran_saadatabad',
    city: 'تهران',
    nameFa: 'سعادت‌آباد',
    descriptionFa: 'منطقه مدرن با برج‌ها و مراکز خرید لوکس',
    centerLat: 35.7890,
    centerLng: 51.3740,
    radiusKm: 4.0,
    minEditorPower: 180,
    areaNumber: 2,
    areaName: 'منطقه ۲ شهر تهران',
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tehran_enqelab',
    city: 'تهران',
    nameFa: 'انقلاب',
    descriptionFa: 'قلب فرهنگی و علمی پایتخت',
    centerLat: 35.7008,
    centerLng: 51.3912,
    radiusKm: 3.5,
    minEditorPower: 120,
    areaNumber: 6,
    areaName: 'منطقه ۶ شهر تهران',
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
];

interface NeighborhoodState {
  neighborhoods: Neighborhood[];
  currentNeighborhood: Neighborhood | null;
  approvedCustomTypes: CustomBuildingType[];
  pendingProposals: CustomBuildingType[];
  councilMembers: CouncilMember[];
  isLoading: boolean;

  // Actions
  fetchNeighborhoods: () => Promise<void>;
  setCurrentNeighborhood: (neighborhood: Neighborhood) => void;
  fetchCouncilMembers: (neighborhoodId: string) => Promise<void>;
  requestCouncilMembership: (neighborhoodId: string) => Promise<any>;
  triggerChairSelection: (neighborhoodId: string) => Promise<any>;
  fetchCustomBuildings: (neighborhoodId?: string) => Promise<void>;
  fetchPendingProposals: (neighborhoodId: string) => Promise<void>;
  
  isEditorForNeighborhood: (playerPower: number, playerId: string, neighborhoodId: string) => boolean;
  isDistrictLocked: (nameFa: string, areaNumber?: number) => boolean;

  proposeCustomBuilding: (params: {
    userId: string;
    code: string;
    nameFa: string;
    descriptionFa: string;
    neighborhoodId: string;
    category: BuildingCategory;
    baseCost: number;
    powerBonus: number;
    incomeRate: number;
    iconName?: string;
    emoji?: string;
    customSettings?: Record<string, any>;
  }) => Promise<CustomBuildingType | null>;

  reviewProposal: (params: {
    proposalId: string;
    editorId: string;
    status: 'approved' | 'rejected';
    reviewNotes?: string;
  }) => Promise<boolean>;
}

function dbRowToCustomType(row: any): CustomBuildingType {
  return {
    id: row.id,
    code: row.code,
    nameFa: row.name_fa,
    descriptionFa: row.description_fa,
    neighborhoodId: row.neighborhood_id,
    category: row.category,
    baseCost: row.base_cost ?? 5000,
    powerBonus: row.power_bonus ?? 10,
    incomeRate: row.income_rate ?? 100,
    iconName: row.icon_name ?? 'business',
    emoji: row.emoji ?? '🏛️',
    colorPrimary: row.color_primary ?? '#6C63FF',
    colorSecondary: row.color_secondary ?? '#A78BFA',
    customSettings: row.custom_settings ?? {},
    proposedBy: row.proposed_by,
    status: row.status as ProposalStatus,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export const useNeighborhoodStore = create<NeighborhoodState>()((set, get) => ({
  neighborhoods: DEFAULT_NEIGHBORHOODS,
  currentNeighborhood: DEFAULT_NEIGHBORHOODS[0],
  approvedCustomTypes: [],
  pendingProposals: [],
  councilMembers: [],
  isLoading: false,

  fetchNeighborhoods: async () => {
    try {
      const { data, error } = await supabase.from('neighborhoods').select('*');
      if (!error && data && data.length > 0) {
        const list: Neighborhood[] = data.map((n: any) => ({
          id: n.id,
          city: n.city,
          nameFa: n.name_fa,
          descriptionFa: n.description_fa,
          centerLat: n.center_lat,
          centerLng: n.center_lng,
          radiusKm: n.radius_km,
          minEditorPower: n.min_editor_power,
          createdAt: n.created_at,
          areaNumber: n.area_number,
          areaName: n.area_name,
          isLocked: n.is_locked ?? true,
          communityCenterLat: n.community_center_lat,
          communityCenterLot: n.community_center_lot,
          communityCenterClearanceToBoundary: n.community_center_clearance_to_boundary,
          areaSqkm: n.area_sqkm,
          councilMemberCapacity: n.council_member_capacity ?? 5,
          minCouncilPopularity: n.min_council_popularity ?? 50,
          councilChairId: n.council_chair_id,
          lastChairSelectionAt: n.last_chair_selection_at,
        }));
        set({ neighborhoods: list });
        if (!get().currentNeighborhood) {
          set({ currentNeighborhood: list[0] });
        }
      }
    } catch {
      // Keep default fallback
    }
  },

  setCurrentNeighborhood: (neighborhood: Neighborhood) => {
    set({ currentNeighborhood: neighborhood });
    get().fetchCustomBuildings(neighborhood.id);
    get().fetchCouncilMembers(neighborhood.id);
  },

  fetchCouncilMembers: async (neighborhoodId: string) => {
    try {
      const { data, error } = await supabase
        .from('neighborhood_council_members')
        .select(`
          neighborhood_id,
          player_id,
          joined_at,
          profiles:player_id (username, avatar_color, avatar_url, power, popularity)
        `)
        .eq('neighborhood_id', neighborhoodId);
      
      if (!error && data) {
        const members: CouncilMember[] = data.map((row: any) => ({
          neighborhoodId: row.neighborhood_id,
          playerId: row.player_id,
          joinedAt: row.joined_at,
          username: row.profiles?.username,
          avatarColor: row.profiles?.avatar_color,
          avatarUrl: row.profiles?.avatar_url,
          power: row.profiles?.power,
          popularity: row.profiles?.popularity,
        }));
        set({ councilMembers: members });
      }
    } catch (err) {
      console.warn('[NeighborhoodStore] fetchCouncilMembers err:', err);
    }
  },

  requestCouncilMembership: async (neighborhoodId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('request_council_membership', {
        p_neighborhood_id: neighborhoodId,
      });
      if (error) throw error;
      await get().fetchCouncilMembers(neighborhoodId);
      await get().fetchNeighborhoods(); // to potentially refresh chair_id
      return data;
    } catch (err) {
      console.warn('[NeighborhoodStore] requestCouncilMembership err:', err);
      return { success: false, error: 'network_error' };
    } finally {
      set({ isLoading: false });
    }
  },

  triggerChairSelection: async (neighborhoodId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('trigger_chair_selection', {
        p_neighborhood_id: neighborhoodId,
      });
      if (error) throw error;
      await get().fetchNeighborhoods(); // refresh chair_id and last_chair_selection_at
      return data;
    } catch (err) {
      console.warn('[NeighborhoodStore] triggerChairSelection err:', err);
      return { success: false, error: 'network_error' };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCustomBuildings: async (neighborhoodId?: string) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('custom_building_types')
        .select('*')
        .eq('status', 'approved');

      if (neighborhoodId) {
        query = query.or(`neighborhood_id.eq.${neighborhoodId},neighborhood_id.is.null`);
      }

      const { data, error } = await query;
      if (!error && data) {
        set({ approvedCustomTypes: data.map(dbRowToCustomType) });
      }
    } catch (err) {
      console.warn('[NeighborhoodStore] fetchCustomBuildings err:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingProposals: async (neighborhoodId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('custom_building_types')
        .select('*')
        .eq('status', 'pending')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        set({ pendingProposals: data.map(dbRowToCustomType) });
      }
    } catch (err) {
      console.warn('[NeighborhoodStore] fetchPendingProposals err:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  isEditorForNeighborhood: (playerPower: number, playerId: string, neighborhoodId: string) => {
    const neighborhood = get().neighborhoods.find((n) => n.id === neighborhoodId);
    if (!neighborhood) return playerPower >= 150;
    // Player has high power qualifying them as editor
    return playerPower >= neighborhood.minEditorPower;
  },

  isDistrictLocked: (nameFa: string, areaNumber?: number) => {
    const { neighborhoods } = get();
    if (!neighborhoods || neighborhoods.length === 0) {
      return true; // Default locked until neighborhoods table data loads from Supabase
    }
    const match =
      neighborhoods.find(
        (n) => n.nameFa === nameFa && (areaNumber === undefined || n.areaNumber === areaNumber)
      ) || neighborhoods.find((n) => n.nameFa === nameFa);

    return match ? (match.isLocked ?? true) : true;
  },

  proposeCustomBuilding: async (params) => {
    try {
      const { data, error } = await supabase
        .from('custom_building_types')
        .insert({
          code: params.code.toLowerCase().trim().replace(/\s+/g, '_'),
          name_fa: params.nameFa,
          description_fa: params.descriptionFa,
          neighborhood_id: params.neighborhoodId,
          category: params.category,
          base_cost: params.baseCost,
          power_bonus: params.powerBonus,
          income_rate: params.incomeRate,
          icon_name: params.iconName ?? 'business',
          emoji: params.emoji ?? '🏛️',
          custom_settings: params.customSettings ?? {},
          proposed_by: params.userId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      const custom = dbRowToCustomType(data);

      set((state) => ({
        pendingProposals: [custom, ...state.pendingProposals],
      }));

      // Log game event
      await supabase.from('game_events').insert({
        player_id: params.userId,
        type: 'proposal_submitted',
        payload: { code: custom.code, name_fa: custom.nameFa, neighborhood_id: params.neighborhoodId },
      });

      return custom;
    } catch (err) {
      console.warn('[NeighborhoodStore] proposeCustomBuilding error:', err);
      return null;
    }
  },

  reviewProposal: async ({ proposalId, editorId, status, reviewNotes }) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('custom_building_types')
        .update({
          status,
          reviewed_by: editorId,
          review_notes: reviewNotes ?? null,
          reviewed_at: now,
        })
        .eq('id', proposalId);

      if (error) throw error;

      // Update local state
      const proposal = get().pendingProposals.find((p) => p.id === proposalId);
      set((state) => ({
        pendingProposals: state.pendingProposals.filter((p) => p.id !== proposalId),
        approvedCustomTypes:
          status === 'approved' && proposal
            ? [...state.approvedCustomTypes, { ...proposal, status: 'approved', reviewedBy: editorId, reviewedAt: now }]
            : state.approvedCustomTypes,
      }));

      // Log game event
      await supabase.from('game_events').insert({
        player_id: editorId,
        type: status === 'approved' ? 'proposal_approved' : 'proposal_rejected',
        payload: { proposal_id: proposalId, status, notes: reviewNotes },
      });

      return true;
    } catch (err) {
      console.warn('[NeighborhoodStore] reviewProposal error:', err);
      return false;
    }
  },
}));
