/**
 * BuildIran — Sheet (theme-reactive)
 * The single bottom-sheet pattern for all game modals: dim overlay,
 * ink sheet with hairline top border, grab handle, title row with close.
 * Important transition: spring entrance (Motion.entrance) + backdrop fade.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing, Shadows, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Max fraction of screen height */
  maxHeight?: number;
  footer?: React.ReactNode;
}

export const Sheet: React.FC<Props> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 0.85,
  footer,
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(visible ? 1 : 0, {
      ...Motion.entrance,
      damping: visible ? Motion.entrance.damping : 24,
    });
  }, [visible, progress]);

  // Hooks must run unconditionally. No early return: <Modal visible={false}>
  // already unmounts its children, so hidden sheets render nothing anyway.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 60 }],
    opacity: progress.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: Motion.durations.normal }),
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="بستن" />
          </Animated.View>

          <Animated.View style={[styles.sheet, { maxHeight: `${Math.round(maxHeight * 100)}%` as any }, sheetStyle]}>
            <LinearGradient
              colors={c.gradient.sheet}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.handle} />

            {(title || subtitle) && (
              <View style={styles.header}>
                <View style={styles.headerTexts}>
                  {title && <Text variant="title" weight="bold">{title}</Text>}
                  {subtitle && (
                    <Text variant="caption" color="secondary" style={styles.subtitle}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="بستن"
                >
                  <Ionicons name="close" size={18} color={c.text.secondary} />
                </Pressable>
              </View>
            )}

            <View style={styles.body}>{children}</View>

            {footer && <View style={styles.footer}>{footer}</View>}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    flex: { flex: 1 },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: c.bg.overlay,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.border.default,
      overflow: 'hidden',
      ...Shadows.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border.strong,
      marginTop: Spacing.sm + 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md - 2,
      gap: Spacing.md,
    },
    headerTexts: {
      flex: 1,
      gap: 2,
    },
    subtitle: {},
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    body: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.xl,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md + 2,
      borderTopWidth: 1,
      borderTopColor: c.border.subtle,
      backgroundColor: c.ink[800],
    },
  });

export default Sheet;
