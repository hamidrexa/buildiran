/**
 * BuildIran — Entry Point (theme-reactive)
 * Auth guard: redirects to game if session exists, else to login.
 */

import { PersianBrandLockup } from '@/components/brand/BrandLogos';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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
      <View style={styles.splash}>
        <PersianBrandLockup width={220} style={styles.logoImage} />
        <ActivityIndicator color={c.brass[400]} size="small" style={styles.spinner} />
      </View>
    );
  }

  return <Redirect href={(isAuthenticated ? '/(game)' : '/auth/login') as any} />;
}

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    splash: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.ink[950],
      gap: 4,
    },
    logoImage: {
      width: 220,
      height: 317,
    },
    spinner: {
      marginTop: Spacing.xl,
    },
  });
