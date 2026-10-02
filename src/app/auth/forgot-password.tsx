/**
 * BuildIran — Forgot Password Screen («Gentleman Neon» v2)
 * Email reset request; success state via EmptyState. Logic unchanged.
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPlate } from "@/components/ui/IconPlate";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { useGlowPulse, useScalePop } from "@/lib/effects";
import { supabase } from "@/lib/supabase";
import { Motion, Spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
  Image,
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // The ONE looping animation on this screen — subtle arch-mark glow.
  const markGlow = useGlowPulse(0.7, 1.0);
  const buttonScale = useScalePop();

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("خطا", "لطفاً ایمیل خود را وارد کنید.");
      return;
    }
    buttonScale.pop();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: "buildiran://auth/reset-password" },
      );
      if (error) throw error;
      await GameAudio.playTap();
      setSent(true);
    } catch (err: any) {
      GameAudio.playError();
      Alert.alert("خطا", err.message ?? "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackdrop />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 72,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          {/* Top bar: back */}
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
          </Animated.View>

          {/* Hero — the architect's mark */}
          <Animated.View
            entering={FadeInDown.duration(Motion.durations.slow)}
            style={styles.hero}
          >
            <Animated.View style={markGlow.style}>
              <ArchMark />
            </Animated.View>
            <Text variant="heading" weight="extrabold" color="primary" center>
              بازیابی رمز عبور
            </Text>
            <Text variant="body" color="secondary" center>
              {sent
                ? "لینک بازیابی به ایمیل شما ارسال شد."
                : "ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود."}
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.delay(Motion.stagger(3)).duration(
              Motion.durations.slow,
            )}
            style={styles.cardWrapper}
          >
            <Card cornerTicks elevated>
              <View style={styles.form}>
                {sent ? (
                  <EmptyState
                    icon="mail-outline"
                    tone="jade"
                    title="ایمیل ارسال شد!"
                    body={`لینک بازیابی به ${email} ارسال شد. صندوق ورودی خود را بررسی کنید.`}
                    actionLabel="بازگشت به ورود"
                    onAction={() => router.replace("/auth/login" as any)}
                  />
                ) : (
                  <>
                    <Input
                      label="ایمیل"
                      icon="mail-outline"
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="done"
                      onSubmitEditing={handleReset}
                    />

                    <Animated.View style={buttonScale.style}>
                      <Button
                        label="ارسال لینک بازیابی"
                        onPress={handleReset}
                        loading={loading}
                        size="lg"
                        fullWidth
                      />
                    </Animated.View>
                  </>
                )}
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
        </View>
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
    content: {
      flex: 1,
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
    form: {
      gap: Spacing.lg,
    },

    footer: { alignItems: "center" },
    footerText: {
      fontVariant: ["tabular-nums"],
    },
  });
