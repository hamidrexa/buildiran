/**
 * BuildIran — Game Tab Layout «Floating Dock» (v2, mobile-first)
 * A floating ink-glass pill dock above the thumb zone. The active tab gets
 * a brass icon and a thin neon indicator line — the one electric moment.
 * نقشه | دارایی‌ها | بازار | جدول | پروفایل
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii, Shadows } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'نقشه', icon: 'map-outline', iconActive: 'map' },
  { name: 'assets', title: 'دارایی‌ها', icon: 'business-outline', iconActive: 'business' },
  { name: 'marketplace', title: 'بازار', icon: 'storefront-outline', iconActive: 'storefront' },
  { name: 'leaderboard', title: 'جدول', icon: 'trophy-outline', iconActive: 'trophy' },
  { name: 'profile', title: 'پروفایل', icon: 'person-outline', iconActive: 'person' },
];

export default function GameLayout() {
  const { colors: c, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          start: 14,
          end: 14,
          bottom: Math.max(insets.bottom, 10) + 6,
          height: 62,
          borderRadius: Radii.full,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarActiveTintColor: c.brass[400],
        tabBarInactiveTintColor: c.text.muted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: 'VazirmatnMedium',
          color: c.text.secondary,
        },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarBackground: () => (
          <View
            style={[
              styles.dock,
              {
                backgroundColor: isDark ? 'rgba(12, 14, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: c.border.subtle,
                ...Shadows.lg,
              },
            ]}
          >
            {/* brass hairline accent across the top of the dock */}
            <View style={[styles.dockAccent, { backgroundColor: c.brass[500] }]} />
          </View>
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <View style={styles.iconWrap}>
                <View
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: focused ? c.neon[400] : 'transparent',
                      shadowColor: c.neon[400],
                      shadowOpacity: focused ? 0.55 : 0,
                      shadowRadius: 6,
                    },
                  ]}
                />
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={size - 2}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dock: {
    flex: 1,
    borderRadius: Radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dockAccent: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 44,
    height: 1.5,
    borderRadius: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 26,
  },
  indicator: {
    position: 'absolute',
    top: -7,
    width: 16,
    height: 2,
    borderRadius: 1,
  },
});
