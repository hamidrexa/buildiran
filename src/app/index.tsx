/**
 * BuildIran — Entry Point (theme-reactive)
 * Auth guard: redirects to game if session exists, else to login.
 */

import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

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
        {/* The crown — Shahryar's mark */}
        <Image
          source={require("../../assets/images/splash-icon.png")}
          style={styles.markImage}
          resizeMode="contain"
        />
        <Text variant="title" weight="bold" color="primary">
          شهریار
        </Text>
        <Text variant="label" color="muted" style={styles.kicker}>
          SHAHRAYAR
        </Text>
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
      backgroundColor: c.bg.primary,
      gap: 4,
    },
    mark: {
      width: 44,
      height: 48,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: Spacing.md,
    },
    markImage: {
      width: 48,
      height: 48,
    },
    leg: {
      position: 'absolute',
      bottom: 0,
      width: 6,
      height: 28,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      backgroundColor: c.brass[400],
    },
    arch: {
      position: 'absolute',
      top: 2,
      alignSelf: 'center',
      width: 24,
      height: 20,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderWidth: 4,
      borderBottomWidth: 0,
      borderColor: c.brass[300],
    },
    kicker: {
      letterSpacing: 2,
      marginTop: 2,
    },
    spinner: {
      marginTop: Spacing.xl,
    },
  });
