/**
 * BuildIran — Neighborhood Editor Review Panel — «Gentleman Neon» (v2)
 * Visible to high-power players (power >= minEditorPower in the neighborhood).
 * Allows neighborhood editors to review, approve, or reject player-proposed
 * building types. All store calls, power checks, audio and alerts unchanged;
 * public props ({visible, onClose}) unchanged.
 */

import { Text } from '@/components/ui/Text';
import { Sheet } from '@/components/ui/Sheet';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconPlate } from '@/components/ui/IconPlate';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Radii, Motion } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { GameAudio } from '@/lib/audio';
import { useNeighborhoodStore } from '@/store/useNeighborhoodStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { CustomBuildingType } from '@/types/game.types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const fa = (n: number) => n.toLocaleString('fa-IR');

interface NeighborhoodEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NeighborhoodEditorModal({ visible, onClose }: NeighborhoodEditorModalProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

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
    <Sheet
      visible={visible}
      onClose={onClose}
      title="پنل بازبینی ویرایشگران محله"
      subtitle={`محله ${currentNeighborhood.nameFa} (${currentNeighborhood.city})`}
      maxHeight={0.88}
    >
      {/* Power status */}
      <Card padded={false} style={isEditor ? styles.powerCardActive : undefined}>
        <View style={styles.powerRow}>
          <IconPlate
            name={isEditor ? 'shield-checkmark' : 'lock-closed'}
            size="sm"
            tone={isEditor ? 'jade' : 'neutral'}
          />
          <View style={styles.powerTexts}>
            <Text variant="body" weight="semibold" color={isEditor ? 'success' : 'secondary'}>
              {isEditor ? 'ویرایشگر مجاز' : 'فاقد قدرت کافی'}
            </Text>
            <Text variant="caption" color="secondary" style={styles.tabular}>
              قدرت شما: {fa(player.power)} / حداقل {fa(currentNeighborhood.minEditorPower)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Neighborhood selector chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {neighborhoods.map((n) => {
          const active = currentNeighborhood.id === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.nbChip, active && styles.nbChipActive]}
              onPress={() => {
                setCurrentNeighborhood(n);
                GameAudio.playTap();
              }}
              hitSlop={{ top: 8, bottom: 8 }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`محله ${n.nameFa}`}
            >
              <Ionicons
                name="location"
                size={13}
                color={active ? c.brass[400] : c.text.muted}
              />
              <Text
                variant="caption"
                weight={active ? 'bold' : 'medium'}
                color={active ? 'brand' : 'secondary'}
              >
                {n.nameFa}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {!isEditor ? (
        <EmptyState
          icon="lock-closed"
          tone="neutral"
          title="شما هنوز ویرایشگر این محله نیستید"
          body={`برای کسب حق رأی و ویرایشگری در محله «${currentNeighborhood.nameFa}»، باید با ساخت و ارتقای سازه‌ها قدرت نفوذ خود را به حداقل ${fa(currentNeighborhood.minEditorPower)} برسانید (قدرت فعلی: ${fa(player.power)}).`}
        />
      ) : isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={c.brass[400]} />
          <Text variant="caption" color="secondary">
            در حال دریافت طرح‌ها...
          </Text>
        </View>
      ) : pendingProposals.length === 0 ? (
        <EmptyState
          icon="mail-open"
          tone="steel"
          title="هیچ طرح معلقی وجود ندارد"
          body="تمامی طرح‌های پیشنهادی بازیکنان در این محله بررسی شده‌اند."
        />
      ) : (
        <View style={styles.proposalList}>
          <SectionTitle
            kicker="بازبینی"
            title="طرح‌های در انتظار بررسی"
            trailing={<Chip value={pendingProposals.length} tone="brass" />}
          />

          {pendingProposals.map((p, i) => {
            const isSelected = selectedProposal?.id === p.id;
            return (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(Motion.stagger(i)).duration(Motion.durations.normal)}
              >
                <Card
                  padded={false}
                  elevated={isSelected}
                  style={[styles.proposalCard, isSelected && styles.proposalCardSelected]}
                >
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => {
                      setSelectedProposal(isSelected ? null : p);
                      GameAudio.playTap();
                    }}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isSelected }}
                  >
                    <IconPlate name="business" tone="brass" size="md" />
                    <View style={styles.cardHeaderTexts}>
                      <Text variant="subtitle" weight="semibold">
                        {p.nameFa}
                      </Text>
                      <Text variant="caption" color="muted">
                        دسته‌بندی: {p.category}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={c.text.secondary}
                    />
                  </TouchableOpacity>

                  {/* Expanded proposal details */}
                  {isSelected && (
                    <View style={styles.detailsContainer}>
                      <Text variant="body" color="secondary">
                        {p.descriptionFa}
                      </Text>

                      {/* Stats chips */}
                      <View style={styles.statsRow}>
                        <Chip icon="cash" tone="brass" value={fa(p.baseCost)} label="هزینه پایه" />
                        <Chip icon="flash" tone="terracotta" value={`+${fa(p.powerBonus)}`} label="پاداش قدرت" />
                        <Chip icon="trending-up" tone="jade" value={fa(p.incomeRate)} label="درآمد ساعتی" />
                      </View>

                      {/* Custom settings */}
                      {p.customSettings && Object.keys(p.customSettings).length > 0 && (
                        <View style={styles.customFeatureBox}>
                          <View style={styles.customFeatureTitleRow}>
                            <IconPlate name="sparkles" size="xxs" tone="brass" bordered={false} />
                            <Text variant="label" color="brand">
                              قابلیت ویژه پیشنهادی:
                            </Text>
                          </View>
                          <Text variant="caption" color="primary">
                            {p.customSettings.specialFeature || JSON.stringify(p.customSettings)}
                          </Text>
                        </View>
                      )}

                      {/* Review note */}
                      <Input
                        value={reviewNotes}
                        onChangeText={setReviewNotes}
                        placeholder="یادداشت یا دلیل تصمیم‌گیری برای سازنده طرح..."
                        multiline
                        textAlignVertical="top"
                      />

                      {/* Actions — single primary (approve), reject is danger */}
                      <View style={styles.actionsRow}>
                        <Button
                          label="رد طرح"
                          variant="danger"
                          size="sm"
                          onPress={() => handleReject(p)}
                          disabled={actionLoading}
                          style={styles.actionBtn}
                        />
                        <Button
                          label="تأیید و انتشار در نقشه"
                          size="sm"
                          onPress={() => handleApprove(p)}
                          loading={actionLoading}
                          style={styles.actionBtn}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    tabular: {
      fontVariant: ['tabular-nums'],
    },

    powerCardActive: {
      borderColor: `${c.jade}4D`,
    },
    powerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
    },
    powerTexts: {
      flex: 1,
      gap: 2,
    },

    chipsScroll: {
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    nbChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
      backgroundColor: c.ink[600],
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: Radii.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
    },
    nbChipActive: {
      borderColor: c.border.brand,
      backgroundColor: `${c.brass[400]}1F`,
    },

    loadingBox: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing['2xl'],
    },

    proposalList: {
      gap: Spacing.md,
    },
    proposalCard: {
      overflow: 'hidden',
    },
    proposalCardSelected: {
      borderColor: c.border.brand,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      minHeight: 44,
    },
    cardHeaderTexts: {
      flex: 1,
      gap: 1,
    },

    detailsContainer: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border.subtle,
      gap: Spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    customFeatureBox: {
      backgroundColor: `${c.brass[400]}0F`,
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: `${c.brass[400]}33`,
      gap: Spacing.xs + 2,
    },
    customFeatureTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionBtn: {
      flex: 1,
    },
  });
