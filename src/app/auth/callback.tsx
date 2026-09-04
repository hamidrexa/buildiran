import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const parsed = Linking.parse(url);
        const access_token = parsed.queryParams?.access_token as string;
        const refresh_token = parsed.queryParams?.refresh_token as string;

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      router.replace('/(game)');
    };

    handleUrl();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080C1A',
  },
});
