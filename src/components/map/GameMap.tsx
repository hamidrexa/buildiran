import { Text } from "@/components/ui/Text";
import type { GameMapProps } from "@/types/map.types";
import Constants from "expo-constants";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export type { GameMapProps } from "@/types/map.types";

// MapLibre links `MLRNCameraModule`, which only exists in a custom
// development build or production binary. When the app is running inside
// Expo Go we render a friendly fallback instead of requiring the native
// module, so the rest of the UI keeps working.
function isExpoGo(): boolean {
  const c = Constants as unknown as {
    appOwnership?: string;
    executionEnvironment?: string;
  };
  if (c.appOwnership) return c.appOwnership === "expo";
  return c.executionEnvironment === "expo";
}

const MapUnavailable: React.FC = () => (
  <View style={fallbackStyles.container}>
    <Text variant="body" color="primary" center>
      نقشه در نسخه آزمایشی موبایل در دسترس نیست. برای استفاده از نقشه، یک
      Development Build بسازید.
    </Text>
  </View>
);

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0B0B0B",
  },
});

export const GameMap: React.FC<GameMapProps> = (props) => {
  let MapComponent;
  if (Platform.OS === "web") {
    MapComponent = require("./GameMap.web").default;
  } else if (isExpoGo()) {
    MapComponent = MapUnavailable;
  } else {
    MapComponent = require("./GameMap.native").default;
  }

  return (
    <View style={styles.container}>
      <MapComponent {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});

export default GameMap;
