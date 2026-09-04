/**
 * BuildIran — Player Profile Screen
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Spacing, Radii } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { GameAudio } from '@/lib/audio';
import t from '@/i18n';

const lang = t();

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const isGoogleUser =
    session?.user?.app_metadata?.provider === 'google' ||
    session?.user?.app_metadata?.providers?.includes('google');

  const handleLogout = async () => {
    Alert.alert(
      'خروج از حساب',
      'آیا می‌خواهید از حساب کاربری خود خارج شوید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            GameAudio.playTap();
            await signOut();
            router.replace('/auth/login' as any);
            setLoading(false);
          },
        },
      ],
    );
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;

      if (data?.url) {
        if (Platform.OS === 'web') {
          window.location.href = data.url;
        } else {
          const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (res.type === 'success' && res.url) {
            const parsed = Linking.parse(res.url);
            const access_token = parsed.queryParams?.access_token as string;
            const refresh_token = parsed.queryParams?.refresh_token as string;
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              Alert.alert('✅', 'حساب گوگل با موفقیت متصل شد.');
            }
          }
        }
      }
    } catch (err: any) {
      Alert.alert('خطا', err.message ?? 'مشکلی در اتصال گوگل پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  if (!player) {
    return (
      <View style={styles.empty}>
        <Text variant="body" color="secondary" center>
          در حال بارگذاری اطلاعات بازیکن...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.xl },
      ]}
    >
      {/* Avatar & Name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="heading" weight="bold" color="brand" center>
            {player.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="title" weight="bold">
          {player.username}
        </Text>
        <Text variant="caption" color="secondary">
          {lang.player.level} {player.level} · {lang.player.rank} #{player.rank}
        </Text>
      </View>

      {/* ─── Account Section ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={20} color={Colors.brand.primary} />
          <Text variant="label" weight="semibold">
            حساب کاربری
          </Text>
        </View>

        <Card style={styles.card}>
          {/* Email */}
          <View style={styles.accountRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.text.secondary} />
            <Text variant="body" color="secondary">
              {session?.user?.email ?? 'نامشخص'}
            </Text>
          </View>

          {/* Google Status */}
          <View style={styles.accountRow}>
            <Ionicons
              name={isGoogleUser ? 'checkmark-circle' : 'link-outline'}
              size={18}
              color={isGoogleUser ? Colors.success : Colors.text.secondary}
            />
            <Text variant="body" color="secondary">
              {isGoogleUser ? 'حساب گوگل متصل شده' : 'حساب گوگل متصل نیست'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Link Google Button */}
          {!isGoogleUser && (
            <TouchableOpacity
              style={styles.accountBtn}
              onPress={handleLinkGoogle}
              disabled={loading}
            >
              <View style={styles.accountBtnContent}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text variant="body" weight="medium">
                  اتصال حساب گوگل
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}

          {/* Set Password (Google users) */}
          {isGoogleUser && (
            <TouchableOpacity
              style={styles.accountBtn}
              onPress={handleSetPassword}
              disabled={loading}
            >
              <View style={styles.accountBtnContent}>
                <Ionicons name="key-outline" size={20} color={Colors.brand.primary} />
                <Text variant="body" weight="medium">
                  تنظیم رمز عبور
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}

          {/* Forgot Password (non-Google users) */}
          {!isGoogleUser && (
            <TouchableOpacity
              style={styles.accountBtn}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <View style={styles.accountBtnContent}>
                <Ionicons name="refresh-outline" size={20} color={Colors.brand.primary} />
                <Text variant="body" weight="medium">
                  فراموشی رمز عبور
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.accountBtn, styles.logoutBtn]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <View style={styles.accountBtnContent}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text variant="body" weight="medium" color={Colors.error}>
                  خروج از حساب
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>
      </View>

      {/* ─── Game Section ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="game-controller-outline" size={20} color={Colors.brand.primary} />
          <Text variant="label" weight="semibold">
            بازی
          </Text>
        </View>

        {/* XP Bar */}
        <Card style={styles.card}>
          <Text variant="label" color="secondary">
            {lang.player.experience}
          </Text>
          <View style={styles.xpBarBg}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.min((player.experience % 1000) / 10, 100)}%` },
              ]}
            />
          </View>
          <Text variant="caption" color="muted">
            {player.experience.toLocaleString('fa-IR')} XP
          </Text>
        </Card>

        {/* Resources */}
        <Card style={styles.card}>
          <Text variant="label" color="secondary" style={styles.cardTitle}>
            {lang.hud.resources}
          </Text>
          <View style={styles.resourceGrid}>
            <ResourceRow icon="🪙" label={lang.resources.gold} value={player.resources.gold} />
            <ResourceRow icon="🌾" label={lang.resources.food} value={player.resources.food} />
            <ResourceRow icon="🪵" label={lang.resources.wood} value={player.resources.wood} />
            <ResourceRow icon="🪨" label={lang.resources.stone} value={player.resources.stone} />
            <ResourceRow icon="👥" label={lang.resources.population} value={player.resources.population} />
          </View>
        </Card>

        {/* Stats */}
        <Card style={styles.card}>
          <Text variant="label" color="secondary" style={styles.cardTitle}>
            آمار بازی
          </Text>
          <StatRow label={lang.player.territory} value={`${player.ownedTileIds.length} قطعه`} />
          <StatRow label={lang.player.buildings} value={`${player.buildingIds.length} سازه`} />
          <StatRow label="امتیاز کل" value={player.score.toLocaleString('fa-IR')} />
        </Card>
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ResourceRow: React.FC<{ icon: string; label: string; value: number }> = ({
  icon, label, value,
}) => (
  <View style={rowStyles.row}>
    <Text variant="body">{value.toLocaleString('fa-IR')}</Text>
    <View style={rowStyles.labelGroup}>
      <Text variant="body" color="secondary">{label}</Text>
      <Text style={rowStyles.icon}>{icon}</Text>
    </View>
  </View>
);

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={rowStyles.row}>
    <Text variant="body" weight="semibold">{value}</Text>
    <Text variant="body" color="secondary">{label}</Text>
  </View>
);



const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  icon: { fontSize: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['3xl'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  header: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  card: { gap: Spacing.sm },
  cardTitle: { marginBottom: Spacing.xs },
  resourceGrid: { gap: Spacing.sm },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.full,
  },

  // Section styles
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  // Account section
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing.sm,
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg.tertiary,
    marginTop: Spacing.xs,
  },
  accountBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: Spacing.md,
  },
});
