/**
 * BuildIran — EmptyState (theme-reactive)
 * Quiet, dignified empty screens: icon plate, title, body, optional action.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Spacing } from '@/theme';
import { Text } from './Text';
import { IconPlate } from './IconPlate';
import { Button } from './Button';

type IconName = React.ComponentProps<typeof IconPlate>['name'];
type Tone = React.ComponentProps<typeof IconPlate>['tone'];

interface Props {
  icon: IconName;
  title: string;
  body?: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<Props> = ({
  icon,
  title,
  body,
  tone = 'brass',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.wrap, style]}>
      <IconPlate name={icon} size="lg" tone={tone} bordered={false} style={styles.icon} />
      <Text variant="title" weight="bold" center>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="secondary" center style={styles.body}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  icon: {
    marginBottom: Spacing.sm,
  },
  body: {
    maxWidth: 280,
  },
  action: {
    marginTop: Spacing.sm,
  },
});

export default EmptyState;
