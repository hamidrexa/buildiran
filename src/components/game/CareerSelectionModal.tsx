import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { GameAudio } from "@/lib/audio";
import { BlurView } from "expo-blur";
import { CAREER_PATHS, type CareerPathId } from "@/lib/careers";
import { usePlayerStore } from "@/store/usePlayerStore";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CareerSelectionModal: React.FC<Props> = ({ visible, onClose }) => {
  const player = usePlayerStore((s) => s.player);
  const setCareerPath = usePlayerStore((s) => s.setCareerPath);

  if (!visible || !player) return null;

  const currentPath = player.careerPath;

  const handleSelectPath = (pathId: CareerPathId) => {
    GameAudio.playTap?.();
    setCareerPath(pathId);
    onClose();
  };

  return (
    <Animated.View
      style={styles.overlay}
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      {/* Background Blur */}
      <BlurView style={StyleSheet.absoluteFillObject} intensity={40} tint="dark" />

      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" color="primary">مسیر شغلی شما</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text variant="body" color="secondary" style={styles.subtitle}>
          یک مسیر شغلی انتخاب کنید تا بوف‌های اختصاصی دریافت کنید و ماموریت‌های داستانی مربوط به آن را دنبال کنید. شما می‌توانید هر زمان که خواستید مسیر خود را تغییر دهید.
        </Text>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {Object.values(CAREER_PATHS).map((career) => {
            const isActive = currentPath === career.id;

            return (
              <TouchableOpacity
                key={career.id}
                style={[
                  styles.card,
                  { borderColor: isActive ? career.color : '#334155' },
                  isActive && { backgroundColor: `${career.color}15` }
                ]}
                onPress={() => handleSelectPath(career.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${career.color}30` }]}>
                    <Text style={{ fontSize: 24 }}>{career.icon}</Text>
                  </View>
                  <View style={styles.cardTitle}>
                    <Text variant="h3" color="primary" style={{ color: isActive ? career.color : '#F8FAFC' }}>
                      {career.nameFa}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: career.color }]}>
                        <Text variant="caption" color="primary" style={{ fontSize: 10 }}>فعال</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text variant="body" color="secondary" style={styles.cardDesc}>
                  {career.descriptionFa}
                </Text>

                <View style={styles.buffBox}>
                  <Ionicons name="flash" size={14} color={career.color} />
                  <Text variant="caption" color="primary" style={{ color: career.color, marginLeft: 4 }}>
                    {career.buffFa}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 200,
  },
  modalContainer: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 20,
    textAlign: "right",
  },
  scrollArea: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  cardTitle: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardDesc: {
    textAlign: "right",
    marginBottom: 12,
    lineHeight: 22,
  },
  buffBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
});
