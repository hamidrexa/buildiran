/**
 * BuildIran — Neighborhood Editor Dashboard Modal
 * Visible to high-power players (power >= minEditorPower in the neighborhood).
 * Allows neighborhood editors to review, approve, or reject player-proposed building types.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { GameAudio } from '@/lib/audio';
import type { CustomBuildingType } from '@/types/game.types';

const { height: SCREEN_H } = Dimensions.get('window');

interface NeighborhoodEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NeighborhoodEditorModal({ visible, onClose }: NeighborhoodEditorModalProps) {
  const player = usePlayerStore((s) => s.player);
  const {
    neighborhoods,
    currentNeighborhood,
    setCurrentNeighborhood,
    pendingProposals,
    fetchPendingProposals,
    reviewProposal,
    isLoading,
  } = useNeighborhoodStore();

  const [selectedProposal, setSelectedProposal] = useState<CustomBuildingType | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && currentNeighborhood) {
      fetchPendingProposals(currentNeighborhood.id);
    }
  }, [visible, currentNeighborhood, fetchPendingProposals]);

  if (!currentNeighborhood || !player) return null;

  const isEditor = player.power >= currentNeighborhood.minEditorPower;

  const handleApprove = async (proposal: CustomBuildingType) => {
    setActionLoading(true);
    try {
      const ok = await reviewProposal({
        proposalId: proposal.id,
        editorId: player.id,
        status: 'approved',
        reviewNotes: reviewNotes.trim() || 'طرح توسط ویرایشگر محله بررسی و تأیید شد.',
      });
      if (ok) {
        await GameAudio.playApprove();
        Alert.alert('تأیید شد', `سازه «${proposal.nameFa}» تأیید شد و اکنون در محله ${currentNeighborhood.nameFa} قابل احداث است!`);
        setSelectedProposal(null);
        setReviewNotes('');
      } else {
        GameAudio.playError();
      }
    } catch {
      GameAudio.playError();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proposal: CustomBuildingType) => {
    setActionLoading(true);
    try {
      const ok = await reviewProposal({
        proposalId: proposal.id,
        editorId: player.id,
        status: 'rejected',
        reviewNotes: reviewNotes.trim() || 'طرح با ضوابط محله سازگار نبود.',
      });
      if (ok) {
        GameAudio.playError();
        Alert.alert('رد شد', `طرح «${proposal.nameFa}» رد شد.`);
        setSelectedProposal(null);
        setReviewNotes('');
      }
    } catch {
      GameAudio.playError();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <LinearGradient
            colors={['#0E172F', '#060B1A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.badgeEmoji}>🎖️</Text>
              <View>
                <Text style={styles.title}>پنل بازبینی ویرایشگران محله</Text>
                <Text style={styles.subtitle}>
                  محله {currentNeighborhood.nameFa} ({currentNeighborhood.city})
                </Text>
              </View>
            </View>

            {/* Power Status Badge */}
            <View style={[styles.powerBadge, isEditor ? styles.editorActive : styles.editorInactive]}>
              <Text style={styles.powerBadgeText}>
                {isEditor ? '⭐ ویرایشگر مجاز' : '🔒 فاقد قدرت کافی'}
              </Text>
              <Text style={styles.powerSub}>
                قدرت شما: {player.power} / حداقل {currentNeighborhood.minEditorPower}
              </Text>
            </View>
          </View>

          {/* Neighborhood Selector Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {neighborhoods.map((n) => {
              const active = currentNeighborhood.id === n.id;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setCurrentNeighborhood(n);
                    GameAudio.playTap();
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    📍 {n.nameFa}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content Area */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {!isEditor ? (
              <View style={styles.lockedBox}>
                <Text style={styles.lockedEmoji}>🛡️</Text>
                <Text style={styles.lockedTitle}>شما هنوز ویرایشگر این محله نیستید</Text>
                <Text style={styles.lockedDesc}>
                  برای کسب حق رأی و ویرایشگری در محله «{currentNeighborhood.nameFa}»، باید با ساخت و ارتقای سازه‌ها قدرت نفوذ خود را به حداقل {currentNeighborhood.minEditorPower} برسانید (قدرت فعلی: {player.power}).
                </Text>
              </View>
            ) : isLoading ? (
              <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            ) : pendingProposals.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyTitle}>هیچ طرح معلقی وجود ندارد</Text>
                <Text style={styles.emptySub}>
                  تمامی طرح‌های پیشنهادی بازیکنان در این محله بررسی شده‌اند.
                </Text>
              </View>
            ) : (
              <View style={styles.proposalList}>
                <Text style={styles.sectionHeading}>
                  طرح‌های در انتظار بررسی ({pendingProposals.length}):
                </Text>

                {pendingProposals.map((p) => {
                  const isSelected = selectedProposal?.id === p.id;
                  return (
                    <View key={p.id} style={[styles.card, isSelected && styles.cardSelected]}>
                      <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => {
                          setSelectedProposal(isSelected ? null : p);
                          GameAudio.playTap();
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cardEmoji}>{p.emoji || '🏛️'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{p.nameFa}</Text>
                          <Text style={styles.cardCategory}>دسته‌بندی: {p.category}</Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="rgba(255,255,255,0.6)"
                        />
                      </TouchableOpacity>

                      {/* Expanded Proposal Details */}
                      {isSelected && (
                        <View style={styles.detailsContainer}>
                          <Text style={styles.detailsDesc}>{p.descriptionFa}</Text>

                          {/* Stats Row */}
                          <View style={styles.statsRow}>
                            <View style={styles.statPill}>
                              <Text style={styles.statPillLabel}>هزینه پایه</Text>
                              <Text style={styles.statPillVal}>💰 {p.baseCost.toLocaleString('fa-IR')}</Text>
                            </View>
                            <View style={styles.statPill}>
                              <Text style={styles.statPillLabel}>پاداش قدرت</Text>
                              <Text style={styles.statPillVal}>⚔️ +{p.powerBonus}</Text>
                            </View>
                            <View style={styles.statPill}>
                              <Text style={styles.statPillLabel}>درآمد ساعتی</Text>
                              <Text style={styles.statPillVal}>🪙 {p.incomeRate}</Text>
                            </View>
                          </View>

                          {/* Custom Settings */}
                          {p.customSettings && Object.keys(p.customSettings).length > 0 && (
                            <View style={styles.customFeatureBox}>
                              <Text style={styles.customFeatureTitle}>⚡ قابلیت ویژه پیشنهادی:</Text>
                              <Text style={styles.customFeatureText}>
                                {p.customSettings.specialFeature || JSON.stringify(p.customSettings)}
                              </Text>
                            </View>
                          )}

                          {/* Review Note Input */}
                          <TextInput
                            style={styles.noteInput}
                            value={reviewNotes}
                            onChangeText={setReviewNotes}
                            placeholder="یادداشت یا دلیل تصمیم‌گیری برای سازنده طرح..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                          />

                          {/* Action Buttons */}
                          <View style={styles.actionsRow}>
                            <TouchableOpacity
                              style={[styles.btn, styles.rejectBtn]}
                              onPress={() => handleReject(p)}
                              disabled={actionLoading}
                            >
                              <Text style={styles.rejectBtnText}>❌ رد طرح</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.btn, styles.approveBtn]}
                              onPress={() => handleApprove(p)}
                              disabled={actionLoading}
                            >
                              <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                              >
                                {actionLoading ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <Text style={styles.approveBtnText}>✅ تأیید و انتشار در نقشه</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    maxHeight: SCREEN_H * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  badgeEmoji: { fontSize: 28 },
  title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  powerBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
    borderWidth: 1,
  },
  editorActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  editorInactive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  powerBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  powerSub: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  chipsScroll: { paddingHorizontal: 20, maxHeight: 42, marginBottom: 14 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FCD34D', fontWeight: '800' },

  content: { paddingHorizontal: 20, paddingBottom: 20 },

  lockedBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    marginTop: 20,
    gap: 10,
  },
  lockedEmoji: { fontSize: 48 },
  lockedTitle: { fontSize: 18, fontWeight: '800', color: '#F87171' },
  lockedDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 22 },

  emptyBox: { alignItems: 'center', padding: 40, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#E2E8F0', marginBottom: 12 },
  proposalList: { gap: 12 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#6C63FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  cardCategory: { fontSize: 11, color: '#A78BFA', marginTop: 2 },

  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
    gap: 12,
  },
  detailsDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  statPillLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  statPillVal: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },

  customFeatureBox: {
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  customFeatureTitle: { fontSize: 12, fontWeight: '700', color: '#A78BFA' },
  customFeatureText: { fontSize: 12, color: '#FFFFFF', marginTop: 2 },

  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    textAlign: 'right',
  },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rejectBtnText: { color: '#F87171', fontWeight: '700', fontSize: 13 },
  approveBtn: {},
  btnGradient: { paddingVertical: 12, alignItems: 'center' },
  approveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
