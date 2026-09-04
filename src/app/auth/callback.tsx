import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function AuthCallback() {
  useEffect(() => {
    const handleUrl = async () => {
      try {
        // For web, use window.location.href; for native, use Linking
        let url = await Linking.getInitialURL();
        
        // Fallback for web: use window.location.search
        if (!url && typeof window !== 'undefined' && window.location.search) {
          url = window.location.href;
        }
        
        if (!url) {
          router.replace("/auth/login");
          return;
        }

        const parsed = Linking.parse(url);
        const access_token = parsed.queryParams?.access_token as string;
        const refresh_token = parsed.queryParams?.refresh_token as string;
        const error = parsed.queryParams?.error as string;
        const error_description = parsed.queryParams?.error_description as string;

        // Check for OAuth error
        if (error) {
          console.error("[AuthCallback] OAuth error:", error, error_description);
          Alert.alert("خطا", error_description || "ورود با گوگل ناموفق بود");
          router.replace("/auth/login");
          return;
        }

        if (!access_token || !refresh_token) {
          console.error("[AuthCallback] Missing tokens in URL");
          router.replace("/auth/login");
          return;
        }

        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("[AuthCallback] Session error:", sessionError.message);
          router.replace("/auth/login");
          return;
        }

        // Verify user exists
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("[AuthCallback] No user after session set");
          router.replace("/auth/login");
          return;
        }

        // Check if profile exists, if not create one
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.log("[AuthCallback] Creating profile for new user");
          // Create profile for new Google user
          const username = user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split("@")[0] ||
                          `player_${user.id.slice(0, 8)}`;
          const avatar_color = user.user_metadata?.avatar_url ? "#6C63FF" : "#EC4899";

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: username,
              avatar_color: avatar_color,
            });

          if (insertError) {
            console.error("[AuthCallback] Profile creation error:", insertError.message);
            // Continue anyway, profile might be created by trigger
          }
        }

        // Success - redirect to game
        router.replace("/(game)");
      } catch (err: any) {
        console.error("[AuthCallback] Unexpected error:", err.message);
        router.replace("/auth/login");
      }
    };

    handleUrl();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080C1A",
  },
});
