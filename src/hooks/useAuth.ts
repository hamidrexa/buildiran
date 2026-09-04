/**
 * BuildIran — useAuth Hook
 * Listens to Supabase auth state, fetches/upserts player profile.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Player } from '@/types/game.types';

function dbProfileToPlayer(row: Record<string, any>): Player {
  return {
    id: row.id,
    username: row.username ?? 'بازیکن',
    avatarUrl: row.avatar_url ?? null,
    avatarColor: row.avatar_color ?? '#6C63FF',
    level: row.level ?? 1,
    experience: row.experience ?? 0,
    cash: row.cash ?? 5000,
    power: row.power ?? 10,
    wealth: row.wealth ?? 0,
    activity: row.activity ?? 0,
    popularity: row.popularity ?? 0,
    resources: {
      gold: row.cash ?? 5000,
      food: 800,
      wood: 600,
      stone: 350,
      population: 25,
    },
    ownedTileIds: [],
    buildingIds: [],
    score: row.score ?? 0,
    rank: row.rank ?? 9999,
    status: row.status ?? 'online',
    joinedAt: row.joined_at ?? new Date().toISOString(),
    lastSeenAt: row.last_seen_at ?? new Date().toISOString(),
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[useAuth] fetchProfile error:', error.message);
      return null;
    }
    return data ? dbProfileToPlayer(data) : null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const p = await fetchProfile(session.user.id);
    if (p) setProfile(p);
  }, [session, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        if (s?.user?.id) {
          const p = await fetchProfile(s.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return { session, profile, loading, refreshProfile, signOut };
}
