/**
 * BuildIran — Propose Custom Building Modal (v2 «Gentleman Neon», dual theme)
 * Allows any player to propose a new building type with custom features and settings.
 * The proposal is saved to Supabase and routed to neighborhood editors for revision.
 * Form uses the Input primitive; the emoji selector is kept because the chosen
 * symbol is user-generated payload data (stored with the proposal), not UI chrome —
 * only the plates around it are styled with theme tokens.
 */

import React, { useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconPlate } from '@/components/ui/IconPlate';
import { Sheet } from '@/components/ui/Sheet';
import { GameAudio } from '@/lib/audio';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Motion, Radii, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import type { BuildingCategory } from '@/types/game.types';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Press-spring touchable (§4 — every touchable springs) ───────────────────

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TouchableScale: React.FC<
  React.ComponentProps<typeof TouchableOpacity>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchable
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, Motion.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Motion.press);
        onPressOut?.(e);
      }}
    />
  );
};

type IconName = keyof typeof Ionicons.glyphMap;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

interface ProposeBuildingModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { key: BuildingCategory; label: string; icon: IconName }[] = [
  { key: 'commercial',  label: 'تجاری',           icon: 'storefront' },
  { key: 'tech',        label: 'فناوری و استارتاپ', icon: 'hardware-chip' },
  { key: 'cultural',    label: 'فرهنگی و تفریحی',  icon: 'color-palette' },
  { key: 'residential', label: 'مسکونی مدرن',     icon: 'home' },
  { key: 'industrial',  label: 'صنعتی و تولیدی',  icon: 'construct' },
  { key: 'military',    label: 'دفاعی و امنیتی',  icon: 'shield' },
];

const EMOJIS = ['🏛️', '☕', '🏢', '⚡', '🏥', '🔬', '🚁', '🌿', '🎪', '📡'];

export function ProposeBuildingModal({ visible, onClose }: ProposeBuildingModalProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="پیشنهاد نوع سازه جدید"
      subtitle={currentNeighborhood ? `محله ${currentNeighborhood.nameFa} — بازبینی توسط ویرایشگران` : undefined}
      maxHeight={0.88}
      footer={
        submitted ? undefined : (
          <View style={styles.footerRow}>
            <Button label="انصراف" variant="ghost" onPress={handleClose} />
            <Button
              label="ثبت پیشنهاد"
              onPress={handleSubmit}
              disabled={submitting}
              loading={submitting}
              style={styles.submitBtn}
            />
          </View>
        )
      }
    >
      {submitted ? (
        <View style={styles.successContainer}>
          <IconPlate name="checkmark-circle" tone="jade" size="lg" bordered={false} />
          <Text variant="heading" weight="bold" color="primary" center>طرح سازه با موفقیت ثبت شد!</Text>
          <Text variant="body" color="secondary" center>
            طرح برای ویرایشگران محله «{currentNeighborhood?.nameFa ?? 'منتخب'}» ارسال شد. به محض تأیید، روی نقشه قابل ساخت خواهد بود.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text variant="body" color="secondary">
            طرح ساختمانی دلخواه خود را در محله «{currentNeighborhood?.nameFa}» طراحی کنید تا توسط ویرایشگران محله بازبینی شود.
          </Text>

          {/* Symbol selector — user-generated payload data (stored with the proposal) */}
          <View style={styles.fieldGroup}>
            <Text variant="label" color="secondary">نماد سازه (روی نقشه):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow} contentContainerStyle={styles.emojiRowContent}>
              {EMOJIS.map((emoji) => (
                <TouchableScale
                  key={emoji}
                  style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnActive]}
                  onPress={() => {
                    setSelectedEmoji(emoji);
                    GameAudio.playTap();
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedEmoji === emoji }}
                >
                  <Text variant="body" color="primary">{emoji}</Text>
                </TouchableScale>
              ))}
            </ScrollView>
          </View>

          {/* Persian Name */}
          <Input
            label="نام فارسی سازه: *"
            icon="create"
            value={nameFa}
            onChangeText={setNameFa}
            placeholder="مثلاً: هاب نوآوری، کافه کتاب، کلینیک تخصصی..."
          />

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text variant="label" color="secondary">دسته‌بندی:</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <TouchableScale
                    key={cat.key}
                    style={[styles.catBtn, active && styles.catBtnActive]}
                    onPress={() => {
                      setCategory(cat.key);
                      GameAudio.playTap();
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={active ? c.brass[400] : c.text.secondary}
                    />
                    <Text variant="caption" color={active ? 'brand' : 'secondary'}>{cat.label}</Text>
                  </TouchableScale>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <Input
            label="توضیحات و کارکرد: *"
            icon="document-text"
            value={descriptionFa}
            onChangeText={setDescriptionFa}
            multiline
            numberOfLines={3}
            placeholder="این سازه چه ویژگی دارد و چه سودی به بازیکنان این محله می‌رساند؟"
            style={styles.textArea}
          />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Input
              label="هزینه ساخت"
              icon="cash"
              value={baseCost}
              onChangeText={setBaseCost}
              keyboardType="numeric"
              placeholder="5000"
              inputStyle={styles.statInput}
              containerStyle={styles.statCol}
            />
            <Input
              label="پاداش قدرت"
              icon="flash"
              value={powerBonus}
              onChangeText={setPowerBonus}
              keyboardType="numeric"
              placeholder="10"
              inputStyle={styles.statInput}
              containerStyle={styles.statCol}
            />
            <Input
              label="درآمد ساعتی"
              icon="trending-up"
              value={incomeRate}
              onChangeText={setIncomeRate}
              keyboardType="numeric"
              placeholder="150"
              inputStyle={styles.statInput}
              containerStyle={styles.statCol}
            />
          </View>

          {/* Custom Feature */}
          <Input
            label="ویژگی یا تنظیمات ویژه (Special Setting):"
            icon="options"
            value={customFeature}
            onChangeText={setCustomFeature}
            placeholder="مثلاً: تخفیف ۱۰٪ مالیات، پناهگاه در زمان جنگ، تقویت تجارت..."
          />
        </ScrollView>
      )}
    </Sheet>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    footerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    submitBtn: {
      minWidth: 148,
      minHeight: 44,
    },
    content: {
      gap: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    fieldGroup: { gap: Spacing.sm },
    emojiRow: { flexGrow: 0 },
    emojiRowContent: { gap: Spacing.sm, paddingRight: Spacing.xs },
    emojiBtn: {
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      backgroundColor: c.ink[600],
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    emojiBtnActive: {
      borderColor: c.brass[400],
      backgroundColor: c.ink[500],
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    catBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
      backgroundColor: c.ink[600],
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: c.border.subtle,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
      minHeight: 44,
    },
    catBtnActive: {
      borderColor: c.brass[400],
      backgroundColor: c.ink[500],
    },
    textArea: {
      height: 75,
      textAlignVertical: 'top',
    },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    statCol: {
      flex: 1,
    },
    statInput: {
      textAlign: 'center',
      ...tabular,
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
      gap: Spacing.md,
    },
  });
