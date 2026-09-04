/**
 * BuildIran — Auth Layout
 * Stack navigator for login, register, forgot-password screens.
 */

import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
        contentStyle: { backgroundColor: '#080C1A' },
      }}
    />
  );
}
