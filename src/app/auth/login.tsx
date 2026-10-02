/**
 * BuildIran — Login Screen («Gentleman Neon» v2)
 * Mode-aware ink/ivory canvas, blueprint dot-grid, one soft brass glow
 * and the architect's arch mark. All auth logic unchanged.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { showAlert } from "@/lib/alert";
import { GameAudio } from "@/lib/audio";
import { useGlowPulse, useScalePop, useShake } from "@/lib/effects";
import { supabase } from "@/lib/supabase";
import { Motion, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
  Image,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ── Blueprint backdrop — sparse dot lattice + one soft brass glow ────────────
const GRID_COLS = 8;
const GRID_ROWS = 7;
const GRID_DOTS = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => ({
  start: ((i % GRID_COLS) + 0.5) * (SCREEN_W / GRID_COLS),
  top: (Math.floor(i / GRID_COLS) + 0.5) * (SCREEN_H / GRID_ROWS),
}));

const AuthBackdrop: React.FC = () => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[`${c.brass[400]}0F`, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.glow}
      />
      {GRID_DOTS.map((dot, i) => (
        <View
          key={i}
          style={[styles.gridDot, { start: dot.start - 1, top: dot.top - 1 }]}
        />
      ))}
    </View>
  );
};

// ── The architect's arch mark (same construction as LoadingScreen) ───────────
const ArchMark: React.FC = () => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.markWrap}>
      <View style={styles.markRing} />
      <Image
        source={require("../../../assets/images/splash-icon.png")}
        style={styles.markImage}
        resizeMode="contain"
      />
    </View>
  );
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // The ONE looping animation on this screen — subtle arch-mark glow.
  const markGlow = useGlowPulse(0.7, 1.0);
  const buttonScale = useScalePop();
  const formShake = useShake();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      formShake.shake();
      GameAudio.playError();
      return;
    }
    buttonScale.pop();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      await GameAudio.playTap();
      router.replace("/(game)");
    } catch (err: any) {
      GameAudio.playError();
      formShake.shake();
      showAlert(
        "خطای ورود",
        err.message === "Invalid login credentials"
          ? "ایمیل یا رمز عبور اشتباه است."
          : (err.message ?? "خطایی رخ داد. دوباره تلاش کنید."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    buttonScale.pop();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: { username: `guest_${Math.random().toString(36).slice(2, 8)}` },
        },
      });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error("Guest session was not created.");
      const username =
        user.user_metadata?.username ?? `guest_${user.id.slice(0, 8)}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, username, avatar_color: c.brass[400] },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (profileError) throw profileError;
      await GameAudio.playTap();
      router.replace("/(game)");
    } catch (err: any) {
      GameAudio.playError();
      showAlert(
        "خطای ورود مهمان",
        err.message ?? "ورود به عنوان مهمان ممکن نیست.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    buttonScale.pop();
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL("/auth/callback");
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectUrl },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (data?.url) {
          const res = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
          );
          if (res.type === "success" && res.url) {
            const parsedUrl = Linking.parse(res.url);
            const access_token = parsedUrl.queryParams?.access_token as string;
            const refresh_token = parsedUrl.queryParams
              ?.refresh_token as string;
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("id")
                  .eq("id", user.id)
                  .single();
                if (!profile) {
                  const username =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    `player_${user.id.slice(0, 8)}`;
                  await supabase.from("profiles").insert({
                    id: user.id,
                    username,
                    avatar_color: c.brass[400],
                  });
                }
              }
              await GameAudio.playTap();
              router.replace("/(game)");
            }
          }
        }
      }
    } catch (err: any) {
      GameAudio.playError();
      showAlert(
        "خطای ورود با گوگل",
        err.message ?? "مشکلی در ورود با گوگل پیش آمد.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackdrop />

      {/* Quiet register switch — top corner */}
      <Animated.View
        entering={FadeIn.duration(Motion.durations.normal)}
        style={[styles.topBar, { top: insets.top + Spacing.sm + 2 }]}
      >
        <Text variant="caption" color="secondary">حساب ندارید؟</Text>
        <Button
          label="ثبت‌نام رایگان"
          variant="secondary"
          size="sm"
          onPress={() => {
            GameAudio.playTap();
            router.push("/auth/register" as any);
          }}
          icon={
            <Ionicons
              name="person-add-outline"
              size={13}
              color={c.brass[400]}
            />
          }
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 64,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — the architect's mark */}
          <Animated.View
            entering={FadeInDown.duration(Motion.durations.slow)}
            style={styles.hero}
          >
            <Animated.View style={markGlow.style}>
              <ArchMark />
            </Animated.View>
            <Text variant="heading" weight="extrabold" color="primary" center>
              شهریار
            </Text>
            <Text variant="body" color="secondary" center>
              قلمرو خود را بسازید
            </Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            entering={FadeInDown.delay(Motion.stagger(3)).duration(
              Motion.durations.slow,
            )}
            style={[styles.cardWrapper, formShake.style]}
          >
            <Card cornerTicks elevated style={styles.card}>
              <View style={styles.form}>
                <Text variant="title" weight="semibold" color="primary" center>
                  ورود به بازی
                </Text>

                <Input
                  label="ایمیل"
                  icon="mail-outline"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />

                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Pressable
                      onPress={() =>
                        router.push("/auth/forgot-password" as any)
                      }
                      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
                    >
                      <Text variant="caption" color="brand">
                        فراموشی رمز؟
                      </Text>
                    </Pressable>
                    <Text variant="label" color="secondary">رمز عبور</Text>
                  </View>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    trailing={
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? "پنهان کردن رمز" : "نمایش رمز"
                        }
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={18}
                          color={c.text.muted}
                        />
                      </Pressable>
                    }
                  />
                </View>

                <Animated.View style={buttonScale.style}>
                  <Button
                    label="وارد شوید"
                    onPress={handleLogin}
                    loading={loading}
                    size="lg"
                    fullWidth
                  />
                </Animated.View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text variant="caption" color="secondary">یا</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  label="ورود با حساب گوگل"
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  variant="secondary"
                  fullWidth
                  icon={
                    <Ionicons
                      name="logo-google"
                      size={15}
                      color={c.brass[400]}
                    />
                  }
                />

                <Button
                  label="ورود به عنوان مهمان"
                  onPress={handleGuestLogin}
                  disabled={loading}
                  variant="ghost"
                  fullWidth
                  icon={
                    <Ionicons
                      name="person-outline"
                      size={15}
                      color={c.text.secondary}
                    />
                  }
                />

                <View style={styles.registerRow}>
                  <Pressable
                    onPress={() => router.push("/auth/register" as any)}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  >
                    <Text variant="body" weight="medium" color="brand">
                      ثبت نام کنید
                    </Text>
                  </Pressable>
                  <Text variant="body" color="secondary">حساب ندارید؟ </Text>
                </View>
              </View>
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(Motion.stagger(6))}
            style={styles.footer}
          >
            <Text variant="caption" color="muted" center style={styles.footerText}>
              © 2026 Shahryar · تمام حقوق محفوظ است
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg.primary,
      overflow: "hidden",
    },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
      gap: Spacing.xl,
    },

    // Backdrop
    glow: {
      position: "absolute",
      top: -140,
      start: 0,
      end: 0,
      height: 460,
    },
    gridDot: {
      position: "absolute",
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.border.strong,
      opacity: 0.35,
    },

    // Top corner switch
    topBar: {
      position: "absolute",
      start: Spacing.lg,
      end: Spacing.lg,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: Spacing.sm,
    },

    // Hero — arch mark
    hero: {
      alignItems: "center",
      gap: Spacing.sm + 4,
    },
    markWrap: {
      width: 92,
      height: 92,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    markRing: {
      position: "absolute",
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 1.5,
      borderColor: c.brass[600],
    },
    markImage: {
      width: 48,
      height: 48,
    },
    mark: {
      width: 52,
      height: 56,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    markLeftLeg: {
      position: "absolute",
      start: 5,
      bottom: 0,
      width: 8,
      height: 34,
      borderTopLeftRadius: 4,
      backgroundColor: c.brass[400],
      transform: [{ skewY: "-6deg" }],
    },
    markRightLeg: {
      position: "absolute",
      end: 5,
      bottom: 0,
      width: 8,
      height: 34,
      borderTopRightRadius: 4,
      backgroundColor: c.brass[400],
      transform: [{ skewY: "6deg" }],
    },
    markArch: {
      position: "absolute",
      top: 3,
      alignSelf: "center",
      width: 28,
      height: 23,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      borderWidth: 5,
      borderBottomWidth: 0,
      borderColor: c.brass[300],
    },

    // Card
    cardWrapper: {
      width: "100%",
      maxWidth: 420,
    },
    card: {
      overflow: "hidden",
    },
    form: {
      gap: Spacing.lg,
    },

    // Fields
    fieldGroup: { gap: Spacing.xs + 2 },
    fieldLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eyeBtn: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      marginStart: Spacing.xs,
    },

    // Divider
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border.default,
    },

    registerRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.xxs,
    },

    footer: { alignItems: "center" },
    footerText: {
      fontVariant: ["tabular-nums"],
    },
  });
