/**
 * BuildIran — Player Profile Screen (redesigned)
 * Two clear concerns: Game (stats/resources) and Account (auth/security).
 */

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/hooks/useAuth";
import t from "@/i18n";
import { showAlert, showConfirm } from "@/lib/alert";
import { GameAudio } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Colors, Radii, Spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const lang = t();
WebBrowser.maybeCompleteAuthSession();

type Tab = "game" | "account";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("game");

  const isGoogleUser =
    session?.user?.app_metadata?.provider === "google" ||
    session?.user?.app_metadata?.providers?.includes("google");

  const handleLogout = () => {
    showConfirm(
      "خروج از حساب",
      "آیا می‌خواهید از حساب کاربری خود خارج شوید؟",
      async () => {
        setLoading(true);
        GameAudio.playTap();
        await signOut();
        router.replace("/auth/login" as any);
        setLoading(false);
      },
      { confirmText: "خروج", destructive: true },
    );
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL("/auth/callback");
      const { data, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;

      if (data?.url) {
        if (Platform.OS === "web") {
          window.location.href = data.url;
        } else {
          const res = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
          );
          if (res.type === "success" && res.url) {
            const parsed = Linking.parse(res.url);
            const access_token = parsed.queryParams?.access_token as string;
            const refresh_token = parsed.queryParams?.refresh_token as string;
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              showAlert("✅", "حساب گوگل با موفقیت متصل شد.");
            }
          }
        }
      } else {
        showAlert(
          "خطا",
          "پاسخی از سرویس گوگل دریافت نشد. لطفاً دوباره تلاش کنید.",
        );
      }
    } catch (err: any) {
      showAlert("خطا", err.message ?? "مشکلی در اتصال گوگل پیش آمد.");
    } finally {
      setLoading(false);
    }
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
    <View style={styles.container}>
      {/* Header — always visible */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
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

        {/* Segmented control — the actual "separate concerns" split */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "game" && styles.tabBtnActive]}
            onPress={() => {
              setTab("game");
              GameAudio.playTap();
            }}
          >
            <Ionicons
              name="game-controller-outline"
              size={16}
              color={tab === "game" ? "#0D0F14" : Colors.text.secondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                tab === "game" && styles.tabBtnTextActive,
              ]}
            >
              بازی
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "account" && styles.tabBtnActive]}
            onPress={() => {
              setTab("account");
              GameAudio.playTap();
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={tab === "account" ? "#0D0F14" : Colors.text.secondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                tab === "account" && styles.tabBtnTextActive,
              ]}
            >
              حساب کاربری
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {tab === "game" ? (
          <>
            <Card style={styles.card}>
              <Text variant="label" color="secondary">
                {lang.player.experience}
              </Text>
              <View style={styles.xpBarBg}>
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      width: `${Math.min((player.experience % 1000) / 10, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" color="muted">
                {player.experience.toLocaleString("fa-IR")} XP
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text variant="label" color="secondary" style={styles.cardTitle}>
                آمار قدرت
              </Text>
              <View style={styles.statGrid}>
                <StatChip icon="⚔️" label="قدرت" value={player.power} />
                <StatChip
                  icon="💰"
                  label="ثروت"
                  value={Math.min(player.wealth, 999999)}
                />
                <StatChip icon="🔥" label="فعالیت" value={player.activity} />
                <StatChip icon="⭐" label="محبوبیت" value={player.popularity} />
              </View>
            </Card>

            <Card style={styles.card}>
              <Text variant="label" color="secondary" style={styles.cardTitle}>
                {lang.hud.resources}
              </Text>
              <View style={styles.resourceGrid}>
                <ResourceRow
                  icon="🪙"
                  label={lang.resources.gold}
                  value={player.resources.gold}
                />
                <ResourceRow
                  icon="🌾"
                  label={lang.resources.food}
                  value={player.resources.food}
                />
                <ResourceRow
                  icon="🪵"
                  label={lang.resources.wood}
                  value={player.resources.wood}
                />
                <ResourceRow
                  icon="🪨"
                  label={lang.resources.stone}
                  value={player.resources.stone}
                />
                <ResourceRow
                  icon="👥"
                  label={lang.resources.population}
                  value={player.resources.population}
                />
              </View>
            </Card>

            <Card style={styles.card}>
              <Text variant="label" color="secondary" style={styles.cardTitle}>
                خلاصه پیشرفت
              </Text>
              <StatRow
                label={lang.player.territory}
                value={`${player.ownedTileIds.length} قطعه`}
              />
              <StatRow
                label={lang.player.buildings}
                value={`${player.buildingIds.length} سازه`}
              />
              <StatRow
                label="امتیاز کل"
                value={player.score.toLocaleString("fa-IR")}
              />
            </Card>
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <View style={styles.accountRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.text.secondary}
                />
                <Text variant="body" color="secondary">
                  {session?.user?.email ?? "نامشخص"}
                </Text>
              </View>
              <View style={styles.accountRow}>
                <Ionicons
                  name={isGoogleUser ? "checkmark-circle" : "link-outline"}
                  size={18}
                  color={
                    isGoogleUser
                      ? Colors.semantic.success
                      : Colors.text.secondary
                  }
                />
                <Text variant="body" color="secondary">
                  {isGoogleUser ? "حساب گوگل متصل شده" : "حساب گوگل متصل نیست"}
                </Text>
              </View>

              <View style={styles.divider} />

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
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.text.muted} />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.text.muted}
                    />
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.accountBtn}
                onPress={() => router.push("/auth/forgot-password" as any)}
                disabled={loading}
              >
                <View style={styles.accountBtnContent}>
                  <Ionicons
                    name={isGoogleUser ? "key-outline" : "refresh-outline"}
                    size={20}
                    color={Colors.brand.primary}
                  />
                  <Text variant="body" weight="medium">
                    {isGoogleUser ? "تنظیم رمز عبور" : "فراموشی رمز عبور"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.text.muted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.accountBtn, styles.logoutBtn]}
                onPress={handleLogout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.semantic.error}
                  />
                ) : (
                  <View style={styles.accountBtnContent}>
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color={Colors.semantic.error}
                    />
                    <Text
                      variant="body"
                      weight="medium"
                      style={{ color: Colors.semantic.error }}
                    >
                      خروج از حساب
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Card>

            <Card style={styles.card}>
              <StatRow
                label="تاریخ عضویت"
                value={
                  player.joinedAt
                    ? new Date(player.joinedAt).toLocaleDateString("fa-IR")
                    : "—"
                }
              />
              <StatRow
                label="وضعیت"
                value={
                  player.status === "in_game"
                    ? "در حال بازی"
                    : player.status === "online"
                      ? lang.player.online
                      : lang.player.offline
                }
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ResourceRow: React.FC<{ icon: string; label: string; value: number }> = ({
  icon,
  label,
  value,
}) => (
  <View style={rowStyles.row}>
    <Text variant="body">{value.toLocaleString("fa-IR")}</Text>
    <View style={rowStyles.labelGroup}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text style={rowStyles.icon}>{icon}</Text>
    </View>
  </View>
);

const StatRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={rowStyles.row}>
    <Text variant="body" weight="semibold">
      {value}
    </Text>
    <Text variant="body" color="secondary">
      {label}
    </Text>
  </View>
);

const StatChip: React.FC<{ icon: string; label: string; value: number }> = ({
  icon,
  label,
  value,
}) => (
  <View style={chipStyles.chip}>
    <Text style={chipStyles.icon}>{icon}</Text>
    <Text style={chipStyles.value}>{value.toLocaleString("fa-IR")}</Text>
    <Text style={chipStyles.label}>{label}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  labelGroup: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  icon: { fontSize: 16 },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexBasis: "48%",
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  icon: { fontSize: 18 },
  value: { color: Colors.text.primary, fontWeight: "800", fontSize: 15 },
  label: { color: Colors.text.muted, fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg.primary,
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.full,
    padding: 4,
    marginTop: Spacing.sm,
    gap: 4,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: Radii.full,
  },
  tabBtnActive: { backgroundColor: Colors.brand.primary },
  tabBtnText: { color: Colors.text.secondary, fontSize: 13, fontWeight: "700" },
  tabBtnTextActive: { color: "#0D0F14" },

  card: { gap: Spacing.sm },
  cardTitle: { marginBottom: Spacing.xs },
  resourceGrid: { gap: Spacing.sm },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.full,
    overflow: "hidden",
    marginVertical: Spacing.xs,
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.brand.primary,
    borderRadius: Radii.full,
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing.sm,
  },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg.tertiary,
    marginTop: Spacing.xs,
  },
  accountBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginTop: Spacing.md,
  },
});
