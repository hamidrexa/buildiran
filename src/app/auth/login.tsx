/**
 * BuildIran — Login Screen (redesigned)
 */

import { Text } from "@/components/ui/Text";
import { showAlert } from "@/lib/alert";
import { GameAudio } from "@/lib/audio";
import {
  useFloatIn,
  useGlowPulse,
  useParticle,
  useScalePop,
  useShake,
} from "@/lib/effects";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const Particle: React.FC<{
  index: number;
  x: number;
  size: number;
  color: string;
}> = ({ index, x, size, color }) => {
  const { style } = useParticle(index);
  return (
    <Animated.View
      style={[
        particleStyles.particle,
        {
          left: x,
          bottom: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
};

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  index: i,
  x: Math.floor(Math.random() * (SCREEN_W - 10)),
  size: Math.floor(2 + Math.random() * 6),
  color: ["#6C63FF", "#FF6B6B", "#FFD93D", "#4ECDC4", "#A78BFA"][i % 5],
}));

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );

  const passwordRef = useRef<TextInput>(null);

  const logoGlow = useGlowPulse(0.6, 1.0);
  const formFloat = useFloatIn(150);
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
          { id: user.id, username, avatar_color: "#6C63FF" },
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
                    avatar_color: "#6C63FF",
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
      <LinearGradient
        colors={["#080C1A", "#0D1533", "#110A2E"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />
      <View style={[styles.orb, styles.orbCenter]} />
      {PARTICLES.map((p) => (
        <Particle key={p.index} {...p} />
      ))}

      {/* Always-visible register CTA — new users see this immediately, no scrolling */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.registerBar, { top: insets.top + 10 }]}
      >
        <Text style={styles.registerBarText}>حساب ندارید؟</Text>
        <TouchableOpacity
          style={styles.registerBarBtn}
          onPress={() => {
            GameAudio.playTap();
            router.push("/auth/register" as any);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBarBtnText}>🚀 ثبت‌نام رایگان</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 64 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            style={styles.logoSection}
          >
            <Animated.View style={[styles.logoRing, logoGlow.style]}>
              <LinearGradient
                colors={["#6C63FF", "#A78BFA", "#EC4899"]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>🏰</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(200).duration(600)}>
              <Text style={styles.appName}>بیلد ایران</Text>
              <Text style={styles.tagline}>قلمرو خود را بسازید</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[styles.card, formFloat.style, formShake.style]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardTitle}>ورود به بازی</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ایمیل</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#6C63FF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <TouchableOpacity
                  onPress={() => router.push("/auth/forgot-password" as any)}
                >
                  <Text style={styles.forgotText}>فراموشی رمز؟</Text>
                </TouchableOpacity>
                <Text style={styles.fieldLabel}>رمز عبور</Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "password" && styles.inputWrapperFocused,
                ]}
              >
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.inputIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#6C63FF"
                  />
                </TouchableOpacity>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  textAlign="right"
                />
              </View>
            </View>

            <Animated.View style={buttonScale.style}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#6C63FF", "#A78BFA"]}
                  style={styles.loginBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginBtnText}>⚔️ وارد شوید</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>یا</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleBtnText}>ورود با حساب گوگل</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <TouchableOpacity
                onPress={() => router.push("/auth/register" as any)}
              >
                <Text style={styles.registerLink}>ثبت نام کنید</Text>
              </TouchableOpacity>
              <Text style={styles.registerPrompt}>حساب ندارید؟ </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 BuildIran · تمام حقوق محفوظ است
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080C1A", overflow: "hidden" }, // <-- fixes whitespace/scroll bug
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },

  registerBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  registerBarText: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  registerBarBtn: {
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(236,72,153,0.18)",
    borderWidth: 1,
    borderColor: "#EC4899",
  },
  registerBarBtnText: { color: "#F9A8D4", fontSize: 13, fontWeight: "800" },

  orb: { position: "absolute", borderRadius: 999, opacity: 0.18 },
  orbTopLeft: {
    width: 280,
    height: 280,
    backgroundColor: "#6C63FF",
    top: -80,
    left: -80,
  },
  orbBottomRight: {
    width: 240,
    height: 240,
    backgroundColor: "#EC4899",
    bottom: -60,
    right: -60,
  },
  orbCenter: {
    width: 180,
    height: 180,
    backgroundColor: "#FFD93D",
    top: "40%",
    left: "25%",
    opacity: 0.08,
  },

  logoSection: { alignItems: "center", gap: 16 },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "rgba(108, 99, 255, 0.6)",
    shadowColor: "#6C63FF",
    shadowRadius: 24,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 42 },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "#6C63FF",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 4,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(108, 99, 255, 0.25)",
    padding: 24,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    shadowColor: "#6C63FF",
    shadowRadius: 30,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: { color: "#A78BFA", fontSize: 12 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(108, 99, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(108,99,255,0.1)",
  },
  inputIcon: { width: 24, alignItems: "center" },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },

  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: "#6C63FF",
    shadowRadius: 16,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  loginBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dividerText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  googleBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },

  guestBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  guestBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  registerPrompt: { color: "rgba(255,255,255,0.45)", fontSize: 14 },
  registerLink: {
    color: "#A78BFA",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  footer: { alignItems: "center" },
  footerText: { color: "rgba(255,255,255,0.2)", fontSize: 11 },
});

const particleStyles = StyleSheet.create({
  particle: { position: "absolute" },
});
