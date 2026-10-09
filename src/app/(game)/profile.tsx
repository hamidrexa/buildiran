/**
 * BuildIran — Player Profile Screen («Gentleman Neon» v2)
 * Two clear concerns: بازی (progression / stats / resources) and حساب کاربری (auth).
 * Dual-theme via useTheme, motion spec, mobile-first thumb zone.
 * All game logic, store calls and auth flows are unchanged — UI only.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconPlate } from "@/components/ui/IconPlate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { StatBar } from "@/components/ui/StatBar";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/hooks/useAuth";
import t from "@/i18n";
import { showAlert, showConfirm } from "@/lib/alert";
import { GameAudio } from "@/lib/audio";
import { getPlayerTier } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAssetStore } from "@/store/useAssetStore";
import { useMapStore, type MapMode } from "@/store/useMapStore";
import { useOfflineTiles } from "@/hooks/useOfflineTiles";
import { offlineTileManager } from "@/lib/offlineTileManager";
import { Motion, Radii, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { Palette, ThemeMode } from "@/theme/palettes";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextStyle,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const lang = t();
WebBrowser.maybeCompleteAuthSession();

type Tab = "game" | "account" | "settings";

/** fa-IR numerals — every number is a first-class citizen. */
const fa = (n: number) => n.toLocaleString("fa-IR");
const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

/** Tier ladder → IconPlate tone (tier hex comes from the palette). */
const TIER_TONE: Record<number, "neutral" | "steel" | "jade" | "brass" | "crimson"> = {
    1: "neutral",
    2: "steel",
    3: "jade",
    4: "brass",
    5: "crimson",
    6: "brass",
};

const TABS: { key: Tab; label: string }[] = [
    { key: "game", label: "بازی" },
    { key: "account", label: "حساب کاربری" },
    { key: "settings", label: "تنظیمات" },
];

/** Theme switcher (settings tab) — wired to setPreference. */
const THEME_TABS: { key: ThemeMode; label: string }[] = [
    { key: "dark", label: "تیره" },
    { key: "light", label: "روشن" },
    { key: "system", label: "سیستم" },
];
const PREF_LABEL: Record<ThemeMode, string> = {
    dark: "تیره",
    light: "روشن",
    system: "سیستم",
};

