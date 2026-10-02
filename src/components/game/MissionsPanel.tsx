/**
 * BuildIran — MissionsPanel (Gentleman Neon, v2)
 * «ماموریت‌ها» bottom sheet. Sections by status: claimable / active /
 * completed / expired, each with a SectionTitle and staggered MissionCards.
 * Empty state, pull-to-refresh and claim flow unchanged.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useMissionStore } from '@/store/useMissionStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { MissionSlot } from '@/types/missions.types';
import fa from '@/i18n/fa';
import { MissionCard } from './MissionCard';

interface MissionsPanelProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Sections (store statuses → display buckets) ──────────────────────────────

type SectionKey = 'claimable' | 'active' | 'completed' | 'expired';

const SECTION_ORDER: SectionKey[] = ['claimable', 'active', 'completed', 'expired'];

const SECTION_TITLE: Record<SectionKey, string> = {
  claimable: 'قابل دریافت',
  active: 'در جریان',
  completed: 'تکمیل شده',
  expired: 'منقضی شده',
};

const STATUS_SECTION: Record<string, SectionKey> = {
  completed: 'claimable', // objectives done — reward ready
  active: 'active',
  locked: 'active', // renders muted inside the card
  claimed: 'completed',
  expired: 'expired',
};

export function MissionsPanel({ visible, onClose }: MissionsPanelProps) {
  const { colors: c } = useTheme();
  const player = usePlayerStore((s) => s.player);
  const slots = useMissionStore((s) => s.slots);
  const isLoading = useMissionStore((s) => s.isLoading);
  const claimReward = useMissionStore((s) => s.claimReward);
  const refresh = useMissionStore((s) => s.refresh);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const allSlots = useMemo(() => Object.values(slots), [slots]);

  const sections = useMemo(() => {
    const buckets: Record<SectionKey, MissionSlot[]> = {
      claimable: [],
      active: [],
      completed: [],
      expired: [],
    };
    for (const slot of allSlots) {
      const key = STATUS_SECTION[slot.status];
      if (key) buckets[key].push(slot);
    }
    const byOrder = (a: MissionSlot, b: MissionSlot) =>
      (a.definition?.sortOrder ?? 0) - (b.definition?.sortOrder ?? 0);
    for (const key of SECTION_ORDER) buckets[key].sort(byOrder);
    return buckets;
  }, [allSlots]);

  // Continuous stagger index across all sections
  const staggerIndex = useMemo(() => {
    const map: Record<string, number> = {};
    let i = 0;
    for (const key of SECTION_ORDER) {
      for (const slot of sections[key]) map[slot.id] = i++;
    }
    return map;
  }, [sections]);

  const isEmpty = allSlots.length === 0;
  const doneCount = sections.completed.length + sections.claimable.length;
  const summary = `${doneCount.toLocaleString('fa-IR')} از ${allSlots.length.toLocaleString('fa-IR')} تکمیل شده`;

  const handleClaim = async (slotId: string) => {
    setClaimingIds((prev) => new Set(prev).add(slotId));
    await claimReward(slotId);
    setClaimingIds((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
  };

  const onRefresh = async () => {
    if (!player) return;
    setRefreshing(true);
    await refresh(player.id);
    setRefreshing(false);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={fa.missions.title}
      subtitle={isEmpty ? undefined : summary}
      maxHeight={0.85}
    >
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.brass[400]}
            colors={[c.brass[400]]}
          />
        }
      >
        {isLoading && !refreshing && isEmpty ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={c.brass[400]} />
            <Text variant="body" color="secondary" style={styles.loadingText}>
              {fa.missions.loading}
            </Text>
          </View>
        ) : isEmpty ? (
          <EmptyState
            icon="flag"
            tone="brass"
            title="ماموریتی در دسترس نیست"
            body={fa.missions.pullToRefresh}
          />
        ) : (
          SECTION_ORDER.filter((key) => sections[key].length > 0).map((key) => (
            <View key={key} style={styles.section}>
              <SectionTitle
                title={SECTION_TITLE[key]}
                trailing={
                  <Text variant="caption" color="muted" style={styles.sectionCount}>
                    {sections[key].length.toLocaleString('fa-IR')}
                  </Text>
                }
              />
              {sections[key].map((slot) => (
                <MissionCard
                  key={slot.id}
                  slot={slot}
                  index={staggerIndex[slot.id] ?? 0}
                  onClaim={handleClaim}
                  isClaiming={claimingIds.has(slot.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionCount: {
    fontVariant: ['tabular-nums'],
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    marginTop: Spacing.md,
  },
});

export default MissionsPanel;
