/**
 * BuildIran — Propose Custom Building Modal
 * Allows any player to propose a new building type with custom features and settings.
 * The proposal is saved to Supabase and routed to neighborhood editors for revision.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { GameAudio } from '@/lib/audio';
import type { BuildingCategory } from '@/types/game.types';

const { height: SCREEN_H } = Dimensions.get('window');

interface ProposeBuildingModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { key: BuildingCategory; label: string; emoji: string }[] = [
  { key: 'commercial',  label: 'تجاری',           emoji: '🏬' },
  { key: 'tech',        label: 'فناوری و استارتاپ', emoji: '🚀' },
  { key: 'cultural',    label: 'فرهنگی و تفریحی', emoji: '🎭' },
  { key: 'residential', label: 'مسکونی مدرن',     emoji: '🏡' },
  { key: 'industrial',  label: 'صنعتی و تولیدی',  emoji: '🏭' },
  { key: 'military',    label: 'دفاعی و امنیتی',  emoji: '🛡️' },
];

const EMOJIS = ['🏛️', '☕', '🏢', '⚡', '🏥', '🔬', '🚁', '🌿', '🎪', '📡'];

export function ProposeBuildingModal({ visible, onClose }: ProposeBuildingModalProps) {
  const player = usePlayerStore((s) => s.player);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const proposeCustomBuilding = useNeighborhoodStore((s) => s.proposeCustomBuilding);

  const [nameFa, setNameFa] = useState('');
  const [code, setCode] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [category, setCategory] = useState<BuildingCategory>('commercial');
  const [baseCost, setBaseCost] = useState('4500');
  const [powerBonus, setPowerBonus] = useState('12');
  const [incomeRate, setIncomeRate] = useState('180');
  const [customFeature, setCustomFeature] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏛️');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setNameFa('');
    setCode('');
    setDescriptionFa('');
    setCustomFeature('');
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!nameFa.trim()) {
      GameAudio.playError();
      Alert.alert('خطا', 'لطفاً نام فارسی سازه را وارد کنید.');
      return;
    }
    if (!descriptionFa.trim()) {
      GameAudio.playError();
      Alert.alert('خطا', 'لطفاً توضیح مختصری درباره سازه وارد کنید.');
      return;
    }
    if (!player || !currentNeighborhood) return;

    setSubmitting(true);
    GameAudio.playTap();

    const cleanCode = (code.trim() || nameFa.trim())
      .toLowerCase()
      .replace(/[\s\u200c]+/g, '_')
      .slice(0, 24);

    try {
      const res = await proposeCustomBuilding({
        userId: player.id,
        code: cleanCode,
        nameFa: nameFa.trim(),
        descriptionFa: descriptionFa.trim(),
        neighborhoodId: currentNeighborhood.id,
        category,
        baseCost: parseInt(baseCost, 10) || 5000,
        powerBonus: parseInt(powerBonus, 10) || 10,
        incomeRate: parseInt(incomeRate, 10) || 100,
        emoji: selectedEmoji,
        customSettings: {
          specialFeature: customFeature.trim() || 'قابلیت استراتژیک محلی',
          neighborhoodName: currentNeighborhood.nameFa,
        },
      });

      if (res) {
        GameAudio.playPropose();
        setSubmitted(true);
        setTimeout(() => {
          handleClose();
        }, 2200);
      } else {
        GameAudio.playError();
        Alert.alert('خطا', 'مشکلی در ثبت طرح پیش آمد. لطفاً مجدداً تلاش کنید.');
      }
    } catch {
      GameAudio.playError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <LinearGradient
            colors={['#101736', '#080C1A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          {submitted ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>📜✨</Text>
              <Text style={styles.successTitle}>طرح سازه با موفقیت ثبت شد!</Text>
              <Text style={styles.successSub}>
                طرح برای ویرایشگران محله «{currentNeighborhood?.nameFa ?? 'منتخب'}» ارسال شد. به محض تأیید، روی نقشه قابل ساخت خواهد بود.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerEmoji}>📐</Text>
                  <Text style={styles.title}>پیشنهاد نوع سازه جدید</Text>
                </View>
                <Text style={styles.subtitle}>
                  طرح ساختمانی دلخواه خود را در محله «{currentNeighborhood?.nameFa}» طراحی کنید تا توسط ویرایشگران محله بازبینی شود.
                </Text>
              </View>

              {/* Emoji Selector */}
              <Text style={styles.label}>آیکون / نماد سازه:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnActive]}
                    onPress={() => {
                      setSelectedEmoji(emoji);
                      GameAudio.playTap();
                    }}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Persian Name */}
              <Text style={styles.label}>نام فارسی سازه: *</Text>
              <TextInput
                style={styles.input}
                value={nameFa}
                onChangeText={setNameFa}
                placeholder="مثلاً: هاب نوآوری، کافه کتاب، کلینیک تخصصی..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              {/* Category */}
              <Text style={styles.label}>دسته‌بندی:</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.catBtn, active && styles.catBtnActive]}
                      onPress={() => {
                        setCategory(c.key);
                        GameAudio.playTap();
                      }}
                    >
                      <Text style={styles.catText}>{c.emoji} {c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Description */}
              <Text style={styles.label}>توضیحات و کارکرد: *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descriptionFa}
                onChangeText={setDescriptionFa}
                multiline
                numberOfLines={3}
                placeholder="این سازه چه ویژگی دارد و چه سودی به بازیکنان این محله می‌رساند؟"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.labelSmall}>هزینه ساخت (💰):</Text>
                  <TextInput
                    style={styles.statInput}
                    value={baseCost}
                    onChangeText={setBaseCost}
                    keyboardType="numeric"
                    placeholder="5000"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.labelSmall}>پاداش قدرت (⚔️):</Text>
                  <TextInput
                    style={styles.statInput}
                    value={powerBonus}
                    onChangeText={setPowerBonus}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.labelSmall}>درآمد ساعتی (🪙):</Text>
                  <TextInput
                    style={styles.statInput}
                    value={incomeRate}
                    onChangeText={setIncomeRate}
                    keyboardType="numeric"
                    placeholder="150"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>

              {/* Custom Feature */}
              <Text style={styles.label}>ویژگی یا تنظیمات ویژه (Special Setting):</Text>
              <TextInput
                style={styles.input}
                value={customFeature}
                onChangeText={setCustomFeature}
                placeholder="مثلاً: تخفیف ۱۰٪ مالیات، پناهگاه در زمان جنگ، تقویت تجارت..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#6C63FF', '#8B5CF6']}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>🚀  ارسال طرح برای ویرایشگران محله</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    maxHeight: SCREEN_H * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.4)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { marginBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 20 },

  label: { fontSize: 13, fontWeight: '700', color: '#CBD5E1', marginTop: 12, marginBottom: 6 },
  labelSmall: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },

  emojiRow: { flexDirection: 'row', marginBottom: 6 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emojiBtnActive: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108,99,255,0.25)',
  },
  emojiText: { fontSize: 22 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  textArea: { height: 75, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catBtnActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.25)',
  },
  catText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCol: { flex: 1 },
  statInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  submitBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { opacity: 0.5 },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  successContainer: { alignItems: 'center', justifyContent: 'center', padding: 36, gap: 12 },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#34D399', textAlign: 'center' },
  successSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
