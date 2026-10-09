/**
 * BuildIran — OfflineMapBanner
 *
 * A thin status banner displayed above the map while the offline tile pack
 * is downloading, or when the web map has no internet.
 *
 * • Native: shows download progress (۰–۱۰۰٪) and disappears when ready.
 * • Web: shown only when `navigator.onLine` is false.
 *
 * RTL / Farsi, uses the shared Text component.
 */

import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { OfflineTileStatus } from '@/lib/offlineTileManager';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface OfflineMapBannerProps {
  /** Current status coming from useOfflineTiles / useWebOnline */
  status: OfflineTileStatus | 'web_offline';
  progress?: number; // 0–100
  error?: string | null;
}

// ─── Web-online hook ───────────────────────────────────────────────────────────

export function useWebOnline(): boolean {
  const [online, setOnline] = useState(
    Platform.OS === 'web' ? (typeof navigator !== 'undefined' ? navigator.onLine : true) : true,
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const OfflineMapBanner: React.FC<OfflineMapBannerProps> = ({
  status,
  progress = 0,
  error,
}) => {
  const { colors } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  const visible =
    status === 'checking' ||
    status === 'downloading' ||
    status === 'error' ||
    status === 'web_offline';

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const isError = status === 'error' || status === 'web_offline';
  const bgColor = isError
    ? `${colors.crimson}E6`
    : `${colors.brass[600]}E6`;

  const message = (() => {
    switch (status) {
      case 'checking':
        return 'بررسی نقشه آفلاین…';
      case 'downloading':
        return `دانلود نقشه آفلاین: ${progress.toLocaleString('fa-IR')}٪`;
      case 'error':
        return `خطا در دانلود نقشه: ${error ?? 'مشکل نامشخص'}`;
      case 'web_offline':
        return 'اتصال اینترنت ندارید — نقشه در دسترس نیست';
      default:
        return '';
    }
  })();

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, opacity }]}>
      <View style={styles.inner}>
        {status === 'downloading' && (
          <View style={[styles.progressTrack, { backgroundColor: `${colors.brass[300]}55` }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%` as any,
                  backgroundColor: colors.brass[300],
                },
              ]}
            />
          </View>
        )}
        <Text
          variant="caption"
          color="inverse"
          center
          style={styles.label}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
