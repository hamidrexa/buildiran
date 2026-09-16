import { Text } from '@/components/ui/Text';
import type { GameMapProps } from '@/types/map.types';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';

export type { GameMapProps } from '@/types/map.types';

// MapLibre links `MLRNCameraModule`, which only exists in a custom
// development build or production binary. When the app is running inside
// Expo Go we render a friendly fallback instead of requiring the native
// module, so the rest of the UI keeps working.
function isExpoGo(): boolean {
  const c = Constants as unknown as {
    appOwnership?: string;
    executionEnvironment?: string;
  };
  if (c.appOwnership) return c.appOwnership === 'expo';
  return c.executionEnvironment === 'expo';
}

const MapUnavailable: React.FC = () => (
  <View style={fallbackStyles.container}>
    <Text variant="body" color="primary" center>
      نقشه در نسخه آزمایشی موبایل در دسترس نیست. برای استفاده از نقشه، یک
      Development Build بسازید.
    </Text>
  </View>
);

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0B0B0B',
  },
});

export const GameMap: React.FC<GameMapProps> = (props) => {
  const [showDistricts, setShowDistricts] = useState(true);

  let MapComponent;
  if (Platform.OS === 'web') {
    MapComponent = require('./GameMap.web').default;
  } else if (isExpoGo()) {
    MapComponent = MapUnavailable;
  } else {
    MapComponent = require('./GameMap.native').default;
  }

  return (
    <View style={styles.container}>
      <MapComponent {...props} showDistricts={props.showDistricts ?? showDistricts} />
      
      {/* Platform-agnostic Map Overlay Toggle */}
      <Pressable 
        style={[styles.toggleBtn, showDistricts ? styles.toggleBtnActive : styles.toggleBtnInactive]}
        onPress={() => setShowDistricts(!showDistricts)}
      >
        <View style={[styles.toggleIndicator, showDistricts ? styles.toggleIndicatorActive : styles.toggleIndicatorInactive]} />
        <Text style={[styles.toggleText, showDistricts ? styles.toggleTextActive : styles.toggleTextInactive]}>
          مناطق تهران
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  toggleBtn: {
    position: 'absolute',
    left: 10,
    bottom: 40,
    zIndex: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(8, 12, 26, 0.85)',
  },
  toggleBtnActive: {
    borderColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleBtnInactive: {
    borderColor: 'rgba(255,255,255,0.25)',
  },
  toggleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  toggleIndicatorActive: {
    backgroundColor: '#0EA5E9',
  },
  toggleIndicatorInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#0EA5E9',
  },
  toggleTextInactive: {
    color: 'rgba(255,255,255,0.6)',
  },
});

export default GameMap;
