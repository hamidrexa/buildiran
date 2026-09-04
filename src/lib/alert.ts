/**
 * BuildIran — Cross-Platform Alert / Confirm Helper
 * RN's Alert.alert doesn't reliably invoke onPress for multi-button
 * dialogs on web (react-native-web). This wrapper falls back to
 * window.confirm/alert on web so confirmations (logout, destructive
 * actions, OAuth errors, etc.) always actually fire.
 */
import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  },
) {
  const confirmText = options?.confirmText ?? "تأیید";
  const cancelText = options?.cancelText ?? "انصراف";

  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.confirm(`${title}\n\n${message}`)
    ) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    {
      text: confirmText,
      style: options?.destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