const MAP_MODE_TABS: { key: MapMode; label: string }[] = [
    { key: "online", label: "آنلاین (پیش‌فرض)" },
    { key: "offline", label: "آفلاین" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c, isDark, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const player = usePlayerStore((s) => s.player);
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("game");

  const isGoogleUser =
    session?.user?.app_metadata?.provider === "google" ||
    session?.user?.app_metadata?.providers?.includes("google");

  const assets = useAssetStore((s) => s.assets);
  const myAssets = Object.values(assets).filter((a) => a.ownerId === player?.id);
  const totalDailyPowerDrip = myAssets.reduce((sum, a) => sum + (a.dailyPowerDrip ?? 0), 0);
  const tier = getPlayerTier(player?.power ?? 0);
  const nextTierXp = tier.xpRequired;
  const currentXp = player?.powerXp ?? 0;
  const xpPercent = nextTierXp === Infinity ? 100 : Math.min(100, Math.floor((currentXp / nextTierXp) * 100));
  const isMaxTier = nextTierXp === Infinity;
  const tierColor = c.tier[tier.tier];

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
              showAlert("موفقیت", "حساب گوگل با موفقیت متصل شد.");
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

  const handleThemeChange = (mode: ThemeMode) => {
    setPreference(mode);
    GameAudio.playTap();
  };

  const mapMode = useMapStore((s) => s.mapMode);
  const setMapMode = useMapStore((s) => s.setMapMode);
  const showDistrictsOverlay = useMapStore((s) => s.showDistrictsOverlay);
  const setShowDistrictsOverlay = useMapStore((s) => s.setShowDistrictsOverlay);
  const showOtherPlayersAssets = useMapStore((s) => s.showOtherPlayersAssets);
  const setShowOtherPlayersAssets = useMapStore((s) => s.setShowOtherPlayersAssets);
  const offlineTiles = useOfflineTiles();

  const handleMapModeChange = (mode: MapMode) => {
    setMapMode(mode);
    GameAudio.playTap();
    if (mode === "offline" && Platform.OS !== "web") {
      const styleUrl =
        typeof c.mapStyle === "string"
          ? c.mapStyle
          : "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";
      offlineTileManager.bootstrap(styleUrl);
    }
  };

  const handleRefreshOfflineMap = () => {
    GameAudio.playTap();
    if (Platform.OS !== "web") {
      const styleUrl =
        typeof c.mapStyle === "string"
          ? c.mapStyle
          : "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";
      offlineTileManager.forceRefresh(styleUrl);
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
      {/* ─── Identity header — always visible, one entrance ─── */}
      <Animated.View
        entering={FadeInDown.duration(Motion.durations.slow)}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text variant="heading" weight="extrabold" color="brand" center>
              {player.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          {/* XP ring, faked as a thin brass fill under the plate */}
          <ProgressBar percent={xpPercent} height={4} tone="brass" style={styles.avatarXp} />
        </View>

        <Text variant="title" weight="extrabold">
          {player.username}
        </Text>

        <View style={styles.tierLine}>
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
          <Text variant="caption" color="secondary">
            رده {fa(tier.tier)} · {tier.nameFa}
          </Text>
          <View style={styles.rankChip}>
            <Text variant="label" weight="semibold" color="brand" style={[styles.rankText, TABULAR]}>
              #{fa(player.rank)}
            </Text>
          </View>
        </View>

        <SegmentedTabs<Tab>
          items={TABS}
          value={tab}
          onChange={(key) => {
            setTab(key);
            GameAudio.playTap();
          }}
          style={styles.tabs}
        />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
      >
        {tab === "game" ? (
          <>
            {/* ─── Hero: tier progression ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(0))}>
              <Card cornerTicks style={styles.card}>
                <Text variant="label" color="brand">
                  مسیر قدرت
                </Text>
                <View style={styles.tierHead}>
                  <View style={styles.tierId}>
                    <IconPlate name="shield" size="md" tone={TIER_TONE[tier.tier] ?? "neutral"} />
                    <Text variant="title" weight="extrabold" style={{ color: tierColor }} numberOfLines={1}>
                      رده {fa(tier.tier)} · {tier.nameFa}
                    </Text>
                  </View>
                  {totalDailyPowerDrip > 0 && (
                    <Chip
                      icon="sparkles"
                      tone="jade"
                      value={"\u200E+" + fa(totalDailyPowerDrip)}
                      label="قدرت/روز"
                    />
                  )}
                </View>

                <View style={styles.powerRow}>
                  <Text variant="display" weight="extrabold" style={TABULAR}>
                    {fa(player.power ?? 0)}
                  </Text>
                  <Text variant="caption" color="secondary">
                    قدرت فعلی
                  </Text>
                </View>

                <View style={styles.xpBlock}>
                  <View style={styles.xpLabels}>
                    <Text variant="caption" color="secondary">
                      پیشرفت رده بعدی
                    </Text>
                    <Text variant="caption" weight="semibold" style={TABULAR}>
                      {isMaxTier
                        ? "بالاترین رده"
                        : `${fa(currentXp)} / ${fa(nextTierXp)} (${fa(xpPercent)}٪)`}
                    </Text>
                  </View>
                  <ProgressBar percent={xpPercent} height={8} tone="brass" delay={200} />
                </View>
              </Card>
            </Animated.View>

            {/* ─── Four-factor stats ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(1))}>
              <Card style={styles.card}>
                <Text variant="label" color="brand">
                  آمار ۴ گانه اقتصاد
                </Text>
                <View style={styles.statList}>
                  <StatBar
                    icon="flash"
                    label="قدرت"
                    value={player.power ?? 0}
                    maxValue={500}
                    tone="terracotta"
                    delay={100}
                  />
                  <StatBar
                    icon="cash"
                    label="ثروت"
                    value={Math.min(player.wealth, 999999)}
                    maxValue={100000}
                    tone="brass"
                    delay={180}
                  />
                  <StatBar
                    icon="flame"
                    label="فعالیت"
                    value={player.activity}
                    maxValue={100}
                    tone="ember"
                    delay={260}
                  />
                  <StatBar
                    icon="star"
                    label="محبوبیت"
                    value={player.popularity}
                    maxValue={200}
                    tone="jade"
                    delay={340}
                  />
                </View>
              </Card>
            </Animated.View>

            {/* ─── Resources ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(2))}>
              <Card style={styles.card}>
                <Text variant="label" color="brand">
                  {lang.hud.resources}
                </Text>
                <View style={styles.resourceGrid}>
                  <ResourceTile icon="cash" tone="brass" label={lang.resources.gold} value={player.resources.gold} />
                  <ResourceTile icon="nutrition" tone="jade" label={lang.resources.food} value={player.resources.food} />
                  <ResourceTile icon="layers" tone="ember" label={lang.resources.wood} value={player.resources.wood} />
                  <ResourceTile icon="cube" tone="steel" label={lang.resources.stone} value={player.resources.stone} />
                  <ResourceTile icon="people" tone="neutral" label={lang.resources.population} value={player.resources.population} />
                </View>
              </Card>
            </Animated.View>

            {/* ─── Progress summary ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(3))}>
              <Card style={styles.card}>
                <Text variant="label" color="brand">
                  خلاصه پیشرفت
                </Text>
                <StatRow label={lang.player.territory} value={`${fa(player.ownedTileIds.length)} قطعه`} />
                <StatRow label={lang.player.buildings} value={`${fa(player.buildingIds.length)} سازه`} />
                <StatRow label="امتیاز کل" value={fa(player.score)} last />
              </Card>
            </Animated.View>
          </>
        ) : tab === "account" ? (
          <>
            {/* ─── Account & security ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(0))}>
              <Card style={styles.card}>
                <View style={styles.infoRow}>
                  <IconPlate name="mail" size="sm" tone="steel" />
                  <View style={styles.infoTexts}>
                    <Text variant="caption" color="secondary">
                      ایمیل
                    </Text>
                    <Text variant="body" weight="medium" numberOfLines={1}>
                      {session?.user?.email ?? "نامشخص"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconPlate
                    name={isGoogleUser ? "checkmark-circle" : "link"}
                    size="sm"
                    tone={isGoogleUser ? "jade" : "steel"}
                  />
                  <View style={styles.infoTexts}>
                    <Text variant="caption" color="secondary">
                      گوگل
                    </Text>
                    <Text variant="body" weight="medium">
                      {isGoogleUser ? "حساب گوگل متصل شده" : "حساب گوگل متصل نیست"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {!isGoogleUser && (
                  <Button
                    label="اتصال حساب گوگل"
                    onPress={handleLinkGoogle}
                    variant="secondary"
                    fullWidth
                    loading={loading}
                    style={styles.actionBtn}
                  />
                )}
                <Button
                  label={isGoogleUser ? "تنظیم رمز عبور" : "فراموشی رمز عبور"}
                  onPress={() => router.push("/auth/forgot-password" as any)}
                  variant="secondary"
                  fullWidth
                  disabled={loading}
                  style={styles.actionBtn}
                />

                <Pressable
                  onPress={handleLogout}
                  disabled={loading}
                  style={({ pressed }) => [styles.logoutRow, pressed && styles.logoutPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="خروج از حساب"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={c.crimson} />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={18} color={c.crimson} />
                      <Text variant="body" weight="semibold" style={{ color: c.crimson }}>
                        خروج از حساب
                      </Text>
                    </>
                  )}
                </Pressable>
              </Card>
            </Animated.View>

            {/* ─── Membership ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(1))}>
              <Card style={styles.card}>
                <StatRow
                  label={lang.player.joined}
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
                  last
                />
              </Card>
            </Animated.View>
          </>
        ) : (
          <>
            {/* ─── Map Mode (§Offline vs Online) ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(0))}>
              <Card style={styles.card}>
                <View style={styles.infoRow}>
                  <IconPlate
                    name={mapMode === "offline" ? "download" : "cloud"}
                    size="sm"
                    tone={mapMode === "offline" ? "brass" : "jade"}
                  />
                  <View style={styles.infoTexts}>
                    <Text variant="body" weight="medium">
                      حالت دریافت نقشه
                    </Text>
                    <Text variant="caption" color="secondary">
                      {mapMode === "offline" ? "آفلاین (ذخیره روی دستگاه)" : "آنلاین (پیش‌فرض)"}
                    </Text>
                  </View>
                </View>

                <SegmentedTabs<MapMode>
                  items={MAP_MODE_TABS}
                  value={mapMode}
                  onChange={handleMapModeChange}
                  style={styles.themeTabs}
                />

                <Text variant="caption" color="secondary" style={styles.settingDesc}>
                  {mapMode === "offline"
                    ? "کاشی‌های نقشه تهران روی حافظه دستگاه ذخیره می‌شوند تا بدون نیاز به اینترنت و با بیشترین سرعت بارگذاری شوند."
                    : "کاشی‌ها به صورت برخط و آنلاین از اینترنت دریافت می‌شوند. حداقل مصرف حافظه دستگاه (پیش‌فرض)."}
                </Text>

                {Platform.OS !== "web" ? (
                  mapMode === "offline" && (
                    <View style={styles.offlineBox}>
                      <View style={styles.offlineHeader}>
                        <Text
                          variant="caption"
                          weight="medium"
                          color={offlineTiles.status === "error" ? "error" : "brand"}
                        >
                          {offlineTiles.status === "ready"
                            ? "✓ بسته آفلاین تهران آماده و ذخیره شده است"
                            : offlineTiles.status === "downloading"
                            ? `در حال دانلود نقشه آفلاین (${fa(offlineTiles.progress)}٪)...`
                            : offlineTiles.status === "error"
                            ? "خطا در دانلود نقشه آفلاین"
                            : "در حال بررسی وضعیت بسته آفلاین..."}
                        </Text>
                      </View>

                      {offlineTiles.status === "downloading" && (
                        <ProgressBar percent={offlineTiles.progress} height={6} tone="neon" delay={0} />
                      )}

                      {offlineTiles.status === "error" && (
                        <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                          {offlineTiles.error ?? "مشکلی در دریافت پیش آمد."}
                        </Text>
                      )}

                      <Button
                        label={
                          offlineTiles.status === "downloading"
                            ? "در حال دریافت..."
                            : "دانلود مجدد / به‌روزرسانی بسته آفلاین"
                        }
                        onPress={handleRefreshOfflineMap}
                        variant="secondary"
                        fullWidth
                        disabled={offlineTiles.status === "downloading"}
                        style={styles.actionBtn}
                      />
                    </View>
                  )
                ) : (
                  <View style={styles.webNote}>
                    <Text variant="caption" color="secondary">
                      ℹ️ در نسخه وب نقشه همواره به صورت آنلاین دریافت می‌شود.
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* ─── Map Visual Toggles ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(1))}>
              <Card style={styles.card}>
                <Text variant="label" color="brand">
                  تنظیمات نمایش نقشه
                </Text>

                <ToggleRow
                  icon="layers"
                  label="نمایش مرزها و سایه محله‌ها"
                  value={showDistrictsOverlay}
                  onToggle={() => {
                    setShowDistrictsOverlay(!showDistrictsOverlay);
                    GameAudio.playTap();
                  }}
                />
                <View style={styles.divider} />
                <ToggleRow
                  icon="people"
                  label="نمایش املاک سایر بازیکنان"
                  value={showOtherPlayersAssets}
                  onToggle={() => {
                    setShowOtherPlayersAssets(!showOtherPlayersAssets);
                    GameAudio.playTap();
                  }}
                />
              </Card>
            </Animated.View>

            {/* ─── Appearance (Theme switcher) ─── */}
            <Animated.View entering={FadeInDown.delay(Motion.stagger(2))}>
              <Card style={styles.card}>
                <View style={styles.infoRow}>
                  <IconPlate
                    name={isDark ? "moon" : "sunny"}
                    size="sm"
                    tone={isDark ? "steel" : "brass"}
                  />
                  <View style={styles.infoTexts}>
                    <Text variant="body" weight="medium">
                      حالت نمایش
                    </Text>
                    <Text variant="caption" color="secondary">
                      {PREF_LABEL[preference]}
                    </Text>
                  </View>
                </View>
                <SegmentedTabs<ThemeMode>
                  items={THEME_TABS}
                  value={preference}
                  onChange={handleThemeChange}
                  style={styles.themeTabs}
                />
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Local pieces ─────────────────────────────────────────────────────────────

const ResourceTile: React.FC<{
  icon: React.ComponentProps<typeof IconPlate>["name"];
  tone: React.ComponentProps<typeof IconPlate>["tone"];
  label: string;
  value: number;
}> = ({ icon, tone, label, value }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.tile}>
      <IconPlate name={icon} size="sm" tone={tone} />
      <View style={styles.tileTexts}>
        <Text variant="body" weight="bold" style={TABULAR}>
          {fa(value)}
        </Text>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const StatRow: React.FC<{ label: string; value: string; last?: boolean }> = ({
  label,
  value,
  last,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text variant="body" weight="bold" style={TABULAR}>
        {value}
      </Text>
      <Text variant="body" color="secondary">
        {label}
      </Text>
    </View>
  );
};

const ToggleRow: React.FC<{
  icon: React.ComponentProps<typeof IconPlate>["name"];
  label: string;
  value: boolean;
  onToggle: () => void;
}> = ({ icon, label, value, onToggle }) => {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ selected: value }}
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        minHeight: 44,
      }}
    >
      <IconPlate name={icon} tone="steel" size="sm" />
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium">
          {label}
        </Text>
      </View>
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: Radii.full,
          backgroundColor: value ? `${c.jade}33` : c.ink[500],
          borderWidth: 1,
          borderColor: value ? `${c.jade}66` : c.border.default,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: Radii.full,
            backgroundColor: value ? c.jade : c.text.muted,
            transform: [{ translateX: value ? -10 : 10 }],
          }}
        />
      </View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg.primary,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg.primary,
    },

    // Identity header
    header: {
      alignItems: "center",
      gap: Spacing.sm,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border.subtle,
    },
    avatarBlock: {
      alignItems: "center",
      gap: Spacing.sm,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.ink[600],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.brass[400],
    },
    avatarXp: {
      width: 96,
    },
    tierLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
    },
    tierDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rankChip: {
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    rankText: {
      writingDirection: "ltr",
      textAlign: "center",
    },
    tabs: {
      alignSelf: "stretch",
      marginTop: Spacing.sm,
    },

    // Cards
    card: {
      gap: Spacing.md,
    },
    tierHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    tierId: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    powerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing.sm,
    },
    xpBlock: {
      gap: Spacing.xs + 2,
    },
    xpLabels: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    statList: {
      gap: Spacing.md + 2,
    },
    resourceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },

    // Resource tiles
    tile: {
      flexGrow: 1,
      flexBasis: "45%",
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.md,
      padding: Spacing.sm + 2,
    },
    tileTexts: {
      flexShrink: 1,
      gap: 1,
    },

    // Summary rows
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border.subtle,
    },
    rowLast: {
      borderBottomWidth: 0,
    },

    // Account
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.xs + 2,
    },
    infoTexts: {
      flex: 1,
      gap: 1,
    },
    divider: {
      height: 1,
      backgroundColor: c.border.subtle,
      marginVertical: Spacing.xs,
    },
    actionBtn: {
      marginTop: Spacing.xs,
    },
    themeTabs: {
      minHeight: 44,
      alignSelf: "stretch",
    },
    logoutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm + 4,
      borderRadius: Radii.md,
      backgroundColor: `${c.crimson}1A`,
      borderWidth: 1,
      borderColor: `${c.crimson}59`,
    },
    logoutPressed: {
      opacity: 0.8,
    },
    settingDesc: {
      marginTop: Spacing.sm,
      lineHeight: 18,
    },
    offlineBox: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radii.md,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      gap: Spacing.sm,
    },
    offlineHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    webNote: {
      marginTop: Spacing.sm,
      padding: Spacing.sm,
      borderRadius: Radii.sm,
      backgroundColor: c.ink[600],
    },
  });
