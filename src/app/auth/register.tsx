/**
 * BuildIran — Register Screen («Gentleman Neon» v2)
 * New player signup: username, email, password + commander color picker.
 * Creates Supabase auth user + profiles row via trigger. Logic unchanged.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BrandCrest } from "@/components/brand/BrandLogos";
import { IconPlate } from "@/components/ui/IconPlate";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { useGlowPulse, useScalePop, useShake } from "@/lib/effects";
import { supabase } from "@/lib/supabase";
import { Motion, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// ── The Shahriyar shield mark ────────────────────────────────────────────────
const ShieldMark: React.FC = () => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.markWrap}>
      <View style={styles.markRing} />
      <BrandCrest style={styles.markImage} />
    </View>
  );
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  // Commander palette — drawn from the theme (mode-aware, no ad-hoc hexes).
  const avatarColors = useMemo(
    () => [
      c.brass[400],
      c.tier[6],
      c.jade,
      c.steel,
      c.ember,
      c.crimson,
      c.terracotta,
      c.medal[2],
      c.tier[1],
      c.ivory,
    ],
    [c],
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(avatarColors[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // The ONE looping animation on this screen — subtle shield-mark glow.
  const markGlow = useGlowPulse(0.7, 1.0);
  const buttonScale = useScalePop();
  const formShake = useShake();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert("خطا", "لطفاً تمام فیلدها را پر کنید.");
      return;
    }
    if (password !== confirmPassword) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert("خطا", "رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    if (password.length < 6) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert("خطا", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (username.trim().length < 3) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert("خطا", "نام کاربری باید حداقل ۳ کاراکتر باشد.");
      return;
    }

    buttonScale.pop();
    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: username.trim(),
            avatar_color: selectedColor,
          },
        },
      });

      if (authError) throw authError;

      // 2. Upsert profile (in case trigger didn't fire yet)
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            username: username.trim(),
            avatar_color: selectedColor,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          console.warn(
            "[Register] Profile upsert error:",
            profileError.message,
          );
        }
      }

      // 3. Auto-login after successful registration
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          console.warn("[Register] Auto-login failed:", signInError.message);
          // Fallback to redirect to login page if auto-login fails
          await GameAudio.playLevelUp();
          Alert.alert(
            "ثبت نام موفق!",
            "به شهریار خوش آمدید. اکنون می‌توانید وارد شوید.",
            [
              {
                text: "ورود",
                onPress: () => router.replace("/auth/login" as any),
              },
            ],
          );
        } else {
          // Auto-login successful - redirect to game
          await GameAudio.playLevelUp();
          router.replace("/(game)");
        }
      } catch (loginErr: any) {
        console.warn("[Register] Auto-login error:", loginErr.message);
        // Fallback to redirect to login page if auto-login fails
        await GameAudio.playLevelUp();
        Alert.alert(
          "ثبت نام موفق!",
          "به شهریار خوش آمدید. اکنون می‌توانید وارد شوید.",
          [
            {
              text: "ورود",
              onPress: () => router.replace("/auth/login" as any),
            },
          ],
        );
      }
    } catch (err: any) {
      GameAudio.playError();
      formShake.shake();
      const msg = err.message?.includes("already registered")
        ? "این ایمیل قبلاً ثبت شده است."
        : err.message?.includes("Username")
          ? "این نام کاربری قبلاً استفاده شده است."
          : (err.message ?? "خطایی رخ داد. دوباره تلاش کنید.");
      Alert.alert("خطای ثبت نام", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackdrop />

      {/* Top bar: back + quiet login switch */}
      <Animated.View
        entering={FadeIn.duration(Motion.durations.normal)}
        style={[styles.topBar, { top: insets.top + Spacing.sm + 2 }]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
        >
          <IconPlate name="chevron-back" size="xs" tone="neutral" />
        </Pressable>
        <View style={styles.topBarSpacer} />
        <Button
          label="ورود"
          variant="secondary"
          size="sm"
          onPress={() => {
            GameAudio.playTap();
            router.replace("/auth/login" as any);
          }}
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
              <ShieldMark />
            </Animated.View>
            <Text variant="heading" weight="extrabold" color="primary" center>
              ثبت نام فرمانده
            </Text>
            <Text variant="body" color="secondary" center>
              به قلمرو شهریار بپیوندید
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
                {/* Commander color picker */}
                <View style={styles.colorSection}>
                  <Text variant="label" color="secondary">
                    رنگ فرمانده شما
                  </Text>
                  <View style={styles.colorRow}>
                    <View
                      style={[
                        styles.avatarPreview,
                        { backgroundColor: selectedColor },
                      ]}
                    >
                      <Text variant="subtitle" weight="bold" color="inverse">
                        {username ? username.charAt(0).toUpperCase() : "?"}
                      </Text>
                    </View>
                    <View style={styles.colorGrid}>
                      {avatarColors.map((color, i) => (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorDot,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorDotSelected,
                          ]}
                          onPress={() => {
                            setSelectedColor(color);
                            GameAudio.playTap();
                          }}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`رنگ ${(i + 1).toLocaleString("fa-IR")}`}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                <Input
                  label="نام کاربری"
                  icon="person-outline"
                  placeholder="نام فرمانده (نام کاربری)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                />

                <Input
                  label="ایمیل"
                  icon="mail-outline"
                  placeholder="ایمیل"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />

                <Input
                  label="رمز عبور"
                  icon="lock-closed-outline"
                  placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="next"
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

                <Input
                  label="تکرار رمز عبور"
                  icon="lock-closed-outline"
                  placeholder="تکرار رمز عبور"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />

                <Animated.View style={buttonScale.style}>
                  <Button
                    label="ساخت حساب"
                    onPress={handleRegister}
                    loading={loading}
                    size="lg"
                    fullWidth
                  />
                </Animated.View>

                <View style={styles.loginRow}>
                  <Pressable
                    onPress={() => router.replace("/auth/login" as any)}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  >
                    <Text variant="body" weight="medium" color="brand">
                      وارد شوید
                    </Text>
                  </Pressable>
                  <Text variant="body" color="secondary">حساب دارید؟ </Text>
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

    // Top bar
    topBar: {
      position: "absolute",
      start: Spacing.lg,
      end: Spacing.lg,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    topBarSpacer: { flex: 1 },

    // Hero — shield mark
    hero: {
      alignItems: "center",
      gap: Spacing.sm + 4,
    },
    markWrap: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
      backgroundColor: c.ink[950],
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
      width: 52,
      height: 74,
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

    // Color picker
    colorSection: { gap: Spacing.sm },
    colorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.lg,
    },
    avatarPreview: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border.default,
    },
    colorGrid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    colorDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    colorDotSelected: {
      borderWidth: 2,
      borderColor: c.ivory,
      transform: [{ scale: 1.12 }],
    },

    eyeBtn: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      marginStart: Spacing.xs,
    },

    loginRow: {
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
