/**
 * BuildIran — Input (theme-reactive)
 * Ink field with hairline border; neon focus hairline — the "live" signal.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing, Typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  trailing?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<Props> = ({
  label,
  hint,
  error,
  icon,
  trailing,
  containerStyle,
  inputStyle,
  style,
  ...rest
}) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.group, containerStyle]}>
      {(label || hint) && (
        <View style={styles.labelRow}>
          {label && <Text variant="label" color={error ? 'error' : 'secondary'}>{label}</Text>}
          {hint}
        </View>
      )}
      <View
        style={[
          styles.wrapper,
          focused && styles.wrapperFocused,
          error && styles.wrapperError,
        ]}
      >
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons
              name={icon}
              size={17}
              color={focused ? c.neon[400] : c.text.muted}
            />
          </View>
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={c.text.muted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    group: {
      gap: Spacing.xs + 2,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.ink[600],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.border.default,
      paddingHorizontal: Spacing.md + 2,
      minHeight: 48,
    },
    wrapperFocused: {
      borderColor: c.neon[400],
      backgroundColor: c.ink[500],
    },
    wrapperError: {
      borderColor: c.crimson,
    },
    iconBox: {
      width: 26,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      color: c.text.primary,
      fontSize: Typography.sizes.md,
      fontFamily: 'VazirmatnMedium',
      writingDirection: 'rtl',
      textAlign: 'right',
      paddingVertical: Spacing.md - 2,
    },
    error: {
      marginTop: 2,
    },
  });

export default Input;
