/**
 * BuildIran — HUD (Heads-Up Display)
 * Floating overlay: resource bar + 4-factor stats (Power, Wealth, Activity, Popularity)
 * + Neighborhood indicator & Neighborhood Editor Panel trigger for high-power players.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useGameStore } from '@/store/useGameStore';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { useStatBarFill } from '@/lib/effects';
import { GameAudio } from '@/lib/audio';
import { NeighborhoodEditorModal } from './NeighborhoodEditorModal';

// ─── 4-Factor Stat Bar ────────────────────────────────────────────────────────

const StatBar: React.FC<{
  icon: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay?: number;
}> = ({ icon, label, value, maxValue, color, delay = 0 }) => {
  const pct = Math.min((value / maxValue) * 100, 100);
  const { style: barStyle } = useStatBarFill(pct, delay);

  return (
    <View style={statStyles.statRow}>
      <Text style={statStyles.statIcon}>{icon}</Text>
      <View style={statStyles.statBarBg}>
        <Animated.View style={[statStyles.statBarFill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={statStyles.statValue}>{value.toLocaleString('fa-IR')}</Text>
    </View>
  );
};

// ─── Resource Chip ────────────────────────────────────────────────────────────

const ResourceChip: React.FC<{ icon: string; value: number; color?: string }> = ({
  icon,
  value,
  color = '#FFFFFF',
}) => (
  <View style={chipStyles.chip}>
    <Text style={chipStyles.icon}>{icon}</Text>
    <Text style={[chipStyles.value, { color }]}>{value.toLocaleString('fa-IR')}</Text>
  </View>
);

// ─── HUD ──────────────────────────────────────────────────────────────────────

export const HUD: React.FC = () => {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const selectedTileId = useGameStore((s) => s.selectedTileId);
  const tiles = useGameStore((s) => s.tiles);
  const currentNeighborhood = useNeighborhoodStore((s) => s.currentNeighborhood);

  const [showEditorModal, setShowEditorModal] = useState(false);

  const selectedTile = selectedTileId ? tiles[selectedTileId] : null;

  if (!player) return null;

  const isEditor = currentNeighborhood
    ? player.power >= currentNeighborhood.minEditorPower
    : player.power >= 150;

  return (
    <>
      {/* Top: Cash + Resources */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <LinearGradient
          colors={['rgba(8,12,26,0.92)', 'rgba(13,21,51,0.88)']}
          style={styles.topBarInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Player avatar + name */}
          <TouchableOpacity
            style={styles.playerBadge}
            onPress={() => {
              GameAudio.playTap();
              router.push('/(game)/profile');
            }}
          >
            <View style={[styles.avatar, { backgroundColor: player.avatarColor ?? '#6C63FF' }]}>
              <Text style={styles.avatarText}>
                {player.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>{player.username}</Text>
              <Text style={styles.playerLevel}>سطح {player.level.toLocaleString('fa-IR')}</Text>
            </View>
          </TouchableOpacity>

          {/* Resources */}
          <View style={styles.resourceChips}>
            <ResourceChip icon="💰" value={player.cash ?? 0} color="#FFD700" />
            <ResourceChip icon="⚔️" value={player.power ?? 0} color="#A78BFA" />
          </View>
        </LinearGradient>
      </View>

      {/* Sub-bar: Neighborhood & Editor Panel Access */}
      <View style={[styles.subBar, { top: insets.top + 68 }]}>
        <TouchableOpacity
          style={styles.neighborhoodPill}
          onPress={() => {
            GameAudio.playTap();
            setShowEditorModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.neighborhoodText}>
            📍 {currentNeighborhood?.nameFa ?? 'محله بازی'}
          </Text>
        </TouchableOpacity>

        {isEditor && (
          <TouchableOpacity
            style={styles.editorPill}
            onPress={() => {
              GameAudio.playTap();
              setShowEditorModal(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.editorPillGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.editorPillText}>🎖️ ویرایشگر محله</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Right side: 4-Factor Stats Panel */}
      <View style={[styles.statsPanel, { top: insets.top + 112 }]}>
        <LinearGradient
          colors={['rgba(8,12,26,0.9)', 'rgba(13,21,51,0.85)']}
          style={styles.statsPanelInner}
        >
          <StatBar icon="⚔️" label="قدرت"    value={player.power ?? 0}       maxValue={500}  color="#A78BFA" delay={0}   />
          <StatBar icon="💰" label="ثروت"     value={Math.min(player.wealth ?? 0, 999999)} maxValue={100000} color="#FFD700" delay={100} />
          <StatBar icon="🔥" label="فعالیت"   value={player.activity ?? 0}    maxValue={100}  color="#FB923C" delay={200} />
          <StatBar icon="⭐" label="محبوبیت"  value={player.popularity ?? 0}  maxValue={200}  color="#34D399" delay={300} />
        </LinearGradient>
      </View>

      {/* Bottom: Selected Tile Info */}
      {selectedTile && (
        <View style={[styles.tilePanel, { bottom: insets.bottom + 76 }]}>
          <LinearGradient
            colors={['rgba(8,12,26,0.95)', 'rgba(13,21,51,0.9)']}
            style={styles.tilePanelInner}
          >
            <Text style={styles.tileStatus}>
              {selectedTile.status === 'available'
                ? '🟢 زمین آزاد — ضربه بزنید تا بسازید'
                : selectedTile.status === 'owned'
                ? '🟡 قلمرو شما'
                : '🔴 قلمرو بازیکن دیگر'}
            </Text>
            <Text style={styles.tileId} numberOfLines={1}>{selectedTile.id}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Neighborhood Editor Review Modal */}
      <NeighborhoodEditorModal
        visible={showEditorModal}
        onClose={() => setShowEditorModal(false)}
      />
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    shadowColor: '#6C63FF',
    shadowRadius: 12,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  playerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  playerInfo: { flex: 1 },
  playerName: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  playerLevel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  resourceChips: { flexDirection: 'row', gap: 12, alignItems: 'center' },

  subBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  neighborhoodPill: {
    backgroundColor: 'rgba(8,12,26,0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.25)',
  },
  neighborhoodText: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },

  editorPill: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  editorPillGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editorPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  statsPanel: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    width: 135,
  },
  statsPanelInner: {
    borderRadius: 14,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },

  tilePanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  tilePanelInner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    gap: 4,
  },
  tileStatus: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tileId: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
});

const statStyles = StyleSheet.create({
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 12 },
  statBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: { height: '100%', borderRadius: 3 },
  statValue: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', minWidth: 26, textAlign: 'right' },
});

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 15 },
  value: { fontSize: 13, fontWeight: '700' },
});
