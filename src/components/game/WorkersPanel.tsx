/**
 * BuildIran — WorkersPanel
 * NPC workers management sub-screen nested inside the Assets tab.
 * Three inner segments:
 *   1. کارگران من   — owned NPCs: class badge, level, XP bar, assign/train/revoke
 *   2. درخواست‌ها   — pending assignment requests into my businesses
 *   3. مسکن        — housing overview (main_house + resident_house capacity)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useNpcStore } from '@/store/useNpcStore';
import { useAssetStore } from '@/store/useAssetStore';
import type { Npc, NpcAssignment, NpcClass } from '@/types/game.types';
import {
  NPC_CLASS_CONFIG,
  NPC_LEVEL_XP_TABLE,
  computeResidentHouseCapacity,
} from '@/lib/constants';

// ─── Class Color Map ──────────────────────────────────────────────────────────

const CLASS_COLORS: Record<NpcClass, string> = {
  worker:     '#6C63FF',
  foreman:    '#F59E0B',
  engineer:   '#3B82F6',
  doctor:     '#10B981',
  specialist: '#8B5CF6',
  physician:  '#EC4899',
};

// ─── Segment Type ─────────────────────────────────────────────────────────────

type WorkerSegment = 'my_workers' | 'requests' | 'housing';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkersPanelProps {
  userId: string | null;
}

// ─── XP Progress Bar ──────────────────────────────────────────────────────────

const XpBar: React.FC<{ xp: number; level: number; color: string }> = ({ xp, level, color }) => {
  const maxXp = NPC_LEVEL_XP_TABLE[Math.min(level - 1, NPC_LEVEL_XP_TABLE.length - 1)];
  const pct = maxXp === Infinity ? 100 : Math.min((xp / maxXp) * 100, 100);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 800 });
  }, [pct]);

  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

  return (
    <View style={xpStyles.track}>
      <Animated.View style={[xpStyles.fill, { backgroundColor: color }, animStyle]} />
    </View>
  );
};

const xpStyles = StyleSheet.create({
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── NPC Card ─────────────────────────────────────────────────────────────────

const NpcCard: React.FC<{
  npc: Npc;
  index: number;
  onAssign: (npc: Npc) => void;
  onTrain: (npc: Npc) => void;
  onRevoke: (npc: Npc) => void;
}> = ({ npc, index, onAssign, onTrain, onRevoke }) => {
  const cfg = NPC_CLASS_CONFIG[npc.class];
  const color = CLASS_COLORS[npc.class];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[npcCardStyles.card, { borderColor: `${color}40` }]}>
        <LinearGradient
          colors={[`${color}18`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={npcCardStyles.header}>
          <View style={[npcCardStyles.classBadge, { backgroundColor: `${color}30`, borderColor: `${color}60` }]}>
            <Text variant="display" color="primary" style={npcCardStyles.emoji}>{cfg.emoji}</Text>
          </View>
          <View style={npcCardStyles.info}>
            <View style={npcCardStyles.nameRow}>
              <Text variant="body" weight="bold" color="primary">{npc.nameFa}</Text>
              <View style={[npcCardStyles.statusDot, { backgroundColor: npc.isWorking ? '#10B981' : '#6B7280' }]} />
            </View>
            <Text variant="caption" color="secondary" style={{ color }}>
              {cfg.nameFa} — سطح {npc.level}
            </Text>
            {/* XP Row */}
            <View style={npcCardStyles.xpRow}>
              <XpBar xp={npc.experience} level={npc.level} color={color} />
              <Text variant="caption" color="muted" style={npcCardStyles.xpLabel}>
                {npc.experience.toLocaleString('fa-IR')} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties */}
        {npc.specialties.length > 0 && (
          <View style={npcCardStyles.specialtiesRow}>
            {npc.specialties.map((s) => (
              <View key={s} style={npcCardStyles.specialtyChip}>
                <Text variant="caption" color="secondary">🔬 {s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status + Actions */}
        <View style={npcCardStyles.actionsRow}>
          <View style={[npcCardStyles.statusChip, { borderColor: npc.isWorking ? '#10B98140' : '#6B728040' }]}>
            <Text variant="caption" color="secondary">
              {npc.isWorking ? '🟢 مشغول' : '⚪ بیکار'}
            </Text>
          </View>

          {!npc.isWorking && (
            <TouchableOpacity
              style={[npcCardStyles.actionBtn, { borderColor: `${color}50`, backgroundColor: `${color}15` }]}
              onPress={() => onAssign(npc)}
              accessibilityLabel={`تخصیص کارگر ${npc.nameFa}`}
            >
              <Text variant="caption" weight="medium" color="primary">📍 تخصیص</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[npcCardStyles.actionBtn, { borderColor: '#6C63FF50', backgroundColor: '#6C63FF15' }]}
            onPress={() => onTrain(npc)}
            accessibilityLabel={`آموزش کارگر ${npc.nameFa}`}
          >
            <Text variant="caption" weight="medium" color="primary">🎓 آموزش</Text>
          </TouchableOpacity>

          {npc.isWorking && (
            <TouchableOpacity
              style={[npcCardStyles.actionBtn, { borderColor: '#EF444450', backgroundColor: '#EF444415' }]}
              onPress={() => onRevoke(npc)}
              accessibilityLabel={`لغو تخصیص کارگر ${npc.nameFa}`}
            >
              <Text variant="caption" weight="medium" color="primary">🚫 لغو</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const npcCardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  classBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  xpLabel: { fontSize: 10, minWidth: 60, textAlign: 'right' },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specialtyChip: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
});

// ─── Request Card ─────────────────────────────────────────────────────────────

const RequestCard: React.FC<{
  assignment: NpcAssignment;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ assignment, index, onApprove, onReject }) => (
  <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
    <View style={reqStyles.card}>
      <LinearGradient colors={['rgba(245,158,11,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={reqStyles.topRow}>
        <Text variant="body" weight="bold" color="primary">📨 درخواست تخصیص کارگر</Text>
        <View style={reqStyles.pendingChip}>
          <Text variant="caption" color="secondary">در انتظار</Text>
        </View>
      </View>
      <Text variant="caption" color="secondary">
        از: {assignment.requesterUsername ?? 'بازیکن'} — برای: {assignment.businessAssetType ?? 'کسب‌وکار'}
      </Text>
      <View style={reqStyles.btnRow}>
        <TouchableOpacity
          style={[reqStyles.btn, reqStyles.approveBtn]}
          onPress={() => onApprove(assignment.id)}
          accessibilityLabel="تأیید درخواست"
        >
          <Text variant="caption" weight="bold" color="primary">✅ تأیید</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[reqStyles.btn, reqStyles.rejectBtn]}
          onPress={() => onReject(assignment.id)}
          accessibilityLabel="رد درخواست"
        >
          <Text variant="caption" weight="bold" color="primary">❌ رد</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Animated.View>
);

const reqStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    overflow: 'hidden',
    padding: 14,
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingChip: {
    borderRadius: 6,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  approveBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' },
  rejectBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
});

// ─── Housing Card ─────────────────────────────────────────────────────────────

const HousingCard: React.FC<{
  type: 'main_house' | 'resident_house';
  count: number;
  capacity?: number;
  residents?: number;
  index: number;
}> = ({ type, count, capacity = 0, residents = 0, index }) => {
  const isMain = type === 'main_house';
  const color = isMain ? '#F59E0B' : '#6C63FF';
  const capacityPct = capacity > 0 ? Math.min((residents / capacity) * 100, 100) : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={[housingStyles.card, { borderColor: `${color}40` }]}>
        <LinearGradient colors={[`${color}15`, 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={housingStyles.header}>
          <Text variant="display" color="primary" style={housingStyles.icon}>
            {isMain ? '🏡' : '🏘️'}
          </Text>
          <View style={housingStyles.info}>
            <Text variant="body" weight="bold" color="primary">
              {isMain ? 'خانه اصلی' : 'خوابگاه کارگران'}
            </Text>
            <Text variant="caption" color="secondary">{count} سازه</Text>
            {!isMain && capacity > 0 && (
              <>
                <View style={housingStyles.capRow}>
                  <View style={housingStyles.capTrack}>
                    <View style={[housingStyles.capFill, { width: `${capacityPct}%`, backgroundColor: color }]} />
                  </View>
                  <Text variant="caption" color="secondary">{residents}/{capacity}</Text>
                </View>
              </>
            )}
          </View>
        </View>
        {isMain && count === 0 && (
          <View style={housingStyles.warningRow}>
            <Text variant="caption" color="secondary">⚠️ برای استخدام کارگر، ابتدا خانه اصلی بسازید</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const housingStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { fontSize: 28 },
  info: { flex: 1, gap: 4 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capTrack: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 4 },
  warningRow: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
});

// ─── Hire NPC Modal ────────────────────────────────────────────────────────────

const HIRE_CLASSES: NpcClass[] = ['worker', 'foreman', 'engineer', 'doctor', 'specialist', 'physician'];

const HireModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onHire: (cls: NpcClass, name: string, homeId: string | null) => Promise<void>;
  residentHouses: Array<{ id: string; areaM2: number; floorCount: number; level: number; currentWorkerCount: number; maxCapacity: number }>;
}> = ({ visible, onClose, onHire, residentHouses }) => {
  const [selectedClass, setSelectedClass] = useState<NpcClass>('worker');
  const [name, setName] = useState('');
  const [selectedHome, setSelectedHome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cfg = NPC_CLASS_CONFIG[selectedClass];

  const handleHire = async () => {
    if (!name.trim()) { Alert.alert('خطا', 'نام کارگر را وارد کنید'); return; }
    setLoading(true);
    await onHire(selectedClass, name.trim(), selectedHome);
    setLoading(false);
    setName('');
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={hireStyles.overlay}>
      <View style={hireStyles.sheet}>
        <LinearGradient colors={['#0D1533', '#080C1A']} style={StyleSheet.absoluteFill} />

        <Text variant="title" weight="bold" color="primary">👷 استخدام کارگر جدید</Text>

        {/* Class Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={hireStyles.classList}>
          {HIRE_CLASSES.map((cls) => {
            const c = NPC_CLASS_CONFIG[cls];
            const isActive = selectedClass === cls;
            return (
              <TouchableOpacity
                key={cls}
                style={[hireStyles.classChip, isActive && { borderColor: CLASS_COLORS[cls], backgroundColor: `${CLASS_COLORS[cls]}25` }]}
                onPress={() => setSelectedClass(cls)}
                accessibilityLabel={c.nameFa}
              >
                <Text variant="body" color="primary">{c.emoji}</Text>
                <Text variant="caption" weight={isActive ? 'bold' : 'regular'} color={isActive ? 'brand' : 'secondary'}>
                  {c.nameFa}
                </Text>
                <Text variant="caption" color="muted">💰 {c.hiringCost.toLocaleString('fa-IR')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Name Input */}
        <TextInput
          style={hireStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="نام کارگر را وارد کنید..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          textAlign="right"
        />

        {/* Home Selector */}
        {residentHouses.length > 0 && (
          <View style={hireStyles.homeSection}>
            <Text variant="caption" color="secondary">انتخاب خوابگاه:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={hireStyles.homeList}>
              {residentHouses.map((h) => {
                const cap = h.maxCapacity;
                const isFull = h.currentWorkerCount >= cap;
                const isSelected = selectedHome === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[hireStyles.homeChip, isSelected && hireStyles.homeChipSelected, isFull && hireStyles.homeChipFull]}
                    onPress={() => !isFull && setSelectedHome(isSelected ? null : h.id)}
                    disabled={isFull}
                    accessibilityLabel={`خوابگاه ظرفیت ${cap}`}
                  >
                    <Text variant="caption" color="primary">🏘️ {cap} نفر</Text>
                    <Text variant="caption" color="secondary">{h.currentWorkerCount}/{cap}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={hireStyles.btnRow}>
          <TouchableOpacity style={hireStyles.cancelBtn} onPress={onClose}>
            <Text variant="body" color="secondary">انصراف</Text>
          </TouchableOpacity>
          <TouchableOpacity style={hireStyles.hireBtn} onPress={handleHire} disabled={loading}>
            <LinearGradient
              colors={[CLASS_COLORS[selectedClass], '#6C63FF']}
              style={hireStyles.hireBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text variant="body" weight="bold" color="inverse">
                    {cfg.emoji} استخدام — {cfg.hiringCost.toLocaleString('fa-IR')} 💰
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const hireStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100 },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    padding: 24,
    paddingBottom: 48,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  classList: { flexDirection: 'row' },
  classChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 8,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'VazirmatnMedium',
    textAlign: 'right',
  },
  homeSection: { gap: 8 },
  homeList: { flexDirection: 'row' },
  homeChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    marginRight: 8,
    gap: 2,
    backgroundColor: 'rgba(108,99,255,0.1)',
  },
  homeChipSelected: { borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.25)' },
  homeChipFull: { opacity: 0.4 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  hireBtn: { flex: 2, borderRadius: 12, overflow: 'hidden', elevation: 6 },
  hireBtnGradient: { paddingVertical: 14, alignItems: 'center' },
});

// ─── WorkersPanel ──────────────────────────────────────────────────────────────

export const WorkersPanel: React.FC<WorkersPanelProps> = ({ userId }) => {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<WorkerSegment>('my_workers');
  const [showHireModal, setShowHireModal] = useState(false);

  const {
    npcs, pendingRequests,
    fetchMyNpcs, fetchPendingRequests,
    hireNpc, respondToRequest, revokeAssignment, isLoading,
  } = useNpcStore();

  const assets = useAssetStore((s) => s.assets);

  const myAssets = useMemo(
    () => userId ? Object.values(assets).filter((a) => a.ownerId === userId) : [],
    [assets, userId],
  );
  const mainHouses     = useMemo(() => myAssets.filter((a) => a.type === 'main_house'), [myAssets]);
  const residentHouses = useMemo(() => myAssets.filter((a) => a.type === 'resident_house'), [myAssets]);
  const npcList        = useMemo(() => Object.values(npcs), [npcs]);

  useEffect(() => {
    if (!userId) return;
    fetchMyNpcs(userId);
    fetchPendingRequests(userId);
    const unsub = useNpcStore.getState().subscribeToNpcs(userId);
    return unsub;
  }, [userId]);

  const handleApprove = useCallback(async (id: string) => {
    await respondToRequest(id, true);
    if (userId) await fetchPendingRequests(userId);
  }, [respondToRequest, fetchPendingRequests, userId]);

  const handleReject = useCallback(async (id: string) => {
    Alert.alert('رد درخواست', 'آیا مطمئن هستید؟', [
      { text: 'خیر', style: 'cancel' },
      { text: 'رد', style: 'destructive', onPress: async () => {
        await respondToRequest(id, false);
      }},
    ]);
  }, [respondToRequest]);

  const handleRevoke = useCallback((npc: Npc) => {
    Alert.alert('لغو تخصیص', `کارگر "${npc.nameFa}" را از کار خارج می‌کنید؟`, [
      { text: 'انصراف', style: 'cancel' },
      { text: 'لغو تخصیص', style: 'destructive', onPress: async () => {
        // Find active assignment
        const asgns = useNpcStore.getState().assignments;
        const a = asgns.find((x) => x.npcId === npc.id && x.status === 'approved');
        if (a) await revokeAssignment(a.id);
      }},
    ]);
  }, [revokeAssignment]);

  const handleAssign = useCallback((npc: Npc) => {
    Alert.alert('تخصیص کارگر', 'برای تخصیص این کارگر به یک کسب‌وکار، از روی نقشه کسب‌وکار مورد نظر را انتخاب کنید.');
  }, []);

  const handleTrain = useCallback((npc: Npc) => {
    Alert.alert('آموزش کارگر', 'برای آموزش این کارگر، از روی نقشه یک مؤسسه آموزشی (دانشگاه، بیمارستان، باشگاه و ...) را انتخاب کنید و در صفحه جزئیات دکمه آموزش را بزنید.');
  }, []);

  const totalCapacity = residentHouses.reduce((s, h) => s + (h.maxCapacity || 0), 0);
  const totalResidents = residentHouses.reduce((s, h) => s + (h.currentWorkerCount || 0), 0);

  // ── Segment Tabs ──────────────────────────────────────────────────────────

  const SEGMENTS: Array<{ key: WorkerSegment; label: string; badge?: number }> = [
    { key: 'my_workers', label: '👷 کارگران', badge: npcList.length },
    { key: 'requests',   label: '📨 درخواست‌ها', badge: pendingRequests.length },
    { key: 'housing',    label: '🏠 مسکن' },
  ];

  return (
    <View style={panelStyles.root}>
      {/* Segment Pills */}
      <View style={panelStyles.segmentRow}>
        {SEGMENTS.map(({ key, label, badge }) => {
          const active = segment === key;
          return (
            <TouchableOpacity
              key={key}
              style={[panelStyles.segPill, active && panelStyles.segPillActive]}
              onPress={() => setSegment(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                variant="caption"
                weight={active ? 'bold' : 'regular'}
                color={active ? 'brand' : 'secondary'}
              >
                {label}
              </Text>
              {!!badge && badge > 0 && (
                <View style={panelStyles.badge}>
                  <Text variant="caption" weight="bold" color="primary" style={panelStyles.badgeText}>
                    {badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={panelStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── My Workers ── */}
        {segment === 'my_workers' && (
          <>
            {/* Summary row */}
            <View style={panelStyles.summaryRow}>
              <View style={panelStyles.summaryCard}>
                <Text variant="body" weight="bold" color="primary">{npcList.length}</Text>
                <Text variant="caption" color="secondary">کل کارگران</Text>
              </View>
              <View style={panelStyles.summaryCard}>
                <Text variant="body" weight="bold" color="primary" style={{ color: '#10B981' }}>
                  {npcList.filter((n) => n.isWorking).length}
                </Text>
                <Text variant="caption" color="secondary">مشغول</Text>
              </View>
              <View style={panelStyles.summaryCard}>
                <Text variant="body" weight="bold" color="primary" style={{ color: '#6B7280' }}>
                  {npcList.filter((n) => !n.isWorking).length}
                </Text>
                <Text variant="caption" color="secondary">بیکار</Text>
              </View>
            </View>

            {/* Hire Button */}
            <TouchableOpacity
              style={panelStyles.hireBtn}
              onPress={() => setShowHireModal(true)}
              accessibilityLabel="استخدام کارگر جدید"
            >
              <LinearGradient
                colors={['#6C63FF', '#A78BFA']}
                style={panelStyles.hireBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text variant="body" weight="bold" color="inverse">+ استخدام کارگر جدید</Text>
              </LinearGradient>
            </TouchableOpacity>

            {isLoading && <ActivityIndicator color="#6C63FF" style={{ marginTop: 20 }} />}

            {!isLoading && npcList.length === 0 && (
              <View style={panelStyles.emptyState}>
                <Text variant="display" color="brand" style={{ fontSize: 48 }}>👷</Text>
                <Text variant="heading" weight="bold" color="primary">هیچ کارگری ندارید</Text>
                {mainHouses.length === 0 && (
                  <Text variant="body" color="secondary" style={panelStyles.emptyHint}>
                    ⚠️ ابتدا خانه اصلی بسازید
                  </Text>
                )}
                <Text variant="body" color="secondary" style={panelStyles.emptyHint}>
                  کارگران در کسب‌وکارهای شما فعالیت می‌کنند و حتی در آفلاین بازی، امتیاز فعالیت می‌سازند.
                </Text>
              </View>
            )}

            {npcList.map((npc, i) => (
              <NpcCard
                key={npc.id}
                npc={npc}
                index={i}
                onAssign={handleAssign}
                onTrain={handleTrain}
                onRevoke={handleRevoke}
              />
            ))}
          </>
        )}

        {/* ── Pending Requests ── */}
        {segment === 'requests' && (
          <>
            {pendingRequests.length === 0 ? (
              <View style={panelStyles.emptyState}>
                <Text variant="display" color="brand" style={{ fontSize: 48 }}>📭</Text>
                <Text variant="heading" weight="bold" color="primary">درخواستی ندارید</Text>
                <Text variant="body" color="secondary" style={panelStyles.emptyHint}>
                  وقتی بازیکنان دیگر کارگرشان را به کسب‌وکار شما تخصیص دهند، اینجا نمایش داده می‌شود.
                </Text>
              </View>
            ) : (
              pendingRequests.map((a, i) => (
                <RequestCard
                  key={a.id}
                  assignment={a}
                  index={i}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </>
        )}

        {/* ── Housing ── */}
        {segment === 'housing' && (
          <>
            <View style={panelStyles.housingStats}>
              <View style={panelStyles.houseStat}>
                <Text variant="title" weight="bold" color="primary">{mainHouses.length}</Text>
                <Text variant="caption" color="secondary">خانه اصلی</Text>
              </View>
              <View style={panelStyles.houseStat}>
                <Text variant="title" weight="bold" color="primary">{residentHouses.length}</Text>
                <Text variant="caption" color="secondary">خوابگاه</Text>
              </View>
              <View style={panelStyles.houseStat}>
                <Text variant="title" weight="bold" color="primary">{totalResidents}/{totalCapacity}</Text>
                <Text variant="caption" color="secondary">ظرفیت</Text>
              </View>
            </View>

            <HousingCard type="main_house" count={mainHouses.length} index={0} />

            {residentHouses.map((h, i) => (
              <HousingCard
                key={h.id}
                type="resident_house"
                count={1}
                capacity={h.maxCapacity}
                residents={h.currentWorkerCount}
                index={i + 1}
              />
            ))}

            {residentHouses.length === 0 && mainHouses.length > 0 && (
              <View style={panelStyles.infoBox}>
                <Text variant="body" color="secondary">
                  💡 خوابگاه کارگران را روی نقشه بسازید تا بتوانید کارگران بیشتری استخدام کنید.
                </Text>
                <Text variant="caption" color="muted" style={{ marginTop: 6 }}>
                  ظرفیت خوابگاه = طبقه² × ضریب مساحت × ضریب طبقات
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Hire Modal */}
      {showHireModal && (
        <HireModal
          visible={showHireModal}
          onClose={() => setShowHireModal(false)}
          onHire={async (cls, name, homeId) => {
            const result = await hireNpc({ npcClass: cls, nameFa: name, homeAssetId: homeId });
            if (result) {
              Alert.alert('✅ موفق', `کارگر "${result.nameFa}" استخدام شد!`);
            }
          }}
          residentHouses={residentHouses.map((h) => ({
            id: h.id,
            areaM2: h.areaM2,
            floorCount: h.floorCount,
            level: h.level,
            currentWorkerCount: h.currentWorkerCount,
            maxCapacity: h.maxCapacity,
          }))}
        />
      )}
    </View>
  );
};

const panelStyles = StyleSheet.create({
  root: { flex: 1 },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  segPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  segPillActive: {
    borderColor: 'rgba(108,99,255,0.5)',
    backgroundColor: 'rgba(108,99,255,0.15)',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, lineHeight: 14 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 0 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  hireBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 6,
  },
  hireBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyHint: { textAlign: 'center', lineHeight: 22, marginTop: 4 },
  housingStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  houseStat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  infoBox: {
    backgroundColor: 'rgba(108,99,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.25)',
    padding: 14,
    marginTop: 6,
  },
});
