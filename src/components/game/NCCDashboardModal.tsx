import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Neighborhood, CouncilMember } from '@/types/game.types';
import { GameAudio } from '@/lib/audio';

const { height: SCREEN_H } = Dimensions.get('window');
const APPLICATION_COST = 50000; // Constant value based on user request

interface NCCDashboardModalProps {
  visible: boolean;
  neighborhood: Neighborhood | null;
  onClose: () => void;
}

export function NCCDashboardModal({ visible, neighborhood, onClose }: NCCDashboardModalProps) {
  const player = usePlayerStore((s) => s.player);
  const {
    councilMembers,
    fetchCouncilMembers,
    requestCouncilMembership,
    triggerChairSelection,
    isLoading,
  } = useNeighborhoodStore();

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && neighborhood) {
      fetchCouncilMembers(neighborhood.id);
    }
  }, [visible, neighborhood, fetchCouncilMembers]);

  if (!neighborhood || !player) return null;

  const isMember = councilMembers.some((m) => m.playerId === player.id);
  const isChair = neighborhood.councilChairId === player.id;
  
  // Find current chair
  const chairMember = councilMembers.find((m) => m.playerId === neighborhood.councilChairId);
  
  // Evaluate if election can be triggered
  const lastSelection = neighborhood.lastChairSelectionAt ? new Date(neighborhood.lastChairSelectionAt) : null;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const canTriggerElection = isMember && (!lastSelection || lastSelection < oneWeekAgo);

  // Evaluate application eligibility
  const meetsPopularity = player.popularity >= (neighborhood.minCouncilPopularity ?? 50);
  const hasCash = player.cash >= APPLICATION_COST;
  const isFull = councilMembers.length >= (neighborhood.councilMemberCapacity ?? 5);
  
  let lowestPowerMember: CouncilMember | null = null;
  if (isFull && councilMembers.length > 0) {
    lowestPowerMember = councilMembers.reduce((prev, curr) => 
      (prev.power ?? 0) < (curr.power ?? 0) ? prev : curr
    );
  }
  const meetsPowerToReplace = isFull && lowestPowerMember ? player.power > (lowestPowerMember.power ?? 0) : true;

  const handleApply = async () => {
    if (!hasCash) {
      Alert.alert('موجودی ناکافی', `برای درخواست عضویت به ${APPLICATION_COST.toLocaleString('fa-IR')} تومان نیاز دارید.`);
      return;
    }
    
    Alert.alert(
      'درخواست عضویت شورای محله',
      `آیا از پرداخت ${APPLICATION_COST.toLocaleString('fa-IR')} تومان برای بررسی صلاحیت اطمینان دارید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'پرداخت و درخواست', 
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            const res = await requestCouncilMembership(neighborhood.id);
            if (res?.success) {
              GameAudio.playApprove();
              Alert.alert('تبریک!', 'شما با موفقیت به شورای محله پیوستید.');
            } else {
              GameAudio.playError();
              const errorMsg = 
                res?.error === 'insufficient_funds' ? 'موجودی ناکافی' :
                res?.error === 'low_popularity' ? 'محبوبیت شما کافی نیست.' :
                res?.error === 'no_home' ? 'شما هیچ خانه‌ای در این محله ندارید.' :
                res?.error === 'power_too_low' ? 'قدرت شما برای جایگزینی عضو فعلی کافی نیست.' :
                'خطایی رخ داده است.';
              Alert.alert('درخواست رد شد', errorMsg);
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleElection = async () => {
    setActionLoading(true);
    const res = await triggerChairSelection(neighborhood.id);
    if (res?.success) {
      GameAudio.playApprove();
      Alert.alert('انتخابات انجام شد', 'رئیس جدید شورا بر اساس بالاترین قدرت انتخاب شد!');
    } else {
      GameAudio.playError();
      Alert.alert('خطا در انتخابات', 'امکان برگزاری انتخابات در حال حاضر وجود ندارد.');
    }
    setActionLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text variant="display" color="brand">🏛️</Text>
                <View>
                  <Text variant="heading" weight="bold" color="primary">مرکز شورای محله</Text>
                  <Text variant="body" color="secondary">{neighborhood.nameFa}</Text>
                </View>
              </View>
              {neighborhood.areaSqkm && (
                <View style={styles.areaBadge}>
                  <Text variant="caption" color="secondary">مساحت</Text>
                  <Text variant="body" weight="semibold" color="primary">{neighborhood.areaSqkm.toFixed(1)} km²</Text>
                </View>
              )}
            </View>

            {/* Chairman Banner */}
            <View style={styles.chairmanBanner}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <Text variant="label" color="brand">👑 رئیس شورای محله</Text>
              {chairMember ? (
                <View style={styles.chairmanInfo}>
                  <View style={[styles.avatar, { backgroundColor: chairMember.avatarColor || '#6C63FF' }]}>
                    <Text variant="heading" color="inverse">{chairMember.username?.charAt(0) || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="title" weight="bold" color="primary">{chairMember.username}</Text>
                    <Text variant="caption" color="secondary">
                      قدرت: {chairMember.power} | محبوبیت: {chairMember.popularity}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
                  در انتظار برگزاری انتخابات...
                </Text>
              )}
            </View>

            {/* Council Members List */}
            <Text variant="title" weight="semibold" color="primary" style={styles.sectionTitle}>
              اعضای شورا ({councilMembers.length} / {neighborhood.councilMemberCapacity ?? 5})
            </Text>
            
            {isLoading ? (
              <ActivityIndicator color="#F59E0B" />
            ) : (
              <View style={styles.membersList}>
                {councilMembers.map((m) => {
                  const isLowest = lowestPowerMember?.playerId === m.playerId && isFull;
                  return (
                    <View key={m.playerId} style={[styles.memberCard, isLowest && styles.memberCardAtRisk]}>
                      <View style={[styles.avatarSmall, { backgroundColor: m.avatarColor || '#6C63FF' }]}>
                        <Text variant="caption" color="inverse">{m.username?.charAt(0) || '?'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="body" weight="semibold" color="primary">{m.username}</Text>
                        <Text variant="caption" color="secondary">قدرت: {m.power}</Text>
                      </View>
                      {isLowest && !isMember && (
                        <View style={styles.atRiskBadge}>
                          <Text variant="caption" color="inverse">در خطر جایگزینی</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                {councilMembers.length === 0 && (
                  <Text variant="body" color="muted" center>هنوز عضوی در شورا وجود ندارد.</Text>
                )}
              </View>
            )}

            {/* Actions Section */}
            {!isMember ? (
              <View style={styles.applicationSection}>
                <Text variant="title" weight="semibold" color="primary" style={{ marginBottom: 12 }}>شرایط عضویت</Text>
                
                <View style={styles.reqRow}>
                  <Text variant="body" color="secondary">🌟 محبوبیت محله (حداقل {neighborhood.minCouncilPopularity ?? 50})</Text>
                  <Text variant="body" color={meetsPopularity ? 'brand' : 'error'}>
                    {meetsPopularity ? '✅' : '❌'}
                  </Text>
                </View>
                
                <View style={styles.reqRow}>
                  <Text variant="body" color="secondary">🏘️ مالکیت خانه در محله</Text>
                  <Text variant="body" color="brand">بررسی خودکار هنگام درخواست</Text>
                </View>

                {isFull && lowestPowerMember && (
                  <View style={styles.reqRow}>
                    <Text variant="body" color="secondary">⚔️ قدرت بیشتر از {lowestPowerMember.power}</Text>
                    <Text variant="body" color={meetsPowerToReplace ? 'brand' : 'error'}>
                      {meetsPowerToReplace ? '✅' : '❌'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.applyBtn, !hasCash && styles.applyBtnDisabled]} 
                  onPress={handleApply}
                  disabled={actionLoading}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.applyBtnGradient}
                  >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : (
                      <Text variant="body" weight="bold" color="inverse">
                        درخواست عضویت ({APPLICATION_COST.toLocaleString('fa-IR')} تومان)
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.memberDashboard}>
                <Text variant="title" weight="semibold" color="brand">شما عضو شورای این محله هستید 🎉</Text>
                
                <TouchableOpacity 
                  style={[styles.electionBtn, !canTriggerElection && styles.electionBtnDisabled]}
                  onPress={handleElection}
                  disabled={!canTriggerElection || actionLoading}
                >
                  <Ionicons name="refresh-circle" size={24} color="#fff" />
                  <Text variant="body" weight="bold" color="inverse" style={{ marginRight: 8 }}>
                    برگزاری انتخابات رئیس شورا
                  </Text>
                </TouchableOpacity>
                {!canTriggerElection && lastSelection && (
                  <Text variant="caption" color="secondary" center style={{ marginTop: 8 }}>
                    انتخابات بعدی در: {new Date(lastSelection.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR')}
                  </Text>
                )}
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
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    maxHeight: SCREEN_H * 0.9,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 14,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  areaBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 12,
  },
  chairmanBanner: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  chairmanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  membersList: {
    gap: 10,
    marginBottom: 24,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  memberCardAtRisk: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atRiskBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applicationSection: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  applyBtn: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnGradient: {
    padding: 16,
    alignItems: 'center',
  },
  memberDashboard: {
    padding: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
  },
  electionBtn: {
    marginTop: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  electionBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#6B7280',
  },
});
