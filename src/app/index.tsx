/**
 * BuildIran — Entry Point
 * Auth guard: redirects to game if session exists, else to login.
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Preload audio assets on startup
    GameAudio.preloadAll();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <LinearGradient
        colors={['#080C1A', '#0D1533']}
        style={styles.splash}
      >
        <Text style={styles.splashEmoji}>🏰</Text>
        <Text style={styles.splashTitle}>بیلد ایران</Text>
        <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  return <Redirect href={(isAuthenticated ? '/(game)' : '/auth/login') as any} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashEmoji: { fontSize: 72 },
  splashTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#6C63FF',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
});

