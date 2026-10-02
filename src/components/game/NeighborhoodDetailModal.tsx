/**
 * BuildIran — Neighborhood Detail Modal — «Gentleman Neon» (v2)
 * Sheet: the active neighborhood's amenity card, map display toggles and the
 * player's districts with the teleport action. All store calls, the fly-to
 * behaviour and public props ({visible, onClose}) are unchanged.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Radii, Spacing, Typography, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { GameAudio } from '@/lib/audio';
import { MAP_DEFAULT_ZOOM } from '@/lib/constants';
import { useAssetStore } from '@/store/useAssetStore';
import { useMapStore } from '@/store/useMapStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Ionicons } from '@expo/vector-icons';
import type { Neighborhood } from '@/types/game.types';
import { NeighborhoodAmenityCard } from './NeighborhoodAmenityCard';

interface NeighborhoodDetailModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NeighborhoodDetailModal({
  visible,
  onClose,
}: NeighborhoodDetailModalProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const player = usePlayerStore((s) => s.player);
  const currentNeighborhood = useNeighborhoodStore(
    (s) => s.currentNeighborhood,
  );
  const neighborhoods = useNeighborhoodStore((s) => s.neighborhoods);
  const assets = useAssetStore((s) => s.assets);

  const showDistrictsOverlay = useMapStore((s) => s.showDistrictsOverlay);
  const setShowDistrictsOverlay = useMapStore((s) => s.setShowDistrictsOverlay);
  const showOtherPlayersAssets = useMapStore((s) => s.showOtherPlayersAssets);
  const setShowOtherPlayersAssets = useMapStore(
    (s) => s.setShowOtherPlayersAssets,
  );
  const triggerFlyTo = useMapStore((s) => s.triggerFlyTo);

  // Derive districts where the player owns an asset
  const myDistricts = useMemo(() => {
    if (!player) return [];
    const myAssetNbIds = new Set(
      Object.values(assets)
        .filter((a) => a.ownerId === player.id && a.neighborhoodId)
        .map((a) => a.neighborhoodId),
    );
    return neighborhoods.filter((n) => myAssetNbIds.has(n.id));
  }, [assets, player, neighborhoods]);

  const handleTeleport = (nb: Neighborhood) => {
    GameAudio.playTap();
    triggerFlyTo({
      center: { latitude: nb.centerLat, longitude: nb.centerLng },
      zoom: MAP_DEFAULT_ZOOM,
      duration: 800,
    });
    onClose();
  };

  const toggleOverlay = () => {
    GameAudio.playTap();
    setShowDistrictsOverlay(!showDistrictsOverlay);
  };

  const toggleAssets = () => {
    GameAudio.playTap();
    setShowOtherPlayersAssets(!showOtherPlayersAssets);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="اطلاعات محله"
      subtitle={
        currentNeighborhood
          ? `${currentNeighborhood.nameFa} • ${currentNeighborhood.city}`
          : 'نقشه آزاد'
      }
      maxHeight={0.85}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active neighborhood — amenity tier hero card */}
        <SectionTitle kicker="اقتصاد محله" title="محله فعال" />
        {currentNeighborhood ? (
          <NeighborhoodAmenityCard neighborhood={currentNeighborhood} />
        ) : (
          <EmptyState
            icon="map"
            tone="steel"
            title="خارج از محله‌های فعال"
            body="روی نقشه آزاد هستید؛ برای مشاهده اقتصاد محله وارد یکی از محله‌های فعال شوید."
            style={styles.emptyCompact}
          />
        )}

        {/* Map display toggles */}
        <SectionTitle kicker="نمایش" title="تنظیمات نمایش نقشه" />
        <Card padded={false}>
          <ToggleRow
            icon="layers"
            label="نمایش مرزها و سایه محله‌ها"
            value={showDistrictsOverlay}
            onToggle={toggleOverlay}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            icon="people"
            label="نمایش املاک سایر بازیکنان"
            value={showOtherPlayersAssets}
            onToggle={toggleAssets}
          />
        </Card>

        {/* My districts */}
        <SectionTitle
          kicker="قلمرو شما"
          title="محله‌های شما"
          trailing={
            <Text variant="caption" color="muted" style={styles.countCaption}>
              {myDistricts.length.toLocaleString('fa-IR')}
            </Text>
          }
        />
        <Text variant="caption" color="muted">
          محله‌هایی که در آن‌ها حداقل یک ملک دارید.
        </Text>

        {myDistricts.length === 0 ? (
          <EmptyState
            icon="home"
            tone="neutral"
            title="هنوز ملکی در هیچ محله‌ای ندارید."
            style={styles.emptyCompact}
          />
        ) : (
          <View style={styles.districtsList}>
            {myDistricts.map((nb, i) => (
              <Animated.View
                key={nb.id}
                entering={FadeInDown.delay(Motion.stagger(i)).duration(
                  Motion.durations.normal,
                )}
              >
                <TouchableOpacity
                  style={styles.districtRow}
                  onPress={() => handleTeleport(nb)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`رفتن به محله ${nb.nameFa}`}
                >
                  <IconPlate name="business" tone="brass" size="sm" />
                  <View style={styles.districtTexts}>
                    <Text variant="body" weight="semibold" numberOfLines={1}>
                      {nb.nameFa}
                    </Text>
                    {nb.areaName ? (
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {nb.areaName}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.teleportPill}>
                    <Text style={styles.teleportPillText}>رفتن به محله</Text>
                    <Ionicons
                      name="navigate"
                      size={13}
                      color={c.brass[400]}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

// ─── Toggle row (ink switch, jade active) ─────────────────────────────────────

const ToggleRow: React.FC<{
  icon: React.ComponentProps<typeof IconPlate>['name'];
  label: string;
  value: boolean;
  onToggle: () => void;
}> = ({ icon, label, value, onToggle }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <TouchableOpacity
      style={styles.toggleRow}
      onPress={onToggle}
      activeOpacity={0.75}
      accessibilityRole="switch"
      accessibilityState={{ selected: value }}
      accessibilityLabel={label}
    >
      <IconPlate name={icon} tone="steel" size="sm" />
      <View style={styles.toggleTexts}>
        <Text variant="body" weight="medium">
          {label}
        </Text>
      </View>
      <View style={[styles.switchTrack, value && styles.switchTrackActive]}>
        <View
          style={[styles.switchThumb, value && styles.switchThumbActive]}
        />
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    scrollContent: {
      gap: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    emptyCompact: {
      paddingVertical: Spacing.xl,
    },
    countCaption: {
      fontVariant: ['tabular-nums'],
    },

    // Toggles
    rowDivider: {
      height: 1,
      backgroundColor: c.border.subtle,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      minHeight: 44,
    },
    toggleTexts: {
      flex: 1,
    },
    switchTrack: {
      width: 44,
      height: 24,
      borderRadius: Radii.full,
      backgroundColor: c.ink[500],
      borderWidth: 1,
      borderColor: c.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchTrackActive: {
      backgroundColor: `${c.jade}33`,
      borderColor: `${c.jade}66`,
    },
    switchThumb: {
      width: 18,
      height: 18,
      borderRadius: Radii.full,
      backgroundColor: c.text.muted,
    },
    switchThumbActive: {
      backgroundColor: c.jade,
      transform: [{ translateX: -12 }], // RTL correct transform
    },

    // District rows
    districtsList: {
      gap: Spacing.md,
    },
    districtRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: Spacing.md,
      minHeight: 44,
    },
    districtTexts: {
      flex: 1,
      gap: 1,
    },
    teleportPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: `${c.brass[400]}14`,
      borderWidth: 1,
      borderColor: `${c.brass[400]}3D`,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radii.full,
    },
    teleportPillText: {
      fontSize: Typography.sizes.xs,
      fontFamily: 'Vazirmatn-SemiBold',
      color: c.brass[400],
      writingDirection: 'rtl',
    },
  });
