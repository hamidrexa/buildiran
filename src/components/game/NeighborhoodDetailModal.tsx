import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { GameAudio } from '@/lib/audio';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useMapStore } from '@/store/useMapStore';
import { useAssetStore } from '@/store/useAssetStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { NeighborhoodAmenityCard } from './NeighborhoodAmenityCard';
import { MAP_DEFAULT_ZOOM } from '@/lib/constants';
import { t } from '@/i18n';

const { height: SCREEN_H } = Dimensions.get('window');

interface NeighborhoodDetailModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NeighborhoodDetailModal({ visible, onClose }: NeighborhoodDetailModalProps) {
  const player = usePlayerStore((s) => s.player);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);
  const neighborhoods = useNeighborhoodStore((s) => s.neighborhoods);
  const assets = useAssetStore((s) => s.assets);

  const showDistrictsOverlay = useMapStore((s) => s.showDistrictsOverlay);
  const setShowDistrictsOverlay = useMapStore((s) => s.setShowDistrictsOverlay);
  const showOtherPlayersAssets = useMapStore((s) => s.showOtherPlayersAssets);
  const setShowOtherPlayersAssets = useMapStore((s) => s.setShowOtherPlayersAssets);
  const triggerFlyTo = useMapStore((s) => s.triggerFlyTo);

  // Derive districts where the player owns an asset
  const myDistricts = useMemo(() => {
    if (!player) return [];
    const myAssetNbIds = new Set(
      Object.values(assets)
        .filter((a) => a.ownerId === player.id && a.neighborhoodId)
        .map((a) => a.neighborhoodId)
    );
    return neighborhoods.filter((n) => myAssetNbIds.has(n.id));
  }, [assets, player, neighborhoods]);

  const handleTeleport = (nb: any) => {
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View entering={SlideInDown.duration(300).springify()} style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="heading" style={{ fontSize: 18 }}>اطلاعات محله</Text>
          <TouchableOpacity onPress={() => { GameAudio.playTap(); onClose(); }} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Current Neighborhood Info */}
          {currentNeighborhood ? (
            <NeighborhoodAmenityCard neighborhood={currentNeighborhood} />
          ) : (
            <View style={styles.emptyBox}>
              <Text variant="title" color="secondary">خارج از محله‌های فعال</Text>
            </View>
          )}

          {/* Map Visual Toggles */}
          <Text style={styles.sectionHeading}>تنظیمات نمایش نقشه</Text>
          <View style={styles.togglesContainer}>
            <TouchableOpacity style={styles.toggleRow} onPress={toggleOverlay} activeOpacity={0.7}>
              <View style={styles.toggleTextCol}>
                <Text variant="title">نمایش مرزها و سایه محله‌ها</Text>
              </View>
              <View style={[styles.switchTrack, showDistrictsOverlay && styles.switchTrackActive]}>
                <View style={[styles.switchThumb, showDistrictsOverlay && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRow} onPress={toggleAssets} activeOpacity={0.7}>
              <View style={styles.toggleTextCol}>
                <Text variant="title">نمایش املاک سایر بازیکنان</Text>
              </View>
              <View style={[styles.switchTrack, showOtherPlayersAssets && styles.switchTrackActive]}>
                <View style={[styles.switchThumb, showOtherPlayersAssets && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* My Districts */}
          <Text style={styles.sectionHeading}>محله‌های شما</Text>
          <Text style={styles.sectionDesc}>محله‌هایی که در آن‌ها حداقل یک ملک دارید.</Text>

          {myDistricts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text variant="caption" color="secondary">هنوز ملکی در هیچ محله‌ای ندارید.</Text>
            </View>
          ) : (
            <View style={styles.districtsList}>
              {myDistricts.map((nb) => (
                <TouchableOpacity
                  key={nb.id}
                  style={styles.districtCard}
                  onPress={() => handleTeleport(nb)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.districtInfo}>
                    <Text variant="title" weight="bold">{nb.nameFa}</Text>
                    {nb.areaName && <Text variant="caption" color="secondary">{nb.areaName}</Text>}
                  </View>
                  <View style={styles.teleportBtn}>
                    <Text variant="caption" color="primary" weight="bold">رفتن به محله</Text>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.85,
    backgroundColor: '#0B0B0B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 10,
    marginBottom: -10,
  },
  sectionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 5,
  },
  togglesContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  toggleTextCol: {
    flex: 1,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#10B981',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: -20 }], // RTL correct transform
  },
  districtsList: {
    gap: 12,
  },
  districtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  districtInfo: {
    flex: 1,
  },
  teleportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108,99,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
