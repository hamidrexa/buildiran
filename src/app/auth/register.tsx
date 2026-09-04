/**
 * BuildIran — Register Screen
 * New player signup: username, email, password + avatar color picker.
 * Creates Supabase auth user + profiles row via trigger.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useFloatIn, useScalePop, useShake } from '@/lib/effects';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';

const AVATAR_COLORS = [
  '#6C63FF', '#EC4899', '#FFD93D', '#4ECDC4', '#FF6B6B',
  '#A78BFA', '#34D399', '#FB923C', '#60A5FA', '#F472B6',
];

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formFloat = useFloatIn(100);
  const buttonScale = useScalePop();
  const formShake = useShake();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert('خطا', 'لطفاً تمام فیلدها را پر کنید.');
      return;
    }
    if (password !== confirmPassword) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert('خطا', 'رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }
    if (password.length < 6) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert('خطا', 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (username.trim().length < 3) {
      formShake.shake();
      GameAudio.playError();
      Alert.alert('خطا', 'نام کاربری باید حداقل ۳ کاراکتر باشد.');
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
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: username.trim(),
            avatar_color: selectedColor,
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('[Register] Profile upsert error:', profileError.message);
        }
      }

      await GameAudio.playLevelUp();
      Alert.alert(
        '🎉 ثبت نام موفق!',
        'به بیلد ایران خوش آمدید. اکنون می‌توانید وارد شوید.',
        [{ text: 'ورود', onPress: () => router.replace('/auth/login' as any) }]
      );
    } catch (err: any) {
      GameAudio.playError();
      formShake.shake();
      const msg =
        err.message?.includes('already registered')
          ? 'این ایمیل قبلاً ثبت شده است.'
          : err.message?.includes('Username')
          ? 'این نام کاربری قبلاً استفاده شده است.'
          : err.message ?? 'خطایی رخ داد. دوباره تلاش کنید.';
      Alert.alert('خطای ثبت نام', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#080C1A', '#0D1533', '#110A2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#A78BFA" />
            </TouchableOpacity>
            <View style={styles.headerLogo}>
              <Text style={styles.headerEmoji}>⚔️</Text>
            </View>
            <Text style={styles.headerTitle}>ثبت نام فرمانده</Text>
            <Text style={styles.headerSub}>به قلمرو بیلد ایران بپیوندید</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.card, formFloat.style, formShake.style]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Avatar Color Picker */}
            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>رنگ فرمانده شما</Text>
              <View style={styles.colorPreview}>
                <LinearGradient
                  colors={[selectedColor, selectedColor + '88']}
                  style={styles.avatarPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarLetter}>
                    {username ? username.charAt(0).toUpperCase() : '?'}
                  </Text>
                </LinearGradient>
                <View style={styles.colorGrid}>
                  {AVATAR_COLORS.map((color) => (
                    <TouchableOpacity
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
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#6C63FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="نام فرمانده (نام کاربری)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
                textAlign="right"
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#6C63FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ایمیل"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                textAlign="right"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#6C63FF"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                textAlign="right"
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6C63FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="تکرار رمز عبور"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                textAlign="right"
              />
            </View>

            {/* Register Button */}
            <Animated.View style={buttonScale.style}>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC4899', '#A78BFA', '#6C63FF']}
                  style={styles.registerBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerBtnText}>🏰  ایجاد فرماندهی</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <TouchableOpacity onPress={() => router.replace('/auth/login' as any)}>
                <Text style={styles.loginLink}>وارد شوید</Text>
              </TouchableOpacity>
              <Text style={styles.loginPrompt}>حساب دارید؟ </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C1A' },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 24,
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  orbTop: { width: 250, height: 250, backgroundColor: '#A78BFA', top: -60, right: -40 },
  orbBottom: { width: 200, height: 200, backgroundColor: '#EC4899', bottom: -40, left: -40 },

  header: { alignItems: 'center', gap: 10, width: '100%' },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  headerLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.25)',
    padding: 24,
    gap: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#EC4899',
    shadowRadius: 30,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Color picker
  colorSection: { gap: 10 },
  colorLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'right' },
  colorPreview: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarPreview: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowRadius: 12,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  avatarLetter: { fontSize: 24, fontWeight: '800', color: '#fff' },
  colorGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.2 }],
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: 10,
  },
  inputIcon: { width: 24, alignItems: 'center' },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },

  registerBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#EC4899',
    shadowRadius: 16,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  registerBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginPrompt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  loginLink: { color: '#A78BFA', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
