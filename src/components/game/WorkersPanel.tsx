/**
 * BuildIran — WorkersPanel («Gentleman Neon» v2)
 * NPC workers management sub-screen nested inside the Assets tab.
 * Three inner segments:
 *   1. کارگران من   — owned NPCs: class plate, level, XP bar, assign/train/revoke
 *   2. درخواست‌ها   — pending assignment requests into my businesses
 *   3. مسکن        — housing overview (main_house + resident_house capacity)
 *
 * Dual theme via useTheme() · ink cards · IconPlates per role · Chip rows ·
 * ProgressBar for XP/capacity · TouchableScale press springs on chips.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlate } from '@/components/ui/IconPlate';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

import { useNpcStore } from '@/store/useNpcStore';
import { useAssetStore } from '@/store/useAssetStore';
import type { Npc, NpcAssignment, NpcClass } from '@/types/game.types';
import { NPC_CLASS_CONFIG, NPC_LEVEL_XP_TABLE } from '@/lib/constants';
import { Motion, Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

// ─── Plate typing ─────────────────────────────────────────────────────────────

type PlateIcon = React.ComponentProps<typeof IconPlate>['name'];
type BarTone = 'brass' | 'jade' | 'crimson' | 'steel' | 'ember' | 'terracotta';
type ChipTone = React.ComponentProps<typeof Chip>['tone'];

/** NPC class → Ionicon + tint (no emoji; DESIGN.md iconography map). */
const CLASS_STYLE: Record<NpcClass, { icon: PlateIcon; tone: BarTone }> = {
  worker: { icon: 'construct', tone: 'steel' },
  foreman: { icon: 'hammer', tone: 'terracotta' },
  engineer: { icon: 'cog', tone: 'brass' },
  doctor: { icon: 'medical', tone: 'jade' },
  specialist: { icon: 'flask', tone: 'ember' },
  physician: { icon: 'pulse', tone: 'jade' },
};

// ─── TouchableScale (press spring, same recipe as HUD) ────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TouchableScale: React.FC<
  React.ComponentProps<typeof Pressable>
> = ({ onPressIn, onPressOut, style, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, Motion.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Motion.press);
        onPressOut?.(e);
      }}
    />
  );
};

// ─── Segment Type ─────────────────────────────────────────────────────────────

type WorkerSegment = 'my_workers' | 'requests' | 'housing';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkersPanelProps {
  userId: string | null;
}

const HIRE_CLASSES: NpcClass[] = ['worker', 'foreman', 'engineer', 'doctor', 'specialist', 'physician'];

// ─── Stat Card (summary) ──────────────────────────────────────────────────────

const PanelStat: React.FC<{
  icon: PlateIcon;
  tone: ChipTone;
  value: number | string;
  label: string;
  index: number;
}> = ({ icon, tone, value, label, index }) => (
  <Animated.View
    entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}
    style={panelStyles.statCell}
  >
    <Card padded={false} style={panelStyles.statCard}>
      <Chip icon={icon} value={value} tone={tone} />
      <Text variant="caption" color="secondary">{label}</Text>
    </Card>
  </Animated.View>
);

// ─── NPC Card ─────────────────────────────────────────────────────────────────

