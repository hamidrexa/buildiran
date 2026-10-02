/**
 * BuildIran — NCC (Neighborhood Council) Dashboard Modal — «Gentleman Neon» (v2)
 * Sheet: chairman hero card, council member rows with tabular stats,
 * membership requirements and the single primary action (apply / election)
 * in the Sheet footer. All store calls (fetchCouncilMembers,
 * requestCouncilMembership, triggerChairSelection), Alert flows, audio and
 * public props unchanged. Passive/admin surface — no neon.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Radii, Spacing, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { Ionicons } from '@expo/vector-icons';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Neighborhood, CouncilMember } from '@/types/game.types';
import { GameAudio } from '@/lib/audio';
import Animated, { FadeInDown } from 'react-native-reanimated';

const APPLICATION_COST = 50000; // Constant value based on user request

const fa = (n: number) => n.toLocaleString('fa-IR');
const fa1 = (n: number) =>
  n.toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface NCCDashboardModalProps {
  visible: boolean;
  neighborhood: Neighborhood | null;
  onClose: () => void;
}

export function NCCDashboardModal({ visible, neighborhood, onClose }: NCCDashboardModalProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

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

  const capacity = neighborhood.councilMemberCapacity ?? 5;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="مرکز شورای محله"
      subtitle={neighborhood.nameFa}
      maxHeight={0.9}
      footer={
        !isMember ? (
          <Button
            label={`درخواست عضویت (${fa(APPLICATION_COST)} تومان)`}
            onPress={handleApply}
            loading={actionLoading}
            disabled={!hasCash}
            fullWidth
          />
        ) : (
          <Button
            label="برگزاری انتخابات رئیس شورا"
            icon={<Ionicons name="refresh" size={16} color={c.text.inverse} />}
            onPress={handleElection}
            loading={actionLoading}
            disabled={!canTriggerElection}
            fullWidth
          />
        )
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta chips */}
        {(neighborhood.areaSqkm || neighborhood.councilMemberCapacity) && (
          <View style={styles.metaRow}>
            {neighborhood.areaSqkm ? (
              <Chip icon="map" tone="steel" value={fa1(neighborhood.areaSqkm)} label="کیلومتر مربع مساحت" />
            ) : null}
            {isChair ? <Chip icon="ribbon" tone="brass" label="رئیس شورای فعلی" /> : null}
          </View>
        )}

        {/* Chairman hero card */}
        <Card cornerTicks>
          <Text variant="label" color="brand" style={styles.chairKicker}>
            رئیس شورای محله
          </Text>
          {chairMember ? (
            <View style={styles.chairmanRow}>
              <View style={[styles.avatar, { backgroundColor: chairMember.avatarColor || c.ink[500] }]}>
                <Text variant="subtitle" weight="bold" color="inverse">
                  {chairMember.username?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.chairmanTexts}>
                <Text variant="title" weight="bold" numberOfLines={1}>
                  {chairMember.username}
                </Text>
                <View style={styles.chairStats}>
                  <Chip icon="flash" tone="terracotta" value={fa(chairMember.power ?? 0)} label="قدرت" />
                  <Chip icon="star" tone="jade" value={fa(chairMember.popularity ?? 0)} label="محبوبیت" />
                </View>
              </View>
            </View>
          ) : (
            <Text variant="body" color="secondary" style={styles.chairEmpty}>
              در انتظار برگزاری انتخابات...
            </Text>
          )}
        </Card>

        {/* Council members */}
        <SectionTitle
          kicker="شورا"
          title="اعضای شورا"
          trailing={
            <Text variant="caption" color="secondary" style={styles.tabular}>
              {fa(councilMembers.length)} / {fa(capacity)}
            </Text>
          }
        />

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={c.brass[400]} />
          </View>
        ) : councilMembers.length === 0 ? (
          <EmptyState
            icon="people"
            tone="neutral"
            title="هنوز عضوی در شورا وجود ندارد."
            style={styles.emptyCompact}
          />
        ) : (
          <View style={styles.membersList}>
            {councilMembers.map((m, i) => {
              const isLowest = lowestPowerMember?.playerId === m.playerId && isFull;
              return (
                <Animated.View
                  key={m.playerId}
                  entering={FadeInDown.delay(Motion.stagger(i)).duration(Motion.durations.normal)}
                >
                  <View
                    style={[
                      styles.memberRow,
                      isLowest && styles.memberRowAtRisk,
                    ]}
                  >
                    <View style={[styles.avatarSmall, { backgroundColor: m.avatarColor || c.ink[500] }]}>
                      <Text variant="caption" weight="bold" color="inverse">
                        {m.username?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View style={styles.memberTexts}>
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {m.username}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.tabular}>
                        قدرت: {fa(m.power ?? 0)}
                      </Text>
                    </View>
                    {isLowest && !isMember && (
                      <View style={styles.atRiskBadge}>
                        <Text variant="label" color="error" weight="semibold">
                          در خطر جایگزینی
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Membership requirements (non-members) */}
        {!isMember && (
          <View style={styles.requirementsSection}>
            <SectionTitle kicker="عضویت" title="شرایط عضویت" />
            <Card padded={false}>
              <RequirementRow
                icon={meetsPopularity ? 'checkmark-circle' : 'close-circle'}
                iconTone={meetsPopularity ? 'jade' : 'crimson'}
                label={`محبوبیت محله (حداقل ${fa(neighborhood.minCouncilPopularity ?? 50)})`}
              />
              <View style={styles.reqDivider} />
              <RequirementRow
                icon="information-circle"
                iconTone="steel"
                label="مالکیت خانه در محله"
                trailing={
                  <Text variant="caption" color="muted">
                    بررسی خودکار هنگام درخواست
                  </Text>
                }
              />
              {isFull && lowestPowerMember && (
                <>
                  <View style={styles.reqDivider} />
                  <RequirementRow
                    icon={meetsPowerToReplace ? 'checkmark-circle' : 'close-circle'}
                    iconTone={meetsPowerToReplace ? 'jade' : 'crimson'}
                    label={`قدرت بیشتر از ${fa(lowestPowerMember.power ?? 0)}`}
                  />
                </>
              )}
              <View style={styles.reqDivider} />
              <RequirementRow
                icon={hasCash ? 'checkmark-circle' : 'close-circle'}
                iconTone={hasCash ? 'jade' : 'crimson'}
                label={`هزینه بررسی صلاحیت (${fa(APPLICATION_COST)} تومان)`}
              />
            </Card>
          </View>
        )}

        {/* Member dashboard note (primary action lives in the Sheet footer) */}
        {isMember && (
          <Card style={canTriggerElection ? styles.memberCardActive : undefined}>
            <View style={styles.memberNoteRow}>
              <IconPlate name="checkmark-circle" size="sm" tone="jade" />
              <View style={styles.memberNoteTexts}>
                <Text variant="body" weight="semibold" color="success">
                  شما عضو شورای این محله هستید
                </Text>
                {!canTriggerElection && lastSelection ? (
                  <Text variant="caption" color="secondary" style={styles.tabular}>
                    انتخابات بعدی در: {new Date(lastSelection.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR')}
                  </Text>
                ) : (
                  <Text variant="caption" color="secondary">
                    می‌توانید انتخابات رئیس شورا را برگزار کنید.
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </Sheet>
  );
}

// ─── Requirement row (geometry only — stays module-level) ─────────────────────

const RequirementRow: React.FC<{
  icon: React.ComponentProps<typeof IconPlate>['name'];
  iconTone: React.ComponentProps<typeof IconPlate>['tone'];
  label: string;
  trailing?: React.ReactNode;
}> = ({ icon, iconTone, label, trailing }) => (
  <View style={reqRowStyles.row}>
    <IconPlate name={icon} size="xxs" tone={iconTone} bordered={false} />
    <Text variant="body" color="secondary" style={reqRowStyles.label}>
      {label}
    </Text>
    {trailing}
  </View>
);

const reqRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  label: {
    flex: 1,
  },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    scrollContent: {
      gap: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    tabular: {
      fontVariant: ['tabular-nums'],
    },

    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },

    chairKicker: {
      marginBottom: Spacing.md,
    },
    chairmanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: Radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border.strong,
    },
    chairmanTexts: {
      flex: 1,
      gap: Spacing.xs + 2,
    },
    chairStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    chairEmpty: {
      marginTop: Spacing.xs,
    },

    loadingBox: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    emptyCompact: {
      paddingVertical: Spacing.xl,
    },

    membersList: {
      gap: Spacing.sm,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      backgroundColor: c.ink[700],
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border.subtle,
      minHeight: 44,
    },
    memberRowAtRisk: {
      borderColor: `${c.crimson}66`,
      backgroundColor: `${c.crimson}0D`,
    },
    avatarSmall: {
      width: 36,
      height: 36,
      borderRadius: Radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberTexts: {
      flex: 1,
      gap: 1,
    },
    atRiskBadge: {
      backgroundColor: `${c.crimson}1F`,
      borderWidth: 1,
      borderColor: `${c.crimson}4D`,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.sm,
    },

    requirementsSection: {
      gap: Spacing.md,
    },
    reqDivider: {
      height: 1,
      backgroundColor: c.border.subtle,
    },

    memberCardActive: {
      borderColor: `${c.jade}4D`,
    },
    memberNoteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    memberNoteTexts: {
      flex: 1,
      gap: 2,
    },
  });
