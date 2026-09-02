/**
 * BuildIran — Supabase Client (Singleton)
 *
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * in your .env.local file to connect to your Supabase project.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './constants';

/**
 * Supabase uses AsyncStorage on native and localStorage on web.
 * The Platform.OS check prevents crashing when both environments run.
 */
const storage =
  Platform.OS === 'web'
    ? undefined // web uses localStorage by default
    : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