const NpcCard: React.FC<{
  npc: Npc;
  index: number;
  onAssign: (npc: Npc) => void;
  onTrain: (npc: Npc) => void;
  onRevoke: (npc: Npc) => void;
}> = ({ npc, index, onAssign, onTrain, onRevoke }) => {
  const { colors: c } = useTheme();
  const cfg = NPC_CLASS_CONFIG[npc.class];
  const cls = CLASS_STYLE[npc.class];

  const maxXp = NPC_LEVEL_XP_TABLE[Math.min(npc.level - 1, NPC_LEVEL_XP_TABLE.length - 1)];
  const xpPct = maxXp === Infinity ? 100 : Math.min((npc.experience / maxXp) * 100, 100);

  return (
    <Animated.View entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}>
      <Card sheen>
        {/* Header */}
        <View style={panelStyles.cardHeader}>
          <IconPlate name={cls.icon} tone={cls.tone} size="md" />
          <View style={panelStyles.cardInfo}>
            <View style={panelStyles.nameRow}>
              <Text variant="subtitle" weight="semibold" numberOfLines={1} style={panelStyles.nameText}>
                {npc.nameFa}
              </Text>
              <Chip
                icon={npc.isWorking ? 'checkmark-circle' : 'pause'}
                label={npc.isWorking ? 'مشغول' : 'بیکار'}
                tone={npc.isWorking ? 'jade' : 'neutral'}
              />
            </View>
            <Text variant="caption" color="secondary">
              {cfg.nameFa} — سطح {npc.level.toLocaleString('fa-IR')}
            </Text>
            {/* XP Row */}
            <View style={panelStyles.xpRow}>
              <ProgressBar
                percent={xpPct}
                tone={cls.tone}
                height={5}
                delay={Motion.stagger(index)}
                sheen={false}
                style={panelStyles.xpBar}
              />
              <Text variant="caption" color="muted" style={panelStyles.tabular}>
                {npc.experience.toLocaleString('fa-IR')} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties */}
        {npc.specialties.length > 0 && (
          <View style={panelStyles.specialtiesRow}>
            {npc.specialties.map((s) => (
              <Chip key={s} label={s} tone="steel" />
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={panelStyles.actionsRow}>
          {!npc.isWorking && (
            <Button
              label="تخصیص"
              variant="secondary"
              size="sm"
              icon={<Ionicons name="location" size={14} color={c.text.brand} />}
              onPress={() => onAssign(npc)}
              style={panelStyles.actionBtn}
            />
          )}
          <Button
            label="آموزش"
            variant="ghost"
            size="sm"
            icon={<Ionicons name="school" size={14} color={c.text.secondary} />}
            onPress={() => onTrain(npc)}
            style={panelStyles.actionBtn}
          />
          {npc.isWorking && (
            <Button
              label="لغو"
              variant="danger"
              size="sm"
              icon={<Ionicons name="close-circle" size={14} color={c.text.inverse} />}
              onPress={() => onRevoke(npc)}
              style={panelStyles.actionBtn}
            />
          )}
        </View>
      </Card>
    </Animated.View>
  );
};

// ─── Request Card ─────────────────────────────────────────────────────────────

const RequestCard: React.FC<{
  assignment: NpcAssignment;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ assignment, index, onApprove, onReject }) => (
  <Animated.View entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}>
    <Card sheen>
      <View style={panelStyles.cardHeader}>
        <IconPlate name="mail" tone="ember" size="md" />
        <View style={panelStyles.cardInfo}>
          <Text variant="body" weight="semibold">درخواست تخصیص کارگر</Text>
          <Text variant="caption" color="secondary" numberOfLines={2}>
            از: {assignment.requesterUsername ?? 'بازیکن'} — برای: {assignment.businessAssetType ?? 'کسب‌وکار'}
          </Text>
        </View>
        <Chip icon="time" label="در انتظار" tone="ember" />
      </View>
      <View style={panelStyles.btnRow}>
        <Button
          label="تأیید"
          variant="primary"
          size="sm"
          onPress={() => onApprove(assignment.id)}
          style={panelStyles.flexBtn}
        />
        <Button
          label="رد"
          variant="ghost"
          size="sm"
          onPress={() => onReject(assignment.id)}
          style={panelStyles.flexBtn}
        />
      </View>
    </Card>
  </Animated.View>
);

// ─── Housing Card ─────────────────────────────────────────────────────────────

const HousingCard: React.FC<{
  type: 'main_house' | 'resident_house';
  count: number;
  capacity?: number;
  residents?: number;
  index: number;
}> = ({ type, count, capacity = 0, residents = 0, index }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const isMain = type === 'main_house';
  const capacityPct = capacity > 0 ? Math.min((residents / capacity) * 100, 100) : 0;

  return (
    <Animated.View entering={FadeInDown.delay(Motion.stagger(index)).duration(Motion.durations.slow)}>
      <Card sheen>
        <View style={panelStyles.cardHeader}>
          <IconPlate name={isMain ? 'home' : 'bed'} tone={isMain ? 'brass' : 'steel'} size="md" />
          <View style={panelStyles.cardInfo}>
            <Text variant="body" weight="semibold">
              {isMain ? 'خانه اصلی' : 'خوابگاه کارگران'}
            </Text>
            <Text variant="caption" color="secondary">{count.toLocaleString('fa-IR')} سازه</Text>
            {!isMain && capacity > 0 && (
              <View style={panelStyles.xpRow}>
                <ProgressBar
                  percent={capacityPct}
                  tone="steel"
                  height={5}
                  delay={Motion.stagger(index)}
                  sheen={false}
                  style={panelStyles.xpBar}
                />
                <Text variant="caption" color="secondary" style={panelStyles.tabular}>
                  {residents.toLocaleString('fa-IR')}/{capacity.toLocaleString('fa-IR')}
                </Text>
              </View>
            )}
          </View>
        </View>
        {isMain && count === 0 && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={13} color={c.ember} />
            <Text variant="caption" color="secondary">
              برای استخدام کارگر، ابتدا خانه اصلی بسازید
            </Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

// ─── Hire NPC Sheet ───────────────────────────────────────────────────────────

const HireModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onHire: (cls: NpcClass, name: string, homeId: string | null) => Promise<void>;
  residentHouses: Array<{ id: string; areaM2: number; floorCount: number; level: number; currentWorkerCount: number; maxCapacity: number }>;
}> = ({ visible, onClose, onHire, residentHouses }) => {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
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

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="استخدام کارگر جدید"
      subtitle="کلاس، نام و خوابگاه کارگر را انتخاب کنید"
      footer={
        <View style={panelStyles.btnRow}>
          <Button label="انصراف" variant="ghost" onPress={onClose} style={panelStyles.flexBtn} />
          <Button
            label={`استخدام — ${cfg.hiringCost.toLocaleString('fa-IR')}`}
            variant="primary"
            loading={loading}
            onPress={handleHire}
            style={panelStyles.hireBtn}
          />
        </View>
      }
    >
      <View style={panelStyles.sheetBody}>
        {/* Class Selector */}
        <Text variant="label" color="secondary">کلاس کارگر</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={panelStyles.classList}>
          {HIRE_CLASSES.map((cls) => {
            const cc = NPC_CLASS_CONFIG[cls];
            const st = CLASS_STYLE[cls];
            const isActive = selectedClass === cls;
            return (
              <TouchableScale
                key={cls}
                onPress={() => setSelectedClass(cls)}
                accessibilityRole="button"
                accessibilityLabel={cc.nameFa}
                style={[styles.classChip, isActive && styles.classChipActive]}
              >
                <IconPlate name={st.icon} tone={st.tone} size="sm" bordered={false} />
                <Text variant="caption" weight={isActive ? 'semibold' : 'medium'} color={isActive ? 'brand' : 'primary'}>
                  {cc.nameFa}
                </Text>
                <View style={panelStyles.costRow}>
                  <Ionicons name="cash" size={11} color={c.brass[400]} />
                  <Text variant="caption" color="muted" style={panelStyles.tabular}>
                    {cc.hiringCost.toLocaleString('fa-IR')}
                  </Text>
                </View>
              </TouchableScale>
            );
          })}
        </ScrollView>

        {/* Name Input */}
        <Input
          label="نام کارگر"
          icon="person"
          value={name}
          onChangeText={setName}
          placeholder="نام کارگر را وارد کنید..."
        />

        {/* Home Selector */}
        {residentHouses.length > 0 && (
          <View style={panelStyles.homeSection}>
            <Text variant="label" color="secondary">انتخاب خوابگاه</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={panelStyles.classList}>
              {residentHouses.map((h) => {
                const cap = h.maxCapacity;
                const isFull = h.currentWorkerCount >= cap;
                const isSelected = selectedHome === h.id;
                return (
                  <TouchableScale
                    key={h.id}
                    onPress={() => !isFull && setSelectedHome(isSelected ? null : h.id)}
                    disabled={isFull}
                    accessibilityRole="button"
                    accessibilityLabel={`خوابگاه ظرفیت ${cap}`}
                    style={[
                      styles.homeChip,
                      isSelected && styles.homeChipSelected,
                      isFull && panelStyles.homeChipFull,
                    ]}
                  >
                    <IconPlate name="bed" tone={isSelected ? 'brass' : 'steel'} size="xxs" bordered={false} />
                    <Text variant="caption" color="primary" style={panelStyles.tabular}>
                      {cap.toLocaleString('fa-IR')} نفر
                    </Text>
                    <Text variant="caption" color="muted" style={panelStyles.tabular}>
                      {h.currentWorkerCount.toLocaleString('fa-IR')}/{cap.toLocaleString('fa-IR')}
                    </Text>
                  </TouchableScale>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </Sheet>
  );
};

// ─── WorkersPanel ──────────────────────────────────────────────────────────────

export const WorkersPanel: React.FC<WorkersPanelProps> = ({ userId }) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
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
  const workingCount = npcList.filter((n) => n.isWorking).length;
  const idleCount = npcList.length - workingCount;

  return (
    <View style={panelStyles.root}>
      {/* Segment Tabs */}
      <View style={panelStyles.tabsWrap}>
        <SegmentedTabs
          items={[
            { key: 'my_workers', label: 'کارگران' },
            { key: 'requests', label: 'درخواست‌ها' },
            { key: 'housing', label: 'مسکن' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[panelStyles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── My Workers ── */}
        {segment === 'my_workers' && (
          <>
            <SectionTitle
              kicker="نیروی انسانی"
              title="کارگران من"
              trailing={
                <Text variant="caption" color="secondary">
                  {npcList.length.toLocaleString('fa-IR')} نفر
                </Text>
              }
            />

            {/* Summary row */}
            <View style={panelStyles.summaryRow}>
              <PanelStat index={0} icon="people" tone="steel" value={npcList.length} label="کل کارگران" />
              <PanelStat index={1} icon="checkmark-circle" tone="jade" value={workingCount} label="مشغول" />
              <PanelStat index={2} icon="pause" tone="neutral" value={idleCount} label="بیکار" />
            </View>

            {/* Hire — the one primary action */}
            <Button
              label="استخدام کارگر جدید"
              variant="primary"
              icon={<Ionicons name="person-add" size={16} color={c.text.inverse} />}
              onPress={() => setShowHireModal(true)}
              fullWidth
            />

            {isLoading && <ActivityIndicator color={c.brass[400]} style={panelStyles.loader} />}

            {!isLoading && npcList.length === 0 && (
              <EmptyState
                icon="people"
                title="هیچ کارگری ندارید"
                body={
                  mainHouses.length === 0
                    ? 'ابتدا خانه اصلی بسازید. کارگران در کسب‌وکارهای شما فعالیت می‌کنند و حتی در آفلاین بازی، امتیاز فعالیت می‌سازند.'
                    : 'کارگران در کسب‌وکارهای شما فعالیت می‌کنند و حتی در آفلاین بازی، امتیاز فعالیت می‌سازند.'
                }
              />
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
            <SectionTitle
              kicker="تخصیص"
              title="درخواست‌ها"
              trailing={
                <Text variant="caption" color="secondary">
                  {pendingRequests.length.toLocaleString('fa-IR')} در انتظار
                </Text>
              }
            />
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon="mail"
                tone="steel"
                title="درخواستی ندارید"
                body="وقتی بازیکنان دیگر کارگرشان را به کسب‌وکار شما تخصیص دهند، اینجا نمایش داده می‌شود."
              />
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
            <SectionTitle
              kicker="مسکن"
              title="خانه و خوابگاه"
              trailing={
                <Text variant="caption" color="secondary" style={panelStyles.tabular}>
                  {totalResidents.toLocaleString('fa-IR')}/{totalCapacity.toLocaleString('fa-IR')}
                </Text>
              }
            />

            <View style={panelStyles.summaryRow}>
              <PanelStat index={0} icon="home" tone="brass" value={mainHouses.length} label="خانه اصلی" />
              <PanelStat index={1} icon="bed" tone="steel" value={residentHouses.length} label="خوابگاه" />
              <PanelStat
                index={2}
                icon="people"
                tone="jade"
                value={`${totalResidents.toLocaleString('fa-IR')}/${totalCapacity.toLocaleString('fa-IR')}`}
                label="ظرفیت"
              />
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
              <Card sheen style={panelStyles.infoCard}>
                <View style={panelStyles.infoHeader}>
                  <IconPlate name="bulb" tone="jade" size="xxs" bordered={false} />
                  <Text variant="body" color="secondary" style={panelStyles.infoText}>
                    خوابگاه کارگران را روی نقشه بسازید تا بتوانید کارگران بیشتری استخدام کنید.
                  </Text>
                </View>
                <Text variant="caption" color="muted">
                  ظرفیت خوابگاه = طبقه² × ضریب مساحت × ضریب طبقات
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Hire Sheet */}
      {showHireModal && (
        <HireModal
          visible={showHireModal}
          onClose={() => setShowHireModal(false)}
          onHire={async (cls, name, homeId) => {
            const result = await hireNpc({ npcClass: cls, nameFa: name, homeAssetId: homeId });
            if (result) {
              Alert.alert('موفق', `کارگر "${result.nameFa}" استخدام شد!`);
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

// ─── Styles ──────────────────────────────────────────────────────────────────

/** Tinted + composed styles (chips carry geometry too) — useMemo(makeStyles(c)). */
const makeStyles = (c: Palette) =>
  StyleSheet.create({
    warningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: `${c.ember}14`,
      borderWidth: 1,
      borderColor: `${c.ember}3D`,
      borderRadius: 8,
      padding: Spacing.sm + 2,
    },
    classChip: {
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border.default,
      backgroundColor: c.ink[600],
    },
    classChipActive: {
      borderColor: c.brass[500],
      backgroundColor: `${c.brass[400]}1F`,
    },
    homeChip: {
      alignItems: 'center',
      gap: Spacing.xxs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border.default,
      backgroundColor: c.ink[600],
    },
    homeChipSelected: {
      borderColor: c.brass[500],
      backgroundColor: `${c.brass[400]}1F`,
    },
  });

/** Geometry-only styles — mode-independent, safe at module scope. */
const panelStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCell: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  nameText: {
    flexShrink: 1,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  xpBar: {
    flex: 1,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexGrow: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  hireBtn: {
    flex: 2,
  },
  infoCard: {
    gap: Spacing.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  sheetBody: {
    gap: Spacing.lg,
  },
  classList: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.xxs,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  homeSection: {
    gap: Spacing.sm,
  },
  homeChipFull: {
    opacity: 0.4,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});

export default WorkersPanel;
