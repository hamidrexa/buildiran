/**
 * BuildIran — Forgot Password Screen
 */

import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { useFloatIn, useScalePop } from "@/lib/effects";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const formFloat = useFloatIn(100);
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
      <LinearGradient
        colors={["#080C1A", "#0D1533", "#110A2E"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.orb,
          { top: -80, left: -60, backgroundColor: "#4ECDC4" },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color="#A78BFA" />
            </TouchableOpacity>
            <Text style={styles.title}>بازیابی رمز عبور</Text>
            <Text style={styles.subtitle}>
              {sent
                ? "لینک بازیابی به ایمیل شما ارسال شد."
                : "ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود."}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.card, formFloat.style]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)"]}
              style={StyleSheet.absoluteFill}
            />

            {sent ? (
              <View style={styles.sentBox}>
                <Text style={styles.sentIcon}>📬</Text>
                <Text style={styles.sentTitle}>ایمیل ارسال شد!</Text>
                <Text style={styles.sentBody}>
                  لینک بازیابی به {email} ارسال شد. صندوق ورودی خود را بررسی
                  کنید.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/auth/login" as any)}
                  style={styles.returnBtn}
                >
                  <Text style={styles.returnBtnText}>بازگشت به ورود</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#4ECDC4"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ایمیل"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                    textAlign="right"
                  />
                </View>

                <Animated.View style={buttonScale.style}>
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={handleReset}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#4ECDC4", "#6C63FF"]}
                      style={styles.sendBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.sendBtnText}>
                          📧 ارسال لینک بازیابی
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080C1A", overflow: "hidden" },
  flex: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  orb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
  },
  header: { width: "100%", gap: 10 },
  backBtn: {
    alignSelf: "flex-start",
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 22 },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.25)",
    padding: 24,
    gap: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.3)",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    gap: 10,
  },
  inputIcon: { width: 24, alignItems: "center" },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  sendBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#4ECDC4",
    shadowRadius: 16,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sendBtnGradient: { paddingVertical: 16, alignItems: "center" },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sentBox: { alignItems: "center", gap: 12, paddingVertical: 8 },
  sentIcon: { fontSize: 52 },
  sentTitle: { fontSize: 22, fontWeight: "700", color: "#4ECDC4" },
  sentBody: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
  },
  returnBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(108,99,255,0.25)",
    borderWidth: 1,
    borderColor: "#6C63FF",
  },
  returnBtnText: { color: "#A78BFA", fontWeight: "700" },
});
